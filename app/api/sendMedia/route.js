import FormData from 'form-data';

export async function POST(req) {
  try {
    const { phone, name, type, base64Data } = await req.json();

    if (!phone || !name || !type || !base64Data) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    // Convert base64 string to Buffer
    const buffer = Buffer.from(base64Data, 'base64');

    // Prepare multipart/form-data body for media upload
    const form = new FormData();
    form.append('file', buffer, { filename: name, contentType: type });
    form.append('messaging_product', 'whatsapp');
    form.append('type', type);

    // Upload media to WhatsApp
    const uploadResponse = await fetch(
      `https://graph.facebook.com/v15.0/${process.env.PHONE_NUMBER_ID}/media`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          ...form.getHeaders(),
        },
        body: form,
      }
    );

    const uploadJson = await uploadResponse.json();

    if (!uploadResponse.ok || !uploadJson.id) {
      return new Response(
        JSON.stringify({ error: 'Media upload failed', details: uploadJson }),
        { status: 500 }
      );
    }

    const mediaId = uploadJson.id;

    // Now send the media message
    const messagePayload = {
      messaging_product: 'whatsapp',
      to: phone,
      type: type.startsWith('image/') ? 'image' : type.startsWith('video/') ? 'video' : 'document',
      [type.startsWith('image/') ? 'image' : 'video']: {
        id: mediaId,
      },
    };

    const sendResponse = await fetch(
      `https://graph.facebook.com/v15.0/${process.env.PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messagePayload),
      }
    );

    const sendJson = await sendResponse.json();

    if (!sendResponse.ok) {
      return new Response(
        JSON.stringify({ error: 'Sending media message failed', details: sendJson }),
        { status: 500 }
      );
    }

    return new Response(JSON.stringify({ success: true, messageId: sendJson.messages[0].id }), {
      status: 200,
    });
  } catch (error) {
    console.error('Error in sendMedia:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
