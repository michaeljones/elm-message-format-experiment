module.exports = {
  entry: './index.js',

  output: {
    path: './dist',
    filename: 'app.js'
  },

  resolve: {
    extensions: ['.js', '.elm']
  },

  module: {
    loaders: [
      {
        test: /\.html$/,
        exclude: /node_modules/,
        loader: 'file?name=[name].[ext]'
      },
      {
        test: /\.elm$/,
        exclude: [/elm-stuff/, /node_modules/],
        loader: 'elm-webpack-loader'
      }
    ],

  },

  devServer: {
    inline: true,
    stats: 'errors-only'
  }
};
