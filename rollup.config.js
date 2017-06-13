import resolve from "rollup-plugin-node-resolve";
import globals from "rollup-plugin-node-globals";
import builtins from "rollup-plugin-node-builtins";
import babel from "rollup-plugin-babel";
import replace from "rollup-plugin-replace";
import uglify from "rollup-plugin-uglify";

var env = process.env.NODE_ENV;
var config = {
  format: "umd",
  moduleName: "peer-cdn",
  exports: "named",
  plugins: [
    resolve({
      jsnext: true
    }),
    babel({
      exclude: "node_modules/**"
    }),
    replace({
      "process.env.NODE_ENV": JSON.stringify(env)
    }),
    globals(),
    builtins()
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
