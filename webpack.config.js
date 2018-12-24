const webpack = require('webpack');
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin'); // eslint ignore-line
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const CleanWebpackPlugin = require('clean-webpack-plugin');


const buildPath = path.resolve(__dirname, 'src');
const distPath = path.resolve(__dirname, 'public');


const moduleSettings = {
  rules: [
    {
      test: /\.css$/,
      sideEffects: true,
      use: [
        MiniCssExtractPlugin.loader,
        // 'style-loader',
        'css-loader',
      ],
    },
    {
      test: /\.scss$/,
      sideEffects: true,
      use: [
        MiniCssExtractPlugin.loader,
        // 'style-loader',
        'css-loader',
        'sass-loader',
      ],
    },
    {
      test: /\.js$/,
      include: [
        path.resolve(__dirname, 'node_modules/@bcgsc'),
        buildPath,
      ],
      use: ['babel-loader'],
    },
    {
      // convert images to embeded hashes
      test: /\.(bmp|gif|jpeg?|png)$/,
      loader: 'url-loader',
      options: {
        limit: 10000,
        name: 'static/media/[name].[hash:8].[ext]',
      },
    },
    {
      test: /\.svg$/,
      use: 'file-loader',
    },
    {
      // Load everything else
      test: /\.(md|svg)$/,
      loader: 'file-loader',
      options: {
        name: 'static/media/[name].[hash:8].[ext]',
      },
    },
  ],
};

module.exports = {
  context: buildPath,
  entry: './index.js',
  output: {
    path: distPath,
    filename: 'bundle.js',
  },
  devServer: {
    contentBase: buildPath,
    historyApiFallback: true,
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].css',
      chunkFilename: '[id].css',
    }),
    new BundleAnalyzerPlugin(),
    new CleanWebpackPlugin(
      distPath,
      {
        exclude: ['index.html', 'favicon.ico', 'mainfest.json'],
      },
    ),
  ],
  resolve: {
    extensions: ['.js', '.jsx', 'json'],
  },
  module: moduleSettings,
};
