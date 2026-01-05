interface Env {
  CODEWORDS_API_KEY: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  try {
    const body = await context.request.json() as { message?: string; session_id?: string };
    const { message, session_id } = body;

    if (!message) {
      return new Response(JSON.stringify({ message: "Message is required" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const apiKey = context.env.CODEWORDS_API_KEY;
    if (!apiKey) {
      console.error("CODEWORDS_API_KEY is not set");
      return new Response(JSON.stringify({ message: "WhatsApp chatbot not configured" }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    const apiUrl = 'https://runtime.codewords.ai/run/arman_law_whatsapp_assistant_1d28125c/web_chat';
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        message,
        session_id: session_id || `session_${Date.now()}`
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("CodeWords API error:", response.status, errorText);
      return new Response(JSON.stringify({ message: "Failed to get AI response" }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("WhatsApp chat error:", error);
    return new Response(JSON.stringify({ message: "Failed to process chat message" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};
