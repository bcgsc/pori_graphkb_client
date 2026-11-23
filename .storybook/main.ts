import { defineMain } from '@storybook/react-vite/node';

export default defineMain({
  stories: [
    '../src/**/*.stories.tsx'
  ],
  addons: ['@storybook/addon-vitest', 'msw-storybook-addon'],
  framework: '@storybook/react-vite',
  features: {
    experimentalTestSyntax: true,
  },
});
