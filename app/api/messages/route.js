import { connectToDB } from '../../lib/db';
import Message from '../../model/Message';
import { NextResponse } from 'next/server';

export async function GET() {
  await connectToDB();
  const allMessages = await Message.find().sort({ createdAt: 1 }).lean();

  const grouped = {};
  allMessages.forEach((msg) => {
    const phone = msg.phone;
    if (!grouped[phone]) grouped[phone] = [];
    grouped[phone].push(msg);
  });

  return NextResponse.json(grouped);
}

