import Registration from '../models/Registration.js';
import Event from '../models/Event.js';

// @desc    Get all registrations with filters
// @route   GET /api/admin/students
// @access  Private/Admin
export const getAllRegistrations = async (req, res) => {
  try {
    const query = {};

    if (req.query.name) {
      query.name = { $regex: req.query.name, $options: 'i' };
    }
    if (req.query.branch && req.query.branch !== 'All') {
      query.branch = req.query.branch;
    }
    if (req.query.semester && req.query.semester !== 'All') {
      query.semester = req.query.semester;
    }
    if (req.query.eventId && req.query.eventId !== 'All') {
      query.eventId = req.query.eventId;
    }

    const list = await Registration.find(query).sort({ registeredAt: -1 });
    
    // Add id field helper for backward-compatibility
    const mappedList = list.map(reg => ({
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
      markedAt: reg.markedAt
    }));

    res.json(mappedList);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get global statistics for admin dashboard
// @route   GET /api/admin/analytics
// @access  Private/Admin
export const getDashboardStats = async (req, res) => {
  try {
    const totalEvents = await Event.countDocuments({});
    const totalRegistrations = await Registration.countDocuments({});
    const presentCount = await Registration.countDocuments({ attendanceStatus: true });
    const absentCount = await Registration.countDocuments({ attendanceStatus: false });
    const globalAttendancePercentage = totalRegistrations > 0 
      ? Math.round((presentCount / totalRegistrations) * 100) 
      : 0;

    const events = await Event.find({});
    const eventStats = [];

    for (const event of events) {
      const registrations = await Registration.countDocuments({ eventId: event._id.toString() });
      const percentage = event.capacity > 0 
        ? Math.round((registrations / event.capacity) * 100) 
        : 0;

      eventStats.push({
        eventId: event._id.toString(),
        title: event.title,
        registrations,
        capacity: event.capacity,
        percentage
      });
    }

    res.json({
      totalEvents,
      totalRegistrations,
      presentCount,
      absentCount,
      globalAttendancePercentage,
      eventStats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
