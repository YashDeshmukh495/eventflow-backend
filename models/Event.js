import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  venue: {
    type: String,
    required: true,
  },
  capacity: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    default: 'Technical',
  },
  bannerImage: {
    type: String,
    required: true,
  },
  agenda: {
    type: String,
    default: '',
  },
  requirements: {
    type: String,
    default: '',
  },
  benefits: {
    type: String,
    default: '',
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

const Event = mongoose.model('Event', eventSchema);

export default Event;
