const rules = require("./webpack.rules");
const plugins = require("./webpack.plugins");
const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
	module: {
		rules,
	},
	plugins: [
		...plugins,
		new CopyWebpackPlugin([
			{
				from: path.resolve(__dirname, "static"),
				to: path.resolve(__dirname, ".webpack/renderer/static"),
			},
		]),
	],
	resolve: {
		extensions: [".js", ".ts", ".jsx", ".tsx", ".css"],
		alias: {
			"~": path.join(__dirname, "./src/"),
		},
	},
};
