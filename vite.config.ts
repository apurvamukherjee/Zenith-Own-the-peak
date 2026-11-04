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
        // Function form: the object form only matches each package's bare
        // entry, so react-dom/client + scheduler leaked into the app chunk.
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (/node_modules\/(react|react-dom|scheduler|react-router|react-router-dom|@remix-run)\//.test(id)) return "react";
          if (/node_modules\/(antd|@ant-design|rc-[^/]+|@rc-component)\//.test(id)) return "antd";
          if (/node_modules\/(recharts|d3-[^/]+|victory-vendor)\//.test(id)) return "charts";
          if (/node_modules\/(framer-motion|motion-dom|motion-utils)\//.test(id)) return "motion";
          return undefined;
        },
      },
    },
  },
});
