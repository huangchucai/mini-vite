import { Plugin } from '../plugin'
import { cleanUrl, normalizePath, removeImportQuery } from '../utils'
import path from 'path'
import { ServerContext } from '../server'

export function assetPlugin(): Plugin {
  let serverContext: ServerContext
  return {
    name: 'm-vite:asset',
    configureServer(s) {
      serverContext = s
    },
    async load(id) {
      const cleanedId = removeImportQuery(cleanUrl(id));
      if (cleanedId.endsWith('.svg')) {
        let relativeP = path.relative(serverContext.root, id)
        const relativePath = normalizePath(relativeP)
        return {
          code: `export default "${relativePath}"`
        }
      }
    }
  }
}
