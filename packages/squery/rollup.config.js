import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import rollupTypescript from 'rollup-plugin-typescript2';
import babel from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';
import { DEFAULT_EXTENSIONS } from '@babel/core';
import pkg from './package.json';

const name = 'squery';

export default () => {
  const isProd = process.env.ENV === 'production';

  const flow = [
    resolve(),
    commonjs(),
    rollupTypescript(),
    babel({
      babelHelpers: 'bundled',
      exclude: 'node_modules/**',
      extensions: [...DEFAULT_EXTENSIONS, '.ts', '.json'],
    }),
  ];

  const globals = {
    react: 'React',
    'react-dom': 'ReactDom',
  };

  return {
    input: './src/index.ts',
    output: [
      {
        file: pkg.main,
        format: 'cjs',
        globals,
      },
      {
        file: pkg.module,
        format: 'es',
        globals,
      },
      {
        name,
        file: pkg.umd,
        format: 'umd',
        globals,
      },
    ],
    external: ['react', 'react-dom'],
    plugins: isProd ? [terser(), ...flow] : flow,
  };
};
