import resolve from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import terser from '@rollup/plugin-terser'
import path from 'node:path'

const resolveSourceModules = {
  name: 'resolve-source-modules',
  resolveId(source) {
    if (source === '../content/publicRoutes.js') {
      return path.resolve('src/content/publicRoutes.js')
    }

    return null
  }
}

export default {
  input: 'build/sw.js',
  output: {
    file: 'build/sw.js',
    format: 'iife'
  },
  plugins: [
    resolveSourceModules,
    resolve(),
    replace({
      'process.env.NODE_ENV': JSON.stringify('production'),
      preventAssignment: true
    }),
    terser()
  ]
}