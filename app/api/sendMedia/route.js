// app/api/sendMedia/route.js
export async function POST(request) {
  try {
    // Parse the incoming form data
    const formData = await request.formData();
    const file = formData.get('file');
    const phone = formData.get('phone');
    const type = formData.get('type');

    if (!file || !phone || !type) {
      return new Response(JSON.stringify({ success: false, error: 'Missing fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Convert the file to a buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Prepare the form data for WhatsApp API
    const whatsappFormData = new FormData();
    whatsappFormData.append('file', new Blob([buffer]), file.name);
    whatsappFormData.append('messaging_product', 'whatsapp');
    whatsappFormData.append('type', type);

    // Upload media to WhatsApp
    const uploadResponse = await fetch('https://graph.facebook.com/v19.0/me/media', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
      },
      body: whatsappFormData,
    });

    const uploadResult = await uploadResponse.json();

    if (!uploadResult.id) {
      return new Response(JSON.stringify({ success: false, error: 'Media upload failed', details: uploadResult }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Send media message
    const messageResponse = await fetch(`https://graph.facebook.com/v19.0/${process.env.PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phone,
        type,
        [type]: {
          id: uploadResult.id,
        },
      }),
    });

    const messageResult = await messageResponse.json();

    if (messageResult.error) {
      return new Response(JSON.stringify({ success: false, error: messageResult.error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing upload:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
