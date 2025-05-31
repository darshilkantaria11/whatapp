import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { connectToDB } from '../../lib/db';
import Message from '../../model/Message';

export const config = {
  api: {
    bodyParser: false,
  },
};

// Webhook verification (for WhatsApp setup)
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse('Forbidden', { status: 403 });
}

// Handles incoming messages
export async function POST(req) {
  await connectToDB();

  let body;
  try {
    body = await req.json(); // Raw body parsing not used unless you verify signature
  } catch (err) {
    console.error('Error parsing JSON:', err);
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const token = process.env.WHATSAPP_TOKEN;

  try {
    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const message = changes?.value?.messages?.[0];
    const phone = message?.from;

    if (!message || !phone) {
      return NextResponse.json({ success: false, error: 'Missing message or phone' }, { status: 400 });
    }

    const type = message.type;

    // ✅ Handle text messages
    if (type === 'text') {
      await Message.create({
        phone,
        content: message.text.body,
        type: 'text',
        direction: 'incoming',
      });
    }

    // ✅ Handle image/audio/sticker messages
    if (['image', 'audio', 'sticker'].includes(type)) {
      const mediaId = message[type]?.id;
      if (!mediaId) throw new Error('Media ID missing');

      const mediaUrl = await fetchMediaUrl(mediaId, token);
      if (!mediaUrl) throw new Error('Failed to retrieve media URL');

      await Message.create({
        phone,
        content: mediaUrl, // You should use a proxy API route to serve this
        type,
        direction: 'incoming',
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Helper to fetch signed media URL from WhatsApp
async function fetchMediaUrl(mediaId, token) {
  try {
    const res = await fetch(`https://graph.facebook.com/v19.0/${mediaId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const json = await res.json();
    return json.url || null;
  } catch (err) {
    console.error('Error fetching media URL:', err);
    return null;
  }
}
