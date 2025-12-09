import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // API routes
      "/api": {
        target: "http://localhost:5001",
        changeOrigin: true,
      },
      // Uploaded GLB files
      "/uploads": {
        target: "http://localhost:5001",
        changeOrigin: true,
      },
    },
  },
});
