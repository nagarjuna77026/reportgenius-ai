
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Polyfill process.env for the Gemini SDK usage
      // Default to empty string to prevent undefined errors in browser runtime
      'process.env.API_KEY': JSON.stringify(env.API_KEY || '')
    }
  };
});
