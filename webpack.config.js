const path = require("node:path");

const prebuild = process.env.ALLAY_PREBUILD;
const debugMode = process.env.ALLAY_DEBUG == "1";
if (prebuild === undefined) {
  throw new Error("not in an Allay environment");
}

/**
 * @type {import('webpack').Configuration}
 */
module.exports = {
  entry: path.resolve(__dirname, "src/BP/scripts/main.ts"),
  mode: "production",
  target: ["es2020"],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  optimization: {
    minimize: !debugMode,
  },
  resolve: {
    enforceExtension: false,
    extensions: [".ts", ".js"],
  },
  output: {
    filename: "main.js",
    path: path.resolve(__dirname, `${process.env.ALLAY_PREBUILD}/BP/scripts`),
  },
  experiments: {
    outputModule: true,
  },
  externalsType: "module",
  externals: {
    "@minecraft/server": "@minecraft/server",
    "@minecraft/server-ui": "@minecraft/server-ui",
    "@minecraft/server-admin": "@minecraft/server-admin",
    "@minecraft/server-gametest": "@minecraft/server-gametest",
    "@minecraft/server-net": "@minecraft/server-net",
    "@minecraft/server-common": "@minecraft/server-common",
    "@minecraft/debug-utilities": "@minecraft/debug-utilities",
  },
};

