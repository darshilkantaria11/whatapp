import FormData from 'form-data';
import fetch from 'node-fetch'; // Node.js environment fetch polyfill

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const phone = formData.get('phone');
    const type = formData.get('type'); // 'image' or 'video'

    if (!file || !phone || !type) {
      return new Response(JSON.stringify({ success: false, error: 'Missing fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Convert file to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Prepare multipart form data for WhatsApp upload
    const whatsappFormData = new FormData();
    whatsappFormData.append('file', buffer, { filename: file.name, contentType: file.type });
    whatsappFormData.append('messaging_product', 'whatsapp');
    whatsappFormData.append('type', type);

    // Upload media
    const uploadRes = await fetch(`https://graph.facebook.com/v19.0/me/media`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        ...whatsappFormData.getHeaders(), // important!
      },
      body: whatsappFormData,
    });

    const uploadJson = await uploadRes.json();

    if (!uploadJson.id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Media upload failed', details: uploadJson }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Send media message with uploaded media ID
    const messageRes = await fetch(`https://graph.facebook.com/v19.0/${process.env.PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phone,
        type: type,
        [type]: { id: uploadJson.id },
      }),
    });

    const messageJson = await messageRes.json();

    if (messageJson.error) {
      return new Response(
        JSON.stringify({ success: false, error: messageJson.error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in sendMedia:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
