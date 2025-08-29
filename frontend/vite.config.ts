import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig(async () => {
  const tailwindModule = await import("@tailwindcss/vite");
  const tailwind = tailwindModule.default ?? tailwindModule;

  return {
    plugins: [react(), tailwind()],
    server: {
      port: 3000,
    },
  };
});
