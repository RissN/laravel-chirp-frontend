export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  const url = new URL(request.url);
  const storagePath = url.searchParams.get('path');
  
  if (!storagePath) {
    return new Response('Path query parameter is required', { status: 400 });
  }
  
  const targetUrl = `${process.env.VITE_API_URL || process.env.API_URL}/storage/${storagePath}`;
  
  const response = await fetch(targetUrl, {
    headers: {
      'ngrok-skip-browser-warning': 'true',
    },
  });

  if (!response.ok) {
    return new Response(`Failed to fetch: ${targetUrl} (Status: ${response.status}) ENVs: VITE_API_URL=${process.env.VITE_API_URL} | API_URL=${process.env.API_URL}`, { status: 404 });
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
