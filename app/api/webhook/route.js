import crypto from 'crypto';
import { NextResponse } from 'next/server';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  console.log("Webhook verification GET params:", { mode, token, challenge });

  if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse('Verification failed', { status: 403 });
}

export async function POST(req) {
  const signature = req.headers.get('x-hub-signature-256');
  const rawBody = await req.text();

  if (!verifySignature(rawBody, signature)) {
    return new NextResponse('Invalid signature', { status: 403 });
  }

  try {
    const body = JSON.parse(rawBody);
    console.log("Webhook POST body:", JSON.stringify(body, null, 2));
    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Error parsing webhook POST:', error);
    return new NextResponse('Error processing webhook', { status: 500 });
  }
}

function verifySignature(rawBody, headerSignature) {
  if (!headerSignature) return false;

  const expectedSignature =
    'sha256=' +
    crypto
      .createHmac('sha256', process.env.FB_APP_SECRET)
      .update(rawBody)
      .digest('hex');

  const expectedBuffer = Buffer.from(expectedSignature);
  const headerBuffer = Buffer.from(headerSignature);

  return (
    expectedBuffer.length === headerBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, headerBuffer)
  );
}
