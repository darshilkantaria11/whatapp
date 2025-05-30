export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  console.log('🔍 Webhook Verify Attempt:', {
    mode,
    token,
    challenge,
    expectedToken: process.env.VERIFY_TOKEN
  });

  if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  } else {
    return new Response('Forbidden', { status: 403 });
  }
}

export async function POST(req) {
  const body = await req.json();

  console.log('🔔 Incoming webhook:', JSON.stringify(body, null, 2));

  const entry = body.entry?.[0];
  const changes = entry?.changes?.[0];
  const message = changes?.value?.messages?.[0];
  const from = message?.from;
  const text = message?.text?.body;

  if (message && text) {
    console.log(`💬 Message from ${from}: ${text}`);
  }

  return new Response('EVENT_RECEIVED', { status: 200 });
}
