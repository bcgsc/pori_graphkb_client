// main jest configuration file
const path = require('path');

const BASE_DIR = path.resolve(__dirname, '..');
const libsToConvert = [
  'd3-force', 'd3-drag', 'd3-selection', 'd3-zoom', 'd3-interpolate', 'd3-color', 'd3-ease', 'ag-grid-community'
].join("|");


module.exports = {
  rootDir: BASE_DIR,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    '<rootDir>/src/services/**/**.{js,jsx,mjs,ts,tsx}',
    '<rootDir>/src/**/**components/**/**.{js,jsx,mjs,ts,tsx}',
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
        outputFile: '<rootDir>/coverage/junit.xml',
      },
    ],
  ],
  setupFiles: [
    '<rootDir>/src/polyfills.js',
    '<rootDir>/config/jest/browserMock.js',
    '<rootDir>/config/jest/windowEnvMock.js',
    'jest-canvas-mock',
  ],
  testRegex: 'src.*__tests__.*.[tj]sx?$',
  testEnvironment: 'jsdom',
  testURL: 'http://localhost',
  transform: {
    '^.+\\.(js|jsx|mjs|ts|tsx)$': '<rootDir>/node_modules/babel-jest',
    '^.+\\.css$': '<rootDir>/config/jest/cssTransform.js',
    '^(?!.*\\.(js|jsx|mjs|css|json|ts|tsx)$)': '<rootDir>/config/jest/fileTransform.js',
  },
  transformIgnorePatterns: [
    `<rootDir>/node_modules/(?!(${libsToConvert})/)`,
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
    'ts',
    'tsx',
  ],
};
