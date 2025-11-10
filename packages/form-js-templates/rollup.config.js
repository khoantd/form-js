import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import pkg from './package.json';

export default [
  {
    input: 'src/index.js',
    output: [
      {
        sourcemap: true,
        format: 'commonjs',
        file: pkg.main,
      },
      {
        sourcemap: true,
        format: 'esm',
        file: pkg.module,
      },
    ],
    external: ['@bpmn-io/form-json-schema'],
    plugins: [
      json(),
      resolve({
        resolveOnly: [],
      }),
    ],
  },
];

