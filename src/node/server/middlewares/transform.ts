/**
 * JS/TS/JSX/TSX 编译能力
 */
import { ServerContext } from '../index'
import { NextHandleFunction } from 'connect'
import createDebug from 'debug';
import { cleanUrl, isJSRequest, isCSSRequest, isImportRequest } from '../../utils'

const debug = createDebug('dev');

export async function transformRequest(
    url: string,
    serverContext: ServerContext
) {
  const { pluginContainer, moduleGraph } = serverContext
  url = cleanUrl(url)

  let mod = await moduleGraph.getModuleByUrl(url)
  if (mod && mod.transformResult) {
    return mod.transformResult
  }

  // 简单来说，就是依次调用插件容器的 resolveId、load、transform 方法
  const resolveResult = await pluginContainer.resolveId(url)
  let transformResult
  if (resolveResult?.id) {
    let code = await pluginContainer.load(resolveResult.id)
    if (typeof code === 'object' && code !== null) {
      code = code.code;
    }

    const { moduleGraph } = serverContext
    mod = await moduleGraph.ensureEntryFromUrl(url)

    if (code) {
      transformResult = await pluginContainer.transform(
          code as string,
          resolveResult?.id
      )
    }
  }
  if (mod) {
    mod.transformResult = transformResult
  }
  return transformResult
}


export function transformMiddleware(
    serverContext: ServerContext
): NextHandleFunction {
  return async (req, res, next) => {
    if (req.method !== 'GET' || !req.url || req.url === '/null') {
      return next()
    }

    const url = req.url

    debug('transformMiddleware: %s', url);

    // transform JS request
    if (isJSRequest(url) || isCSSRequest(url) || isImportRequest(url)) {
      let result = await transformRequest(url, serverContext);
      if (!result) {
        return next()
      }

      if (result && typeof result !== 'string') {
        result = result.code
      }
      // 编译完成，返回响应给浏览器
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/javascript');
      return res.end(result);
    }
    next()
  }
}
