import { ServerContext } from '../index'
import { NextHandleFunction } from 'connect'
import path from 'path'
import { pathExists, readFile } from 'fs-extra'

export function indexHtmlMiddle(
    serverContext: ServerContext
): NextHandleFunction {
  return async (req, res, next) => {
    if (req.url === '/') {
      const { root } = serverContext
      const indexHtmlPath = path.join(root, 'index.html')
      if (await pathExists(indexHtmlPath)) {
        const rawHtml = await readFile(indexHtmlPath, 'utf-8')
        let html = rawHtml
        for (const plugin of serverContext.plugins) {
          if (plugin.transformIndexHtml) { // 转换html文件
            html = await plugin.transformIndexHtml(html)
          }
        }

        res.statusCode = 200
        res.setHeader('Content-type', 'text/html')
        return res.end(html)
      }
    }
    return next();
  }
}
