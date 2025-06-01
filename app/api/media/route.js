// /api/media?url=<encoded_media_url>
export async function GET(req) {
  const url = req.nextUrl.searchParams.get('url');
  const token = process.env.WHATSAPP_TOKEN;

  const mediaRes = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!mediaRes.ok) {
    return new Response('Failed to fetch media', { status: mediaRes.status });
  }

  const buffer = await mediaRes.arrayBuffer();

  return new Response(Buffer.from(buffer), {
    headers: {
      'Content-Type': mediaRes.headers.get('content-type') || 'application/octet-stream',
    },
  });
}
