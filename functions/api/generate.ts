
// This is a Cloudflare Pages Function that acts as a serverless backend.
// It will be deployed automatically when placed in the /functions directory.

/**
 * The Env interface defines the environment variables available to the function.
 * We expect GEMINI_API_KEY to be set in the Cloudflare Pages project settings.
 */
interface Env {
  GEMINI_API_KEY: string;
}

/**
 * This function handles all POST requests to the /api/generate endpoint.
 * It proxies requests to the Google Gemini API, securely injecting the API key.
 * @param context - The Cloudflare Pages function context, containing the request and environment variables.
 */
export const onRequestPost = async (context: { request: Request; env: Env }) => {
    try {
        const body = await context.request.json() as any;
        const { model } = body;

        let method;
        let url;
        let requestBody;

        if (model && model.startsWith('imagen')) {
            const { prompt, config } = body;
            method = 'generateImages';
            url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:${method}`;
            requestBody = {
                prompt: prompt,
                ...config,
            };

            const geminiResponse = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': context.env.GEMINI_API_KEY,
                },
                body: JSON.stringify(requestBody),
            });
            
            if (!geminiResponse.ok) {
                const errorBody = await geminiResponse.text();
                return new Response(errorBody, { status: geminiResponse.status, headers: { 'Content-Type': 'application/json' } });
            }

            const responseJson = await geminiResponse.json();
            return new Response(JSON.stringify(responseJson), {
                headers: { 'Content-Type': 'application/json' },
            });

        } else {
            const { stream, contents, config } = body;
            
            method = stream ? 'streamGenerateContent?alt=sse' : 'generateContent';
            url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:${method}`;
            
            requestBody = {
                contents: Array.isArray(contents) ? contents : [{ parts: [{ text: contents }] }]
            };

            if (config) {
                if (config.tools) {
                    requestBody.tools = config.tools;
                }
                
                const generationConfig: any = {};
                if (config.temperature) generationConfig.temperature = config.temperature;
                if (config.topK) generationConfig.topK = config.topK;
                if (config.topP) generationConfig.topP = config.topP;
                if (config.maxOutputTokens) generationConfig.maxOutputTokens = config.maxOutputTokens;
                if (config.responseMimeType) generationConfig.responseMimeType = config.responseMimeType;
                if (config.responseSchema) generationConfig.responseSchema = config.responseSchema;
                
                if (Object.keys(generationConfig).length > 0) {
                  requestBody.generationConfig = generationConfig;
                }

                if (config.systemInstruction) {
                    requestBody.systemInstruction = { parts: [{ text: config.systemInstruction }] };
                }

                if (config.thinkingConfig) {
                    requestBody.thinkingConfig = config.thinkingConfig;
                }
            }

            const geminiResponse = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': context.env.GEMINI_API_KEY, 
                },
                body: JSON.stringify(requestBody),
            });

            if (!geminiResponse.ok) {
                const errorBody = await geminiResponse.text();
                return new Response(errorBody, { status: geminiResponse.status, headers: { 'Content-Type': 'application/json' } });
            }
            
            if (!stream) {
                const responseJson = await geminiResponse.json();
                const text = responseJson?.candidates?.[0]?.content?.parts?.[0]?.text || '';
                const enhancedResponse = { ...responseJson, text };
                
                return new Response(JSON.stringify(enhancedResponse), {
                    headers: { 'Content-Type': 'application/json' },
                });
            }

            const responseHeaders = new Headers(geminiResponse.headers);
            responseHeaders.set('Cache-Control', 'no-cache');
            
            return new Response(geminiResponse.body, {
                status: geminiResponse.status,
                headers: responseHeaders,
            });
        }

    } catch (e) {
        const error = e instanceof Error ? e : new Error(String(e));
        return new Response(JSON.stringify({ error: { message: `Proxy Error: ${error.message}` } }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};
