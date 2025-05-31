import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { addMessage } from '../../lib/messagesStore';
import { connectToDB } from '../../lib/db';
import Message from '../../model/Message';

// Add this to prevent Next.js from parsing the body
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
    headers: { 'Cache-Control': 'no-store' }
  });

}

export async function POST(req) {
  await dbConnect();
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

    if (type === 'text') {
      await Message.create({
        phone,
        content: message.text.body,
        type: 'text',
        direction: 'incoming',
      });
    }

    // 👇 Handle media types
    if (['image', 'audio', 'sticker'].includes(type)) {
      const mediaId = message[type]?.id;

      // Step 1: Get the media URL
      const mediaRes = await fetch(`https://graph.facebook.com/v19.0/${mediaId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const mediaData = await mediaRes.json();
      const mediaUrl = mediaData.url;

      // Step 2: Save the signed URL to DB
      await Message.create({
        phone,
        content: mediaUrl,
        type,
        direction: 'incoming',
      });

      // (Optional) You can also fetch the actual binary and store it in cloud or base64 if needed
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

// --- Helper functions below ---

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req.body) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

function verifySignature(rawBody, headerSignature) {
  if (!headerSignature) return false;

  const appSecret = process.env.FB_APP_SECRET;
  const expectedSignature = crypto
    .createHmac('sha256', appSecret)
    .update(rawBody)
    .digest('hex');

  const expected = `sha256=${expectedSignature}`;
  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(headerSignature)
  );
}

async function fetchMediaUrl(mediaId) {
  const token = process.env.WHATSAPP_TOKEN;
  try {
    // Step 1: Get temporary media URL
    const res = await fetch(`https://graph.facebook.com/v19.0/${mediaId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    return json.url || null;
  } catch (e) {
    console.error('Failed to fetch media URL', e);
    return null;
  }
}