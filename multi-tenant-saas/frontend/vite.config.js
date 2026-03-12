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
  },
  define: {
    // WHY: Sometimes Docker/Coolify env variables aren't picked up by import.meta.env.
    // This explicitly defines them for the client.
    'process.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL)
  }
});
