import { Plugin } from '../plugin'
import { ServerContext } from '../server'
import path from 'path'
import { pathExists } from 'fs-extra'
import resolve from 'resolve'
import { DEFAULT_EXTERSIONS } from '../constants'

/**
 * 获取文件的绝对路径
 * @returns {Plugin}
 * /src/main.tsx  -> {id: D:\study\miniVite\playground\src\main.tsx }
 * ./App -> { id: ./App.tsx }
 * /node_modules/.m-vite/react.js  -> {id: D:\study\miniVite\playground\node_modules\.m-vite\react.js}
 *          |
 *
 * /node_modules/.m-vite/react-dom.js
 */
export function resolvePlugin(): Plugin {
  let serverContext: ServerContext
  return {
    name: 'm-vite: resolve',
    configureServer(s) {
      // 保存服务端上下文
      serverContext = s
    },
    async resolveId(id, importer) {
      //1， 绝对路径
      if (path.isAbsolute(id)) {
        if (await pathExists(id)) {
          return { id }
        }

        id = path.join(serverContext.root, id)
        if (await pathExists(id)) {
          return { id }
        }
      }
      //2. 相对路径
      else if (id.startsWith('.')) {
        if (!importer) {
          throw new Error('`importer` should not be undefined')
        }
        const hasExtension = path.extname(id).length > 1;
        let resolvedId: string;
        // 2.1 包含文件名后缀
        // 如 ./App.tsx
        if (hasExtension) {
          resolvedId = resolve.sync(id, { basedir: path.dirname(importer) })
          if (await pathExists(resolvedId)) {
            return { id }
          }
        } else { // 2.2 不包含文件名后缀
          for (const extname of DEFAULT_EXTERSIONS) {
            try {
              const withExtension = `${ id }${ extname }`;
              resolvedId = resolve.sync(withExtension, {
                basedir: path.dirname(importer),
              });
              if (await pathExists(resolvedId)) {
                return { id: withExtension  };
              }
            } catch (e) {
              continue;
            }
          }
        }
      }
      return null
    }
  }
}
