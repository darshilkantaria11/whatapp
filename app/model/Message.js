import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  phone: String,
  direction: String, // incoming or outgoing
  content: String,   // text body or caption
  type: String,      // text, image, video, audio, sticker, etc.
  mediaUrl: String,  // URL for media (if not text)
  caption: String,   // For caption accompanying media
  timestamp: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.models.Message || mongoose.model('Message', MessageSchema);
