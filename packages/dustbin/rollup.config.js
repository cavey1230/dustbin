import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import babel from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';
import { DEFAULT_EXTENSIONS } from '@babel/core';
import pkg from './package.json';

const name = 'dustbin-react';

export default () => {
  const isProd = process.env.ENV === 'production';

  const flow = [
    resolve(),
    commonjs(),
    typescript(),
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

  const normalFlow = {
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

  const replaceOutput = (origin, str) => {
    return origin && origin.replace('build/', 'build/' + str + '/');
  };

  return [normalFlow];
};
