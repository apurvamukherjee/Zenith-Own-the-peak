import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Expose dev server on the LAN so you can open it on your phone.
  server: { host: true, port: 5173 },
  build: {
    // Broad target so older Safari/Chrome/WebViews run the bundle.
    target: ["es2019", "safari14", "chrome80", "firefox78", "edge88"],
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          antd: ["antd", "@ant-design/icons"],
          charts: ["recharts"],
          motion: ["framer-motion"],
        },
      },
    },
  },
});
