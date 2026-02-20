interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
}

export const onRequestGet = async (context: { request: Request; env: Env }) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  if (!context.env.SUPABASE_URL || !context.env.SUPABASE_ANON_KEY) {
    return new Response(JSON.stringify({ 
      authenticated: false, 
      message: 'Supabase not configured' 
    }), { headers });
  }

  const authHeader = context.request.headers.get('Authorization');
  
  if (!authHeader) {
    return new Response(JSON.stringify({ authenticated: false }), { headers });
  }

  try {
    const token = authHeader.replace('Bearer ', '');
    
    const response = await fetch(`${context.env.SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': context.env.SUPABASE_ANON_KEY,
      },
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ authenticated: false }), { headers });
    }

    const user = await response.json();
    return new Response(JSON.stringify({ 
      authenticated: true, 
      user 
    }), { headers });
  } catch (error) {
    return new Response(JSON.stringify({ 
      authenticated: false, 
      error: 'Auth check failed' 
    }), { headers, status: 500 });
  }
};

export const onRequestOptions = async () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
};
