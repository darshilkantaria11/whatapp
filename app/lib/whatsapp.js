async function getMediaUrl(mediaId) {
  const token = process.env.WHATSAPP_TOKEN;
  
  const res = await fetch(`https://graph.facebook.com/v19.0/${mediaId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await res.json();
  return data.url || '';
}
