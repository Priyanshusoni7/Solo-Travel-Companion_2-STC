import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Standalone React app. It talks to the Spring Boot API at VITE_API_BASE_URL
// (see .env.development / .env.example); no proxy, no coupling to the backend build.
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  if (command === 'build' && !env.VITE_API_BASE_URL) {
    console.warn(
      '\n[stc] VITE_API_BASE_URL is not set: the app will call the API on its own origin.\n' +
        '      Set it to the backend URL, e.g. VITE_API_BASE_URL=https://your-backend.example.com\n',
    );
  }

  return {
    plugins: [react()],
    define: {
      // sockjs-client expects Node's `global`
      global: 'globalThis',
    },
    server: {
      port: 5173,
      strictPort: true,
    },
    preview: {
      port: 4173,
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
  };
});
