import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // This makes the Vercel environment variable available to the client-side
    // code as `process.env.API_KEY`, bridging the gap between the code's
    // expectation and Vite's security model.
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  }
});
