import Registration from '../models/Registration.js';
import Event from '../models/Event.js';
import crypto from 'crypto';

// Helper to generate Token ID: EVT-{EVENTID_SHORT}-{6_RANDOM_CHARS}
const generateTokenId = (eventTitle) => {
  let cleanTitle = eventTitle.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (cleanTitle.length > 6) {
    cleanTitle = cleanTitle.substring(0, 6);
  } else if (cleanTitle.length < 3) {
    cleanTitle = (cleanTitle + 'EVENT').substring(0, 6);
  }

  const randomChars = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 chars
  return `EVT-${cleanTitle}-${randomChars}`;
};

// @desc    Register Student for Event
// @route   POST /api/register
// @access  Private (Student)
export const registerForEvent = async (req, res) => {
  const { eventId } = req.body;

  if (!eventId) {
    return res.status(400).json({ message: 'Event ID is required' });
  }

  try {
    // 1. Get Event Details
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // 2. Check if student already registered
    const existingRegistration = await Registration.findOne({
      studentId: req.user.uid,
      eventId: eventId
    });

    if (existingRegistration) {
      return res.status(400).json({ message: 'You have already registered for this event' });
    }

    // 3. Check Capacity
    const totalRegs = await Registration.countDocuments({ eventId: eventId });

    if (totalRegs >= event.capacity) {
      return res.status(400).json({ message: 'Registration full! No available seats.' });
    }

    // 4. Generate Token ID
    const tokenId = generateTokenId(event.title);

    // 5. Save registration
    const registration = await Registration.create({
      studentId: req.user.uid,
      name: req.user.name,
      email: req.user.email,
      branch: req.user.branch || 'N/A',
      semester: req.user.semester || 'N/A',
      eventId,
      eventTitle: event.title,
      tokenId,
      attendanceStatus: false
    });

    res.status(201).json({
      _id: registration._id.toString(),
      id: registration._id.toString(),
      studentId: registration.studentId,
      name: registration.name,
      email: registration.email,
      branch: registration.branch,
      semester: registration.semester,
      eventId: registration.eventId,
      eventTitle: registration.eventTitle,
      tokenId: registration.tokenId,
      attendanceStatus: registration.attendanceStatus,
      registeredAt: registration.registeredAt
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Registered Events of Logged In Student (My Registrations)
// @route   GET /api/register/my
// @access  Private (Student)
export const getMyRegistrations = async (req, res) => {
  try {
    const list = await Registration.find({ studentId: req.user.uid }).sort({ registeredAt: -1 });
    const registrationsList = [];

    for (const reg of list) {
      const event = await Event.findById(reg.eventId);
      registrationsList.push({
        _id: reg._id.toString(),
        id: reg._id.toString(),
        studentId: reg.studentId,
        name: reg.name,
        email: reg.email,
        branch: reg.branch,
        semester: reg.semester,
        eventId: reg.eventId,
        eventTitle: reg.eventTitle,
        tokenId: reg.tokenId,
        attendanceStatus: reg.attendanceStatus,
        registeredAt: reg.registeredAt,
        markedAt: reg.markedAt,
        event: event ? {
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
          createdBy: event.createdBy,
          createdAt: event.createdAt
        } : null
      });
    }

    res.json(registrationsList);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
