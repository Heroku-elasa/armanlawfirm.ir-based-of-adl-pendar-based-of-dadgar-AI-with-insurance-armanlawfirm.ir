const getApiUrl = (): string => {
  if (typeof window !== 'undefined' && (window as any).__VITE_API_URL__) {
    return (window as any).__VITE_API_URL__;
  }
  try {
    const env = (import.meta as any).env;
    if (env?.VITE_API_URL) {
      return env.VITE_API_URL;
    }
  } catch {
  }
  return 'http://localhost:3001';
};

const API_URL = getApiUrl();

export { getApiUrl };

export const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};

export const apiGet = (endpoint: string) => apiCall(endpoint, { method: 'GET' });

export const apiPost = (endpoint: string, data: unknown) => 
  apiCall(endpoint, { 
    method: 'POST', 
    body: JSON.stringify(data) 
  });

export const apiPut = (endpoint: string, data: unknown) => 
  apiCall(endpoint, { 
    method: 'PUT', 
    body: JSON.stringify(data) 
  });

export const apiDelete = (endpoint: string) => 
  apiCall(endpoint, { method: 'DELETE' });
