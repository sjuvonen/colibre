const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const autoprefixer = require("autoprefixer");
const path = require("path");
const precss = require("precss");
const webpack = require("webpack");

module.exports = {
  mode: "development",
  entry: {
    "script": "./js/init.webpack.js",
    "pinecone": "./scss/pinecone.scss"
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js"
  },
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: [
          MiniCssExtractPlugin.loader,
          "css-loader",
          {
            loader: "postcss-loader",
            options: {
              plugins: [autoprefixer]
            }
          },
          "sass-loader"
        ]
      },
      {
        test: /\.css$/,
        loader: "style-loader!css-loader",
      },
    ]
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "css/[name].css",
      chunkFilename: "css/[id].css"
    }),
    new webpack.ProvidePlugin({
      $: "jquery",
      jQuery: "jquery",
    })
  ]
};
