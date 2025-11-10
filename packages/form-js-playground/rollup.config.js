import css from 'rollup-plugin-css-only';

import babel from '@rollup/plugin-babel';

import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';

import pkg from './package.json';

function pgl(plugins = []) {
  return [
    json(),
    babel({
      babelHelpers: 'bundled',
      plugins: [
        [
          '@babel/plugin-transform-react-jsx',
          {
            importSource: 'preact',
            runtime: 'automatic',
          },
        ],
      ],
    }),
    css({
      output: 'assets/form-js-playground.css',
    }),
    ...plugins,
  ];
}

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
    plugins: pgl(),
    external: [
      'preact',
      'preact/hooks',
      'file-drops',
      'mitt',
      'downloadjs',
      '@bpmn-io/form-js-editor',
      '@bpmn-io/form-js-templates',
      '@bpmn-io/form-js-viewer',
      'preact/jsx-runtime',
      '@codemirror/state',
      '@codemirror/lang-json',
      '@codemirror/lint',
      '@codemirror/view',
      '@codemirror/commands',
      '@codemirror/autocomplete',
      '@codemirror/language',
      'codemirror',
      'classnames',
      'min-dom',
      'min-dash',
    ],
    onwarn,
  },
  {
    input: 'src/index.js',
    output: [
      {
        format: 'umd',
        file: pkg['umd:main'],
        name: 'FormPlayground',
        inlineDynamicImports: true,
      },
    ],
    plugins: pgl([
      resolve({
        resolveOnly: [],
        preferBuiltins: false,
        browser: true,
      }),
      commonjs(),
    ]),
    onwarn,
  },
];

function onwarn(warning, warn) {
  if (warning.code === 'THIS_IS_UNDEFINED') {
    if (warning.id.includes('flatpickr')) {
      return;
    }
  }

  // Suppress unresolved dependency warning for @bpmn-io/form-js-templates in UMD build
  // The package will be bundled by resolve plugin
  if (warning.code === 'UNRESOLVED_IMPORT' && warning.source && warning.source.includes('@bpmn-io/form-js-templates')) {
    return;
  }

  // Suppress missing global variable warning for @bpmn-io/form-js-templates in UMD build
  // The package will be bundled, so no global variable is needed
  if (warning.code === 'MISSING_GLOBAL_NAME' && warning.source && warning.source.includes('@bpmn-io/form-js-templates')) {
    return;
  }

  warn(warning);
}
