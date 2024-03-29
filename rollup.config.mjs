import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonJs from '@rollup/plugin-commonjs'

export default [
  {
    input: 'index.mjs',
    output: {
      file: 'dist/index.mjs',
      format: 'esm'
    },
    external: [],
    plugins: [nodeResolve({ preferBuiltins: true })]
  },
  {
    input: 'index.mjs',
    output: {
      file: 'dist/index.cjs',
      format: 'cjs',
      exports: 'auto'
    },
    external: [],
    plugins: [nodeResolve({ preferBuiltins: true }), commonJs()]
  }
]
