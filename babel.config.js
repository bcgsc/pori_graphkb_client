module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        modules: false,
        loose: false,
      },
    ],
    '@babel/preset-typescript',
    '@babel/preset-react',
  ],
  plugins: [
    '@babel/plugin-transform-runtime',
    ['@babel/plugin-proposal-decorators',
      { legacy: true }
    ],
    '@babel/plugin-transform-class-properties',
  ],
  env: {
    test: {
      presets: ['@babel/preset-env', '@babel/preset-typescript', '@babel/preset-react'],
    },
    local: {
      presets: ['@babel/preset-env', '@babel/preset-typescript', '@babel/preset-react'],
    },
  },
};
