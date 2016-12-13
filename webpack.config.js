const path = require('path');

const CleanWebpackPlugin = require('clean-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const webpack = require('webpack');


const outputPath = path.resolve(__dirname, 'dist');


module.exports = {
  entry: {
    recordingDemo: path.resolve(__dirname, 'src/recordingDemo/recordingDemo.js'),
    analysisDemo: path.resolve(__dirname, 'src/analysisDemo/analysisDemo.js'),
    recognitionDemo: path.resolve(__dirname, 'src/recognitionDemo/recognitionDemo.js'),
    audioReferenceDemo: path.resolve(__dirname, 'src/audioReferenceDemo/audioReferenceDemo.js')
  },
  devServer: {
    contentBase: './src',
    inline: true
  },
  output: {
    path: outputPath,
    publicPath: '../',
    filename: '[name]/[name].js'
  },
  devtool: 'inline-source-map',
  resolve: {
    extensions: ['', '.js', '.json']
  },
  module: {
    loaders: [
      {
        test: /\.html$/,
        loader: ExtractTextPlugin.extract('html')
      },
      {
        test: /\.json$/,
        loader: 'json'
      },
      {
        test: /\.css$/,
        loader: 'style!css'
      },
      {
        test: /\.(png|woff|woff2|ttf|eot|svg)$/,
        loader: 'file'
      },
      {
        test: /\.jsx?$/,
        loader: 'babel-loader',
        include: /src/,
        query: {
          presets: ["es2015"]
        }
      }
    ]
  },
  externals: ['ws'],
  plugins: [
    new CleanWebpackPlugin([outputPath], {
      exclude: ['index.html']
    }),
    new webpack.ContextReplacementPlugin(/bindings$/, /^$/),
    new ExtractTextPlugin('[name]/index.html')
  ]
};
