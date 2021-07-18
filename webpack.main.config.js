const path = require("path");

module.exports = {
	/**
	 * This is the main entry point for your application, it's the first file
	 * that runs in the main process.
	 */
	entry: "./index.ts",
	// Put your normal webpack config below here
	module: {
		rules: [
			// Add support for native node modules
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
				test: /\.tsx?$/,
				exclude: /(node_modules|\.webpack)/,
				use: {
					loader: "ts-loader",
					options: {
						transpileOnly: true,
					},
				},
			},
		],
	},
	resolve: {
		alias: {
			"~": path.join(__dirname, "./src/"),
		},
		extensions: [".js", ".ts", ".jsx", ".tsx", ".css", ".json"],
	},
};
