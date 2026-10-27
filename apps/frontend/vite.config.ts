import path from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true,
    port: 5173,
    // Chạy trong Docker trên Windows, bind mount không phát sự kiện thay đổi file vào
    // container -> phải polling thì hot reload mới nhận code mới
    watch: { usePolling: true, interval: 300 },
  },
});
