const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");

module.exports = {
	entry: "./src/index.tsx",
	mode: "development",
	stats: "minimal",
	output: {
		filename: "[name].bundle.js",
		path: path.resolve(__dirname, "docs"),
	},
	resolve: {
		extensions: [".ts", ".tsx", ".js", ".jsx"],
		plugins: [
			new TsconfigPathsPlugin(),
		]
	},
	module: {
		rules: [
			{
				test: /\.(ts|tsx)$/,
				loader: "ts-loader"
			}
		]
	},
	plugins: [
		new CopyPlugin({
			patterns: [
				{ from: "public" },
			],
		}),
		new HtmlWebpackPlugin({
			template: path.resolve(__dirname, "./index.html")
		})
	],
	experiments: {
		topLevelAwait: true
	}
};
