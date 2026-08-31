import { defineConfig } from 'vite';

// GitHub Pages serves project pages (not a custom domain or a <user>.github.io
// root repo) from a /<repo-name>/ subpath, so asset URLs need that base in
// production. Local dev keeps the root path.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/ask-my-site/' : '/',
  server: {
    port: 5173,
    strictPort: true,
  },
}));
