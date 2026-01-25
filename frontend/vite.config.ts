/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';

// https://vitejs.dev/config/
export default defineConfig(async () => {
  const tailwindModule = await import('@tailwindcss/vite');
  const tailwind = tailwindModule.default ?? tailwindModule;

  return {
    plugins: [react(), tailwind()],
    server: {
      port: 3000,
    },
    optimizeDeps: {
      include: [
        'react-dom/client',
        'react-router-dom',
        'web-vitals',
        'point-in-polygon',
        '@headlessui/react',
        'echarts-for-react',
        'echarts',
      ],
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./tests/setup.ts'],
      browser: {
        provider: playwright(),
        enabled: true,
        headless: true,
        instances: [
          { browser: 'chromium' as const },
          //   // { browser: 'firefox' as const },
          //   // { browser: 'webkit' as const },
        ],
      },
      coverage: {
        enabled: true,
        provider: 'v8' as const,
      },
    },
  };
});
