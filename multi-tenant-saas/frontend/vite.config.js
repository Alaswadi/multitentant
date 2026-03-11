import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    // WHY: Vite 6+ blocks unknown hosts by default for security. 
    // We allow all hosts here so it works seamlessly behind proxies like Coolify/Nginx.
    allowedHosts: true 
  }
});
