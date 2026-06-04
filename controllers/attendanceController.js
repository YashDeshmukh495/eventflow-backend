import Attendance from '../models/Attendance.js';
import Registration from '../models/Registration.js';
import Event from '../models/Event.js';
import Session from '../models/Session.js';
import crypto from 'crypto';

// @desc    Generate a dynamic attendance QR session
// @route   POST /api/attendance/session
// @access  Private/Admin
export const createQRSession = async (req, res) => {
  const { eventId } = req.body;

  if (!eventId) {
    return res.status(400).json({ message: 'Event ID is required' });
  }

  try {
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const sessionId = `SES-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
    const timestamp = Date.now();
    
    // QR Expiry 10 minutes (600,000 ms)
    const expiryTime = timestamp + 10 * 60 * 1000; 

    const session = await Session.create({
      eventId,
      sessionId,
      timestamp,
      expiryTime,
      createdBy: req.user.uid
    });

    res.status(201).json({
      _id: session._id.toString(),
      id: session._id.toString(),
      eventId: session.eventId,
      sessionId: session.sessionId,
      timestamp: session.timestamp,
      expiryTime: session.expiryTime,
      createdBy: session.createdBy,
      createdAt: session.createdAt
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify student scanned payload & mark attendance automatically
// @route   POST /api/attendance/verify
// @access  Private (Student)
export const verifyAttendance = async (req, res) => {
  const { qrPayload } = req.body;

  if (!qrPayload) {
    return res.status(400).json({ message: 'Scanned QR payload is required' });
  }

  try {
    // 1. Parse QR payload
    let parsedPayload;
    try {
      parsedPayload = typeof qrPayload === 'string' ? JSON.parse(qrPayload) : qrPayload;
    } catch (e) {
      return res.status(400).json({ message: 'Invalid QR Payload format' });
    }

    const { eventId, sessionId, expiryTime } = parsedPayload;

    if (!eventId || !sessionId || !expiryTime) {
      return res.status(400).json({ message: 'Invalid QR Payload fields' });
    }

    const now = Date.now();

    // 2. Check QR Expiry
    if (now > expiryTime) {
      return res.status(400).json({ message: 'QR Session Expired' });
    }

    // 3. Verify session exists in DB
    const session = await Session.findOne({ sessionId });
    if (!session) {
      return res.status(400).json({ message: 'QR Session Expired' }); 
    }

    // 4. Verify student is registered for this event
    const registration = await Registration.findOne({
      studentId: req.user.uid,
      eventId: eventId
    });

    if (!registration) {
      return res.status(400).json({ message: 'You Are Not Registered For This Event' });
    }

    // 5. Retrieve stored tokenId automatically from database
    const tokenId = registration.tokenId;
    if (!tokenId) {
      return res.status(400).json({ message: 'You Are Not Registered For This Event' });
    }

    // 6. Check if attendance already marked
    if (registration.attendanceStatus === true) {
      return res.status(400).json({ message: 'Attendance Already Marked' });
    }

    // 7. Mark Attendance: Update registration and save log
    const scanTime = new Date();
    registration.attendanceStatus = true;
    registration.markedAt = scanTime;
    await registration.save();

    const attendanceLog = await Attendance.create({
      studentId: req.user.uid,
      eventId,
      tokenId,
      sessionId,
      scanTime
    });

    res.status(200).json({ 
      message: 'Attendance Marked Successfully',
      log: {
        _id: attendanceLog._id.toString(),
        studentId: attendanceLog.studentId,
        eventId: attendanceLog.eventId,
        tokenId: attendanceLog.tokenId,
        sessionId: attendanceLog.sessionId,
        scanTime: attendanceLog.scanTime
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Attendance Analytics for an event
// @route   GET /api/attendance/event/:eventId
// @access  Private/Admin
export const getAttendanceAnalytics = async (req, res) => {
  const { eventId } = req.params;

  try {
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Get all registrations for this event
    const list = await Registration.find({ eventId });

    const totalRegistered = list.length;
    const presentList = [];
    const absentList = [];

    list.forEach((reg) => {
      const student = {
        name: reg.name,
        branch: reg.branch,
        semester: reg.semester,
        tokenId: reg.tokenId,
        scanTime: reg.markedAt || null
      };

      if (reg.attendanceStatus === true) {
        presentList.push(student);
      } else {
        absentList.push(student);
      }
    });

    const present = presentList.length;
    const absent = absentList.length;
    const attendancePercentage = totalRegistered > 0 ? Math.round((present / totalRegistered) * 100) : 0;

    res.json({
      eventTitle: event.title,
      totalRegistered,
      present,
      absent,
      attendancePercentage,
      presentList,
      absentList
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
