// main jest configuration file
const path = require('path');

const BASE_DIR = path.resolve(__dirname, '..');

module.exports = {
  rootDir: BASE_DIR,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    '<rootDir>/src/services/**/**.{js,jsx,mjs}',
    '<rootDir>/src/**/**components/**/**.{js,jsx,mjs}',
  ],
  coverageReporters: [
    'clover',
    'text',
    'json',
    'json-summary',
    'lcov',
  ],
  reporters: [
    'default',
    [
      'jest-junit',
      {
        output: '<rootDir>/coverage/junit.xml',
      },
    ],
  ],
  setupFiles: [
    '<rootDir>/src/polyfills.js',
    '<rootDir>/config/jest/browserMock.js',
    '<rootDir>/config/jest/enzymeInit.js',
    '<rootDir>/config/jest/windowEnvMock.js',
    'jest-canvas-mock',
  ],
  testRegex: 'src.*__tests__.*.jsx?$',
  testEnvironment: 'jest-environment-jsdom-fourteen',
  testURL: 'http://localhost',
  transform: {
    '^.+\\.(js|jsx|mjs)$': '<rootDir>/node_modules/babel-jest',
    '^.+\\.js$': 'babel-jest',
    '^.+\\.css$': '<rootDir>/config/jest/cssTransform.js',
    '^(?!.*\\.(js|jsx|mjs|css|json)$)': '<rootDir>/config/jest/fileTransform.js',
  },
  transformIgnorePatterns: [
    '[/\\\\]node_modules[/\\\\].+\\.(js|jsx|mjs)$',
  ],
  moduleNameMapper: {
    '@/(.*)$': '<rootDir>/src/$1',
  },
  moduleFileExtensions: [
    'web.js',
    'js',
    'json',
    'web.jsx',
    'jsx',
    'node',
    'mjs',
  ],
};
