import { Plugin } from 'esbuild';

import { BARE_IMPORT_RE } from '../constants'
import resolve from 'resolve'

export function preBundlePlugin(deps: Set<string>): Plugin {
  return {
    name: 'esbuild:pre-bundle',
    setup(build) {
      build.onResolve(
          { filter: BARE_IMPORT_RE },
          (resolveInfo) => {
            const { path: id, importer } = resolveInfo
            const isEntry = !importer
            if (deps.has(id)) {  // 命中需要预编译的依赖
              return isEntry ? {
                path: id,
                namespace: 'dep'
              } : {
                path: resolve.sync(id, { basedir: process.cwd() })
              }
            }
          }
      )
    }
  }
}
