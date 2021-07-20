// @ts-ignore
module.exports = {
	transform: {
		"^.+\\.tsx?$": "ts-jest",
	},
	testRegex: "(/test/.*|(\\.|/)(test|spec))\\.tsx?$",
	moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
	moduleNameMapper: {
		"~(.*)$": "<rootDir>/src/$1",
	},
	globals: {
		"ts-jest": {
			isolatedModules: true,
		},
	},
};
