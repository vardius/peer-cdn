import resolve from "rollup-plugin-node-resolve";
import babel from "rollup-plugin-babel";
import commonjs from "rollup-plugin-commonjs";
import replace from "rollup-plugin-replace";
import gzip from "rollup-plugin-gzip";
import filesize from "rollup-plugin-filesize";
import pkg from "./package.json";

const external = Object.keys(pkg.peerDependencies || {});
const env = process.env.NODE_ENV;
const isProd = env === "production";

const plugins = [
  replace({
    "process.env.NODE_ENV": JSON.stringify(env),
  }),
  resolve({
    browser: true,
    preferBuiltins: true,
  }),
  babel({
    exclude: "node_modules/**",
    runtimeHelpers: true,
  }),
  commonjs({}),
];

if (isProd) {
  plugins.push(
    // Since we're using ES modules we need this _hack_
    // https://github.com/TrySound/rollup-plugin-uglify#warning
    gzip(),
    filesize()
  );
}

const config = {
  input: "src/index.js",
  external: external,
  plugins: plugins,
  treeshake: true,
  output: [
    {
      name: pkg.name,
      exports: "named",
      file: pkg.module,
      format: "es",
      sourcemap: !isProd,
    },
    {
      name: pkg.name,
      exports: "named",
      file: pkg.main,
      format: "umd",
      sourcemap: !isProd,
    },
  ],
};

export default config;
