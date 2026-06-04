import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import OpenAI from 'openai';
import axios from 'axios';

const getAIConfig = () => {
  const openAIKey = process.env.OPENAI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (openAIKey && openAIKey.startsWith('sk-')) {
    return { type: 'openai', key: openAIKey };
  }

  if (geminiKey) {
    if (geminiKey.startsWith('sk-')) {
      return { type: 'openai', key: geminiKey };
    }
    return { type: 'gemini', key: geminiKey };
  }

  return { type: 'none' };
};

// @desc    Get all events
// @route   GET /api/events
// @access  Public
export const getEvents = async (req, res) => {
  try {
    const { search, category } = req.query;
    const filter = {};

    if (category && category !== 'All') {
      filter.category = category;
    }

    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [
        { title: regex },
        { venue: regex },
        { description: regex }
      ];
    }

    const eventsList = await Event.find(filter).sort({ date: 1 });
    
    // Compute registrationsCount for each event
    const enrichedEvents = [];
    for (const event of eventsList) {
      const regsCount = await Registration.countDocuments({ eventId: event._id.toString() });
      enrichedEvents.push({
        _id: event._id.toString(),
        id: event._id.toString(),
        title: event.title,
        description: event.description,
        date: event.date,
        time: event.time,
        venue: event.venue,
        capacity: event.capacity,
        category: event.category,
        bannerImage: event.bannerImage,
        agenda: event.agenda,
        requirements: event.requirements,
        benefits: event.benefits || '',
        createdBy: event.createdBy,
        createdAt: event.createdAt,
        registrationsCount: regsCount
      });
    }

    res.json(enrichedEvents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get event by ID
// @route   GET /api/events/:id
// @access  Public
export const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (event) {
      const regsCount = await Registration.countDocuments({ eventId: event._id.toString() });
      res.json({ 
        _id: event._id.toString(), 
        id: event._id.toString(), 
        title: event.title,
        description: event.description,
        date: event.date,
        time: event.time,
        venue: event.venue,
        capacity: event.capacity,
        category: event.category,
        bannerImage: event.bannerImage,
        agenda: event.agenda,
        requirements: event.requirements,
        benefits: event.benefits || '',
        createdBy: event.createdBy,
        createdAt: event.createdAt,
        registrationsCount: regsCount
      });
    } else {
      res.status(404).json({ message: 'Event not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create Event
// @route   POST /api/events
// @access  Private/Admin
export const createEvent = async (req, res) => {
  const { title, description, date, time, venue, capacity, category, bannerImage, agenda, requirements, benefits } = req.body;

  try {
    const event = await Event.create({
      title,
      description,
      date,
      time,
      venue,
      capacity: Number(capacity),
      category,
      bannerImage,
      agenda: agenda || '',
      requirements: requirements || '',
      benefits: benefits || '',
      createdBy: req.user.uid
    });

    res.status(201).json({ 
      _id: event._id.toString(), 
      id: event._id.toString(),
      title: event.title,
      description: event.description,
      date: event.date,
      time: event.time,
      venue: event.venue,
      capacity: event.capacity,
      category: event.category,
      bannerImage: event.bannerImage,
      agenda: event.agenda,
      requirements: event.requirements,
      benefits: event.benefits,
      createdBy: event.createdBy,
      createdAt: event.createdAt
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update Event
// @route   PUT /api/events/:id
// @access  Private/Admin
export const updateEvent = async (req, res) => {
  const { title, description, date, time, venue, capacity, category, bannerImage, agenda, requirements, benefits } = req.body;

  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (title !== undefined) event.title = title;
    if (description !== undefined) event.description = description;
    if (date !== undefined) event.date = date;
    if (time !== undefined) event.time = time;
    if (venue !== undefined) event.venue = venue;
    if (capacity !== undefined) event.capacity = Number(capacity);
    if (category !== undefined) event.category = category;
    if (bannerImage !== undefined) event.bannerImage = bannerImage;
    if (agenda !== undefined) event.agenda = agenda;
    if (requirements !== undefined) event.requirements = requirements;
    if (benefits !== undefined) event.benefits = benefits;

    await event.save();
    
    res.json({ 
      _id: event._id.toString(), 
      id: event._id.toString(), 
      title: event.title,
      description: event.description,
      date: event.date,
      time: event.time,
      venue: event.venue,
      capacity: event.capacity,
      category: event.category,
      bannerImage: event.bannerImage,
      agenda: event.agenda,
      requirements: event.requirements,
      benefits: event.benefits,
      createdBy: event.createdBy,
      createdAt: event.createdAt
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete Event
// @route   DELETE /api/events/:id
// @access  Private/Admin
export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Delete associated registrations and attendance records
    await Registration.deleteMany({ eventId: req.params.id });
    await Event.deleteOne({ _id: req.params.id });

    res.json({ message: 'Event removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Generate event data using AI
// @route   POST /api/events/ai-generate
// @access  Private/Admin
export const generateEventAI = async (req, res) => {
  const { promptType, title, category, description } = req.body;

  if (!title || !category) {
    return res.status(400).json({ message: 'Title and category are required' });
  }

  const config = getAIConfig();

  if (config.type === 'openai') {
    try {
      let prompt = '';
      if (promptType === 'description') {
        prompt = `Generate a compelling, professional event description for a college event titled "${title}" in the category "${category}". The tone should be engaging, informative, and inviting for students. Keep it around 150-200 words. Do not include markdown headers or list prefixes, just the paragraph text.`;
      } else if (promptType === 'agenda') {
        prompt = `Create a realistic event agenda/schedule for a college event titled "${title}" categorized under "${category}". If available, here is the description: "${description}". Format the output as a neat timeline or clean schedule using bullet points or time slots (e.g. 10:00 AM - 11:00 AM: Intro). Keep it concise.`;
      } else if (promptType === 'requirements') {
        prompt = `List the requirements, prerequisites, or preparation steps for students attending the college event "${title}" in the category "${category}". If available, here is the description: "${description}". Format the output as bullet points. Examples: laptops, pre-registrations, software to install, or basic knowledge. Keep it concise.`;
      } else {
        return res.status(400).json({ message: 'Invalid promptType' });
      }

      const openai = new OpenAI({ apiKey: config.key });
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 400,
        temperature: 0.7,
      });

      const generatedText = response.choices[0].message.content.trim();
      return res.json({ result: generatedText });
    } catch (error) {
      console.error('OpenAI Error, falling back to mock: ', error.message);
    }
  } else if (config.type === 'gemini') {
    try {
      let prompt = '';
      if (promptType === 'description') {
        prompt = `Generate a compelling, professional event description for a college event titled "${title}" in the category "${category}". The tone should be engaging, informative, and inviting for students. Keep it around 150-200 words. Do not include markdown headers or list prefixes, just the paragraph text.`;
      } else if (promptType === 'agenda') {
        prompt = `Create a realistic event agenda/schedule for a college event titled "${title}" categorized under "${category}". If available, here is the description: "${description}". Format the output as a neat timeline or clean schedule using bullet points or time slots (e.g. 10:00 AM - 11:00 AM: Intro). Keep it concise.`;
      } else if (promptType === 'requirements') {
        prompt = `List the requirements, prerequisites, or preparation steps for students attending the college event "${title}" in the category "${category}". If available, here is the description: "${description}". Format the output as bullet points. Examples: laptops, pre-registrations, software to install, or basic knowledge. Keep it concise.`;
      } else {
        return res.status(400).json({ message: 'Invalid promptType' });
      }

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${config.key}`,
        {
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
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
        const generatedText = response.data.candidates[0].content.parts[0].text.trim();
        return res.json({ result: generatedText });
      } else {
        throw new Error('Invalid response structure from Gemini API');
      }
    } catch (error) {
      console.error('Gemini Error, falling back to mock: ', error.response?.data || error.message);
    }
  }

  // Fallback / Mock AI Generator
  let resultText = '';
  if (promptType === 'description') {
    resultText = `Welcome to EventFlow's featured college event: "${title}". This exciting event in the "${category}" category is designed to provide students with a collaborative environment to connect, learn, and grow. Join your peers and industry experts for an immersive experience that features hands-on training, interactive sessions, and networking opportunities. Whether you want to expand your professional portfolio, gain valuable skills, or simply meet new friends with similar interests, this event is the perfect place. We look forward to seeing you there!`;
  } else if (promptType === 'agenda') {
    resultText = `• 09:00 AM - 09:30 AM: Registration and Welcome Drinks\n• 09:30 AM - 10:30 AM: Keynote Presentation & Icebreaker Sessions\n• 10:30 AM - 12:30 PM: Morning Interactive Workshop Session\n• 12:30 PM - 01:30 PM: Networking Lunch & Mentorship Hour\n• 01:30 PM - 03:30 PM: Practical Hands-on Group Activity\n• 03:30 PM - 04:00 PM: Q&A, Panel Discussion & Closing Ceremony`;
  } else if (promptType === 'requirements') {
    resultText = `• Valid college student ID card\n• Pre-event registration confirmation on EventFlow\n• Personal laptop with charger (recommended for workshops)\n• Basic knowledge or curiosity about "${category}" concepts\n• Enthusiasm to learn and participate in group discussions!`;
  } else {
    return res.status(400).json({ message: 'Invalid promptType' });
  }

  return res.json({ result: resultText });
};
