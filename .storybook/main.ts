import { defineMain } from '@storybook/react-vite/node';

export default defineMain({
  "stories": [
    "../src/**/*.stories.tsx"
  ],
  "addons": [
    "@storybook/addon-vitest",
  ],
  "framework": "@storybook/react-vite",
});
