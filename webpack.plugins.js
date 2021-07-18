const webpack = require("webpack");
const FriendlyErrorsWebpackPlugin = require("friendly-errors-webpack-plugin");

module.exports = [
	new FriendlyErrorsWebpackPlugin(),
	new webpack.NoEmitOnErrorsPlugin(),
	new webpack.DefinePlugin({
		"process.env": {
			NODE_ENV: JSON.stringify("development"),
		},
	}),
];
