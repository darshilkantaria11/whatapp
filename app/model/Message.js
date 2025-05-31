import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  phone: String,
  direction: String, // incoming or outgoing
  content: String,
  type: String, // text, image, audio, sticker, etc.
  timestamp: { type: Date, default: Date.now },
  mediaUrl: String, // for non-text messages
}, { timestamps: true });

export default mongoose.models.Message || mongoose.model('Message', MessageSchema);
