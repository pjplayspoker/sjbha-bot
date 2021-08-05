const path = require ('path');
const HTMLPlugin = require ('html-webpack-plugin');


module.exports = (_, argv) => ({
  entry:   './src/index.tsx',
  devtool: 
    (argv.mode === 'development') 
      ? 'inline-source-map'
      : undefined,
  
  output: {
    path:       path.resolve (__dirname, 'build'),
    publicPath: './',
    clean:      true,
    filename:   '[name].bundle.js'
  },

  optimization: {
    splitChunks: {
      chunks: 'all',
    },
  },

  mode: argv.mode,

  plugins: [
    new HTMLPlugin ({
      template: 'src/index.html'
    })
  ],

  module: {
    rules: [
      {
        test:    /\.tsx?$/,
        use:     'awesome-typescript-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.(png|jpe?g|gif)$/i,
        type: 'asset/resource'
      }
    ]
  },

  resolve: {
    extensions: ['.ts', '.tsx', '.js']
  }
  
});