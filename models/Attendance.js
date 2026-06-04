import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: true,
  },
  eventId: {
    type: String,
    required: true,
  },
  tokenId: {
    type: String,
    required: true,
  },
  sessionId: {
    type: String,
    required: true,
  },
  scanTime: {
    type: Date,
    default: Date.now,
  },
});

const Attendance = mongoose.model('Attendance', attendanceSchema);

export default Attendance;
