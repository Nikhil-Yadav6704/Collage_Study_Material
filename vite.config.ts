import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@tanstack/query-core",
    ],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('react-router')) {
            return 'vendor-react';
          }
          if (id.includes('@tanstack') || id.includes('zustand')) {
            return 'vendor-query';
          }
          if (id.includes('recharts')) {
            return 'vendor-charts';
          }
          if (id.includes('@radix-ui') || id.includes('cmdk') || id.includes('lucide')) {
            return 'vendor-ui';
          }
          if (id.includes('date-fns')) {
            return 'vendor-date';
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
}));
