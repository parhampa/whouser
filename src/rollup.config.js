import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';

export default [
  // ESM build
  {
    input: 'src/index.js',
    output: {
      file: 'dist/whouser.esm.js',
      format: 'esm',
      sourcemap: true
    },
    plugins: [resolve(), commonjs()]
  },
  // CJS build
  {
    input: 'src/index.js',
    output: {
      file: 'dist/whouser.cjs.js',
      format: 'cjs',
      sourcemap: true,
      exports: 'auto'
    },
    plugins: [resolve(), commonjs()]
  },
  // UMD / Browser build (minified)
  {
    input: 'src/index.js',
    output: {
      file: 'dist/whouser.min.js',
      format: 'umd',
      name: 'Whouser',
      sourcemap: true,
      exports: 'auto'
    },
    plugins: [
      resolve(),
      commonjs(),
      terser({
        compress: {
          drop_console: true,
          drop_debugger: true
        }
      })
    ]
  }
];