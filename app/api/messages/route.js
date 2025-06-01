// /api/messages
import { connectToDB } from '../../lib/db';
import Message from '../../model/Message';
import { NextResponse } from 'next/server';

export async function GET() {
  await connectToDB();
  
  // Get all messages sorted chronologically
  const allMessages = await Message.find().sort({ timestamp: 1 }).lean();

  const grouped = {};
  
  allMessages.forEach((msg) => {
    const phone = msg.phone;
    if (!grouped[phone]) {
      grouped[phone] = {
        messages: [],
        unreadCount: 0,
        lastMessage: msg.timestamp,
      };
    }
    
    grouped[phone].messages.push(msg);
    
    // Count unread incoming messages
    if (!msg.read && msg.direction === 'incoming') {
      grouped[phone].unreadCount++;
    }
    
    // Track latest message timestamp
    if (new Date(msg.timestamp) > new Date(grouped[phone].lastMessage)) {
      grouped[phone].lastMessage = msg.timestamp;
    }
  });

  return NextResponse.json(grouped);
}