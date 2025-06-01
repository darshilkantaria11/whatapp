import { connectToDB } from '../../lib/db';
import Message from '../../model/Message';

export async function POST(req) {
  const secret = req.headers.get("x-api-key");
  const mysecret = process.env.NEXT_PUBLIC_API_KEY
  if (secret !== mysecret) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized: Invalid API key' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { to, text } = await req.json();

  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.PHONE_NUMBER_ID;

  if (!to || !text) {
    return new Response(
      JSON.stringify({ error: 'Missing recipient or message text' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Send message via WhatsApp API
    const response = await fetch(
      `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: { body: text },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: data.error }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Save outgoing message to database
    await connectToDB();
    await Message.create({
      phone: to,
      content: text,
      type: 'text',
      direction: 'outgoing',
      read: true,
      timestamp: new Date(),
    });

    return new Response(
      JSON.stringify({
        success: true,
        messageId: data.messages?.[0]?.id,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: 'Failed to send message',
        details: err.message,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
