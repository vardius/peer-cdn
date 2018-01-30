import resolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import replace from 'rollup-plugin-replace';
import uglify from "rollup-plugin-uglify";
import gzip from "rollup-plugin-gzip";
import filesize from 'rollup-plugin-filesize';
import pkg from './package.json';
import { minify } from 'uglify-es';

const env = process.env.NODE_ENV;
const isProd = env === 'production';

const plugins = [
  replace({
    'process.env.NODE_ENV': JSON.stringify(env)
  }),
  resolve({
    jsnext: true,
    browser: true,
    preferBuiltins: true,
  }),
  babel({
    exclude: 'node_modules/**',
  }),
  commonjs({
    namedExports: {
      'node_modules/peer-data/dist/bundle.js': [
        'SocketChannel',
        'AppEventType',
        'EventDispatcher',
      ],
    }
  }),
];

if (isProd) {
  plugins.push(
    // Since we're using ES modules we need this _hack_
    // https://github.com/TrySound/rollup-plugin-uglify#warning
    uglify({}, minify),
    gzip(),
    filesize(),
  );
}

let config = {
  name: 'peer-cdn',
  banner: `/* peer-cdn version ${pkg.version} */`,
  footer: '/* Join our community! http://rafallorenz.com/peer-cdn */',
  input: 'src/index.js',
  extend: true,
  output: [
    {
      file: pkg.main,
      format: 'umd',
      exports: 'named',
      sourcemap: !isProd
    },
    {
      file: pkg.module,
      format: 'es',
      exports: 'named',
      sourcemap: !isProd
    },
  ],
  plugins,
};

export default config;
