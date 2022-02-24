/* eslint-disable import/no-extraneous-dependencies */
const webpack = require('webpack');
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin'); // eslint ignore-line
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CspHtmlWebpackPlugin = require('csp-html-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const { GenerateSW } = require('workbox-webpack-plugin');
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');
const CopyPlugin = require('copy-webpack-plugin');

const createBaseConfig = ({
  define = {}, mode = 'production', sourceMap = false, outputPath, baseUrl = '/',
} = {}) => {
  const BASE_DIR = path.resolve(__dirname, '../..');
  const SRC_PATH = path.resolve(BASE_DIR, 'src');
  const INCLUDE = [
    path.resolve(BASE_DIR, 'node_modules/@bcgsc'),
    SRC_PATH,
  ];

  const moduleSettings = {
    rules: [
      {
        test: /\.css$/,
        sideEffects: true,
        include: [
          SRC_PATH,
          path.resolve(BASE_DIR, 'node_modules/ag-grid-community/dist/styles'),
        ],
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
        ],
      },
      {
        test: /\.scss$/,
        sideEffects: true,
        include: [SRC_PATH],
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'sass-loader',
        ],
      },
      {
        test: /\.[tj]sx?$/,
        include: INCLUDE,
        use: [
          'babel-loader',
        ],
        sideEffects: false,
      },
      {
        // convert images to embedded hashes
        test: /\.(bmp|gif|jpeg?|png|ico)$/,
        include: INCLUDE,
        type: 'asset',
        generator: {
          filename: 'static/media/[name].[hash:8][ext]',
        },
      },
      {
        // Load everything else
        test: /\.(md|svg|ico|json)$/,
        include: INCLUDE,
        type: 'asset/resource',
        generator: {
          filename: 'static/[name][ext]',
        },
      },
    ],
  };

  const plugins = [
    // copy the dynamic env js file
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve(SRC_PATH, 'static/graphkb-env-config.js'),
          to: outputPath,
        },
      ],
    }),
    new MiniCssExtractPlugin({
      ignoreOrder: true,
      filename: 'static/style/[name].css',
    }),
    new CleanWebpackPlugin(),
    // Copy values of ENV variables in as strings using these defaults (null = unset)
    new webpack.DefinePlugin({
      'process.env.npm_package_version': JSON.stringify(process.env.npm_package_version),
      'process.env.NODE_ENV': JSON.stringify(mode),
      ...define,
    }),
    // template index.html. Required for running the dev-server properly
    new HtmlWebpackPlugin({
      template: path.resolve(SRC_PATH, 'static/index.ejs'),
      filename: 'index.html',
      inject: true,
      favicon: path.resolve(SRC_PATH, 'static/favicon/favicon.ico'),
      baseUrl,
      minify: {
        removeComments: false,
      },
    }),
    new CspHtmlWebpackPlugin({
      'base-uri': "'self'",
      'default-src': "'self'",
      'object-src': "'none'",
      'img-src': ["'self'", 'data:', '*'],
      'frame-src': [
        "'self'",
        '*',
        'https://www.ncbi.nlm.nih.gov',
      ],
      'connect-src': [
        "'self'",
        '*',
      ],
      // TODO: Remove google charts requirement since it requires external load which cannot include nonce/hash
      // Then re-add the nonce/hash to scripts
      // https://www.gstatic.com is for google charts API
      'script-src': [
        'https://www.gstatic.com',
        "'self'",
        "'unsafe-eval'",
        "'unsafe-inline'",
      ],
      'style-src': [
        'https://www.gstatic.com',
        "'self'",
        "'unsafe-eval'",
        "'unsafe-inline'",
      ],
      'font-src': ["'self'", 'data:'],
    }, {
      enabled: true,
      hashEnabled: {
        'style-src': false,
        'script-src': false,
      },
      nonceEnabled: {
        'style-src': false,
        'script-src': false,
      },
    }),
    new CompressionPlugin({
      test: /.*\.(js|css)$/,
      minRatio: 0.8,
    }),
    /** dd assets manifest */
    new WebpackManifestPlugin({}),
    /*
   * This service worker is required to ensure that the URL refresh works with a static
   * server (If previously visited)
   * Generate a service worker script that will precache, and keep up to date,
   * the HTML & assets that are part of the Webpack build.
   */
    new GenerateSW({
      // By default, a cache-busting query parameter is appended to requests
      // used to populate the caches, to ensure the responses are fresh.
      // If a URL is already hashed by Webpack, then there is no concern
      // about it being stale, and the cache-busting can be skipped.
      dontCacheBustURLsMatching: /\.\w{8}\./,
      // otherwise it spams console
      mode: 'production',
      // For unknown URLs, fallback to the index page
      navigateFallback: '/index.html',
      // Don't precache sourcemaps (they're large) and build asset manifest:
      exclude: [/\.map$/, /asset-manifest\.json$/],
    }),
  ];

  return {
    mode,
    context: SRC_PATH,
    entry: [
      './polyfills.js',
      './index.tsx',
    ],
    output: {
      path: outputPath,
      filename: 'static/js/[name].bundle.js',
      chunkFilename: 'static/js/[name].[chunkhash].chunk.js',
      publicPath: '',
    },
    devServer: {
      host: process.env.HOSTNAME || 'localhost',
      port: 3000,
      allowedHosts: 'all',
      hot: true,
      devMiddleware: {
        publicPath: '/',
      },
      historyApiFallback: true,
      client: {
        overlay: {
          errors: true,
          warnings: false,
        },
      },
    },
    performance: { hints: 'warning' },
    optimization: {
      runtimeChunk: 'single',
    },
    devtool: sourceMap ? 'eval' : false,
    plugins,
    resolve: {
      extensions: ['.js', '.jsx', '.json', '.ts', '.tsx'],
      alias: {
        '@': SRC_PATH,
      },
    },
    module: moduleSettings,

  };
};

module.exports = createBaseConfig;
