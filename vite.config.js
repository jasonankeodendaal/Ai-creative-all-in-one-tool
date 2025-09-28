import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // This 'define' block is the key to the solution.
  // It tells Vite to find 'process.env.API_KEY' during the build process
  // and replace it with the actual value from the build environment (provided by Vercel).
  // JSON.stringify is used to ensure the value is correctly embedded as a string in the code.
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  }
});
