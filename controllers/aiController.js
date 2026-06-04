import axios from 'axios';
import OpenAI from 'openai';

// Helper to convert array or object values from AI into clean bullet-pointed text strings
const convertToString = (val) => {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) {
    return val.map(item => {
      if (typeof item === 'string') {
        return item.startsWith('•') || item.startsWith('-') ? item : `• ${item}`;
      }
      return `• ${JSON.stringify(item)}`;
    }).join('\n');
  }
  if (typeof val === 'object') {
    return Object.entries(val).map(([key, value]) => {
      if (value && typeof value === 'object') {
        const subContent = Object.entries(value).map(([k, v]) => `  - ${k}: ${v}`).join('\n');
        return `• ${key}:\n${subContent}`;
      }
      return `• ${key}: ${value}`;
    }).join('\n');
  }
  return String(val);
};

// @desc    Generate event plan using Gemini AI (with automatic OpenAI fallback if key starts with sk-)
// @route   POST /api/ai/generate-event
// @access  Private/Admin
export const generateEventPlan = async (req, res) => {
  const { title } = req.body;

  if (!title) {
    return res.status(400).json({ message: 'Event title is required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ message: 'GEMINI_API_KEY is not configured on the backend.' });
  }

  const prompt = `Generate a professional college event plan.
Event Title: ${title}

Return JSON format:
{
  "description": "",
  "agenda": "",
  "requirements": "",
  "benefits": ""
}

Description:
100-150 words.

Agenda:
Bullet points.

Requirements:
Bullet points.

Benefits:
Bullet points.`;

  // Detect if the user input an OpenAI key under GEMINI_API_KEY
  if (apiKey.startsWith('sk-')) {
    try {
      console.log('OpenAI key detected in GEMINI_API_KEY. Generating using gpt-4o-mini...');
      const openai = new OpenAI({ apiKey });
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      });

      const jsonText = response.choices[0].message.content.trim();
      const parsedData = JSON.parse(jsonText);
      
      return res.status(200).json({
        description: convertToString(parsedData.description),
        agenda: convertToString(parsedData.agenda),
        requirements: convertToString(parsedData.requirements),
        benefits: convertToString(parsedData.benefits)
      });
    } catch (error) {
      console.error('OpenAI Generation Error:', error.message);
      return res.status(500).json({ message: 'AI generation failed. Please try again.' });
    }
  }

  // Otherwise, use Google Gemini API
  try {
    console.log('Gemini key detected. Generating using gemini-flash-latest...');
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
      {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (
      response.data &&
      response.data.candidates &&
      response.data.candidates[0] &&
      response.data.candidates[0].content &&
      response.data.candidates[0].content.parts &&
      response.data.candidates[0].content.parts[0]
    ) {
      const jsonText = response.data.candidates[0].content.parts[0].text;
      const parsedData = JSON.parse(jsonText);
      
      return res.status(200).json({
        description: convertToString(parsedData.description),
        agenda: convertToString(parsedData.agenda),
        requirements: convertToString(parsedData.requirements),
        benefits: convertToString(parsedData.benefits)
      });
    } else {
      throw new Error('Invalid response structure from Gemini API');
    }
  } catch (error) {
    console.error('Gemini Generation Error:', error.response?.data || error.message);
    res.status(500).json({ message: 'AI generation failed. Please try again.' });
  }
};
