export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  const url = new URL(request.url);
  const storagePath = url.pathname.replace('/api/storage/', '');
  
  const targetUrl = `${process.env.VITE_API_URL || process.env.API_URL}/storage/${storagePath}`;
  
  const response = await fetch(targetUrl, {
    headers: {
      'ngrok-skip-browser-warning': 'true',
    },
  });

  if (!response.ok) {
    return new Response('Not found', { status: 404 });
  }

  const contentType = response.headers.get('content-type') || 'application/octet-stream';
  const body = await response.arrayBuffer();

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
