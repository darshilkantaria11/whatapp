import { connectToDB } from '../../lib/db';
import Message from '../../model/Message';
import { NextResponse } from 'next/server';

export async function GET() {
  await connectToDB();
  const allMessages = await Message.find().sort({ timestamp: -1 }).lean();

  const chats = {};
  allMessages.forEach(msg => {
    const phone = msg.phone;
    if (!chats[phone]) {
      chats[phone] = {
        messages: [],
        unreadCount: 0,
        lastMessage: msg.timestamp,
      };
    }
    chats[phone].messages.push(msg);
    if (!msg.read && msg.direction === 'incoming') {
      chats[phone].unreadCount++;
    }
    if (msg.timestamp > chats[phone].lastMessage) {
      chats[phone].lastMessage = msg.timestamp;
    }
  });

  return NextResponse.json(chats);
}