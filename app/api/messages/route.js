import { NextResponse } from 'next/server';
import { getAllMessages } from '@/lib/messagesStore';

export async function GET() {
  return NextResponse.json(getAllMessages());
}
