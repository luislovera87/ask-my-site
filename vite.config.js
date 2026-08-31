import { defineConfig } from 'vite';
import { anthropicProxyPlugin } from './server/anthropic-proxy.js';

export default defineConfig({
  server: {
    port: 5173,
    strictPort: true,
  },
  plugins: [anthropicProxyPlugin()],
});
