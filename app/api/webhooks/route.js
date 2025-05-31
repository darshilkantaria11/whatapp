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
  try {
    const rawBody = await readRawBody(req);
    const signature = req.headers.get('x-hub-signature-256') || '';

    if (!verifySignature(rawBody, signature)) {
      return new NextResponse('Invalid signature', { status: 403 });
    }

    const body = JSON.parse(rawBody);
    const entries = body.entry || [];

    await connectToDB();

    for (const entry of entries) {
      const changes = entry.changes || [];

      for (const change of changes) {
        const value = change.value;
        const messages = value.messages || [];

        for (const msg of messages) {
          const phone = value.contacts?.[0]?.wa_id || msg.from;
          const type = msg.type;
          let content = '';
          let mediaUrl = null;

          if (type === 'text') {
            content = msg.text.body;
          } else if (['image', 'audio', 'sticker'].includes(type)) {
            const mediaId = msg[type]?.id;
            const fetchedUrl = await fetchMediaUrl(mediaId);
            mediaUrl = fetchedUrl;
            content = `[${type.toUpperCase()} Message]`;
          } else {
            content = `[Unsupported message type: ${type}]`;
          }

          await Message.create({
            phone,
            content,
            type,
            mediaUrl,
            direction: 'incoming',
          });
        }
      }
    }

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('[WEBHOOK ERROR]:', error);
    return new NextResponse('Server error', { status: 500 });
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