import resolve from "rollup-plugin-node-resolve";
import babel from "rollup-plugin-babel";
import commonjs from "rollup-plugin-commonjs";
import replace from "rollup-plugin-replace";
import uglify from "rollup-plugin-uglify";

var env = process.env.NODE_ENV;
var config = {
  format: "umd",
  moduleName: "peer-cdn",
  exports: "named",
  plugins: [
    resolve({
      jsnext: true,
      browser: true
    }),
    commonjs({
      namedExports: {
        "node_modules/peer-data/dist/bundle.js": [
          "SocketChannel",
          "AppEventType",
          "EventDispatcher"
        ]
      }
    }),
    babel({
      exclude: "node_modules/**"
    }),
    replace({
      "process.env.NODE_ENV": JSON.stringify(env)
    })
  ]
};

if (env === "production") {
  config.plugins.push(
    uglify({
      compress: {
        pure_getters: true,
        unsafe: true,
        unsafe_comps: true,
        warnings: false
      }
    })
  );
}

export default config;
