import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 5000,
        host: '0.0.0.0',
        allowedHosts: true,
        strictPort: true,
        proxy: {
          '/api': {
            target: 'http://localhost:3001',
            changeOrigin: true,
            secure: false,
          },
        },
      },
      publicDir: 'public',
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || ''),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || ''),
        'process.env.POYO_AI_API_KEY': JSON.stringify(env.POYO_AI_API_KEY || process.env.POYO_AI_API_KEY || ''),
        'process.env.VITE_POYO_AI_API_KEY': JSON.stringify(env.VITE_POYO_AI_API_KEY || env.POYO_AI_API_KEY || process.env.POYO_AI_API_KEY || ''),
        'process.env.OPENROUTER_API_KEY': JSON.stringify(env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY || ''),
        'process.env.VITE_OPENROUTER_API_KEY': JSON.stringify(env.VITE_OPENROUTER_API_KEY || env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY || ''),
        'process.env.PORTKEY_API_KEY': JSON.stringify(env.PORTKEY_API_KEY || process.env.PORTKEY_API_KEY || ''),
        'process.env.VITE_PORTKEY_API_KEY': JSON.stringify(env.VITE_PORTKEY_API_KEY || env.PORTKEY_API_KEY || process.env.PORTKEY_API_KEY || ''),
        'process.env.SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || env.SUPABASE_URL || process.env.SUPABASE_URL || ''),
        'process.env.SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''),
        'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''),
        'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''),
        'process.env.VITE_GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || ''),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        },
        dedupe: ['react', 'react-dom']
      }
    };
});
