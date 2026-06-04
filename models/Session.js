import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  eventId: {
    type: String,
    required: true,
  },
  sessionId: {
    type: String,
    required: true,
    unique: true,
  },
  timestamp: {
    type: Number,
    required: true,
  },
  expiryTime: {
    type: Number,
    required: true,
  },
  createdBy: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Session = mongoose.model('Session', sessionSchema);

export default Session;
