const path = require("path");

module.exports = [
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
];
