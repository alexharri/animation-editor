const path = require("path");
const webpack = require("webpack");
const FriendlyErrorsWebpackPlugin = require("friendly-errors-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const plugins = require("./webpack.plugins");

module.exports = {
	output: {
		filename: "[name].js",
		chunkFilename: "[name].js",
		publicPath: "/",
		path: path.resolve(__dirname, "dist"),
	},
	devServer: {
		disableHostCheck: true,
	},
	module: {
		rules: [
			{
				test: /\.node$/,
				use: "node-loader",
			},
			{
				test: /\.(m?js|node)$/,
				parser: { amd: false },
				use: {
					loader: "@marshallofsound/webpack-asset-relocator-loader",
					options: {
						outputAssetBase: "native_modules",
					},
				},
			},
			{
				test: /\.js$/,
				include: path.join(__dirname, "src"),
				use: "babel-loader",
			},
			{
				test: /\.tsx?$/,
				include: path.join(__dirname, "src"),
				use: [
					{
						loader: "babel-loader",
					},
					{
						loader: "ts-loader",
						options: {
							transpileOnly: true,
							silent: true,
						},
					},
				],
			},
		],
	},
	plugins: [
		new FriendlyErrorsWebpackPlugin(),
		new webpack.NoEmitOnErrorsPlugin(),
		new webpack.DefinePlugin({
			"process.env": {
				NODE_ENV: JSON.stringify("development"),
			},
		}),
	],
	resolve: {
		alias: {
			"~": path.join(__dirname, "./src/"),
			// "react-dom": "@hot-loader/react-dom",
		},
		extensions: [".js", ".ts", ".jsx", ".tsx", ".css"],
	},
};
