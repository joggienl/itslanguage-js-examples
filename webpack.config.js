const path = require('path');

const webpack = require('webpack');


module.exports = {
  entry: {
    demo: path.resolve(__dirname, 'src/demo/demo.js'),
    recordingDemo: path.resolve(__dirname, 'src/recordingDemo/recordingDemo.js'),
    analysisDemo: path.resolve(__dirname, 'src/analysisDemo/analysisDemo.js')
  },
  devServer: {
    contentBase: './src',
    inline: true
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/',
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
        loader: 'html'
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
        test: /\.(woff|woff2|ttf|eot|svg)$/,
        loader: 'file'
      },
      {
        test: /\.jsx?$/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015-loose']
        }
      }
    ]
  },
  externals: ['ws'],
  plugins: [
    new webpack.ContextReplacementPlugin(/bindings$/, /^$/)
  ]
};
