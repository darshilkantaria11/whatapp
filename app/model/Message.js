import mongoose from 'mongoose';

// model/Message.js
const MessageSchema = new mongoose.Schema({
  phone: String,
  direction: String,
  content: String,
  type: String,
  mediaUrl: String,
  caption: String,
  read: { type: Boolean, default: false }, // Add this field
  timestamp: { type: Date, default: Date.now }, // Add this field
}, { timestamps: true });

export default mongoose.models.Message || mongoose.model('Message', MessageSchema);