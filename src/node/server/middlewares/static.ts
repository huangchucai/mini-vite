import { NextHandleFunction } from 'connect'
import sirv from 'sirv'
import { isImportRequest, normalizePath } from '../../utils'
import path from 'path'
import { CLIENT_PUBLIC_PATH } from '../../constants'
export function staticMiddleware(): NextHandleFunction {
  console.log('-hcc-', process.cwd())
  const serveFromRoot = sirv(normalizePath(path.join(process.cwd())), { dev: true })
  return (req, res, next) => {
    if (!req.url) {
      return
    }

    // 不处理 import 请求
    if (isImportRequest(req.url) || req.url === CLIENT_PUBLIC_PATH) {
      return;
    }

    serveFromRoot(req, res, next);
  }
}
