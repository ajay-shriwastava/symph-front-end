import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  server: {
    proxy: {
      "/api": "http://localhost:8000",
    },
  },
  build: {
    rollupOptions: {
      input: {
        main:      resolve(__dirname, "index.html"),
        agents:    resolve(__dirname, "src/html/agents.html"),
        workflows: resolve(__dirname, "src/html/workflows.html"),
        messages:  resolve(__dirname, "src/html/messages.html"),
        logs:      resolve(__dirname, "src/html/logs.html"),
        memory:    resolve(__dirname, "src/html/memory.html"),
      },
    },
  },
});
