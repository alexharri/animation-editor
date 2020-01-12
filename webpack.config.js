const webpack = require("webpack");
const path = require("path");
const FriendlyErrorsWebpackPlugin = require("friendly-errors-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const clientConfig = {
	name: "client",
	target: "web",
	node: {
		fs: "empty",
	},
	devtool: "inline-source-map",
	mode: "development",
	entry: [path.resolve(__dirname, "./src/index.tsx")],
	output: {
		filename: "[name].js",
		chunkFilename: "[name].js",
		publicPath: "/",
		path: path.resolve(__dirname, "dist"),
	},
	module: {
		rules: [
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
	resolve: {
		alias: {
			"~": path.join(__dirname, "./src/"),
			"react-dom": "@hot-loader/react-dom",
		},
		extensions: [".ts", ".tsx", ".js", ".jsx"],
	},
	plugins: [
		new HtmlWebpackPlugin({ template: "./src/index.html" }),
		new FriendlyErrorsWebpackPlugin(),
		new webpack.NoEmitOnErrorsPlugin(),
		new webpack.DefinePlugin({
			"process.env": {
				NODE_ENV: JSON.stringify("development"),
			},
		}),
	],
	stats: "none",
};

module.exports = clientConfig;
