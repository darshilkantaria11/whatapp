import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { connectToDB } from '../../lib/db';
import Message from '../../model/Message';

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  return new NextResponse(challenge, {
    status: 200,
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function POST(req) {
  await connectToDB();
  const body = await req.json();

  const token = process.env.WHATSAPP_TOKEN;

  try {
    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const message = changes?.value?.messages?.[0];
    const phone = message?.from;

    if (!message || !phone) {
      return Response.json({ success: false });
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

    // ✅ Handle media types: image, audio, sticker
    if (['image', 'audio', 'sticker'].includes(type)) {
      const mediaId = message[type]?.id;

      // Step 1: Fetch temporary URL using media ID
      const mediaUrl = await fetchMediaUrl(mediaId);
      if (!mediaUrl) throw new Error('Failed to fetch media URL');

      // Step 2: Save message with temp URL
      await Message.create({
        phone,
        content: mediaUrl, // You will proxy this from frontend via /api/media
        type,
        direction: 'incoming',
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

// ✅ Helper: fetch temp signed media URL from WhatsApp
async function fetchMediaUrl(mediaId) {
  const token = process.env.WHATSAPP_TOKEN;

  try {
    const res = await fetch(`https://graph.facebook.com/v19.0/${mediaId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const json = await res.json();
    return json.url || null;
  } catch (err) {
    console.error('Error fetching media URL:', err);
    return null;
  }
}
