import mongoose from 'mongoose';

const registrationSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  branch: {
    type: String,
    default: 'N/A',
  },
  semester: {
    type: String,
    default: 'N/A',
  },
  eventId: {
    type: String,
    required: true,
  },
  eventTitle: {
    type: String,
    required: true,
  },
  tokenId: {
    type: String,
    required: true,
  },
  attendanceStatus: {
    type: Boolean,
    default: false,
  },
  registeredAt: {
    type: Date,
    default: Date.now,
  },
  markedAt: {
    type: Date,
  },
});

const Registration = mongoose.model('Registration', registrationSchema);

export default Registration;
