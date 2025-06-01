import { connectToDB } from '../../lib/db';
import Message from '../../model/Message';

export async function POST(req) {
  const { to, text } = await req.json();

  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.PHONE_NUMBER_ID;

  if (!to || !text) {
    return Response.json({ error: 'Missing recipient or message text' }, { status: 400 });
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
      return Response.json({ error: data.error }, { status: response.status });
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

    return Response.json({ 
      success: true, 
      messageId: data.messages?.[0]?.id 
    });
  } catch (err) {
    return Response.json({ 
      error: 'Failed to send message', 
      details: err.message 
    }, { status: 500 });
  }
}