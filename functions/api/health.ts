export const onRequestGet = async () => {
  return new Response(JSON.stringify({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    platform: 'cloudflare-pages'
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
