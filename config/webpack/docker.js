const path = require('path');

const createBaseConfig = require('./common.js');

const DIST = path.resolve(__dirname, '../../dist/production');

module.exports = createBaseConfig({
  outputPath: DIST,
  mode: 'production',
  sourceMap: false,
  env: {
    NODE_ENV: 'production'
  },
});
