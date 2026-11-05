import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    server: {
      proxy: {
        '/api': {
          // Defaults to the deployed backend. Set VITE_PROXY_TARGET in
          // .env.development.local to use a locally running backend instead.
          target: env.VITE_PROXY_TARGET || 'https://heavevgymbackendapplication.vercel.app',
          changeOrigin: true,
          secure: true,
        },
      },
    },
  };
});
