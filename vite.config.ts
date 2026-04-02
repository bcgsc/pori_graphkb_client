import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const envPrefix = ['KEYCLOAK', 'PUBLIC_PATH', 'CONTACT_EMAIL', 'CONTACT_TICKET_URL', 'IS_DEMO', 'API_BASE_URL'];
  const envDir = path.resolve(__dirname, './config');
  const env = loadEnv(mode, envDir, envPrefix);
  return {
    base: env.PUBLIC_PATH,
    build: {
      outDir: `dist/${mode}`,
      emptyOutDir: true,
    },
    define: {
      'process.env.npm_package_version': JSON.stringify(process.env.npm_package_version),
      'process.env.REACT_APP_VERSION': JSON.stringify(process.env.REACT_APP_VERSION),
    },
    envDir,
    envPrefix,
    plugins: [react()],
    resolve: {
      alias: {
        // can't seem to get just @/ to work
        '@/components': path.resolve(__dirname, './src/components'),
        '@/services': path.resolve(__dirname, './src/services'),
        '@/views': path.resolve(__dirname, './src/views'),
        '@/static': path.resolve(__dirname, './src/static'),
        '#.storybook': path.resolve(__dirname, './.storybook'),
      },
    },
    server: {
      port: 3000,
      open: true,
    },
    test: {
      environment: 'jsdom',
      watch: false,
      setupFiles: ['config/jest/windowEnvMock.js'],
      globals: false, // necessary for now for jest-dom extend-expect to work
      coverage: {
        include: ['src/**/*.{js,jsx,ts,tsx}'],
        reportOnFailure: true,
        exclude: ['**/__tests__/*', '**/test.tsx', '**/*.test.tsx', '*.d.ts'],
      },
      projects: [
        {
          extends: true,
          test: {
            include: ['src/**/*.test.tsx', 'src/**/*.test.ts', 'src/**/test.tsx'],
            name: 'unit',
          },
        },
        {
          extends: true,
          plugins: [
            storybookTest({
              configDir: path.join(__dirname, '.storybook'),
              storybookScript: 'npm run storybook --no-open',
            }),
          ],
          test: {
            name: 'storybook',
            browser: {
              enabled: true,
              provider: playwright({}),
              headless: true,
              instances: [{ browser: 'chromium' }],
            },
          },
        },
      ],
    },
  };
});
