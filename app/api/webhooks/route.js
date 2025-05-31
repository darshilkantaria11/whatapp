import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { addMessage } from '../../lib/messagesStore';

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
    const messages = body.entry?.[0]?.changes?.[0]?.value?.messages || [];

    for (const msg of messages) {
      const from = msg.from;
      const content = msg.text?.body || '[non-text message]';

      addMessage(from, {
        from,
        content,
        direction: 'incoming',
        timestamp: new Date().toISOString(),
      });

      console.log(`[RECEIVED] From ${from}: ${content}`);
    }

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('[POST] Error:', error);
    return new NextResponse('Server error', { status: 500 });
  }
}

// Helper to read raw request body
async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req.body) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

// Enhanced signature verification
function verifySignature(rawBody, headerSignature) {
  if (!headerSignature) return false;
  
  const appSecret = process.env.FB_APP_SECRET;
  if (!appSecret) {
    console.error('FB_APP_SECRET is missing!');
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', appSecret)
    .update(rawBody)
    .digest('hex');

  const expected = `sha256=${expectedSignature}`;
  
  // Securely compare signatures
  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(headerSignature)
  );
}