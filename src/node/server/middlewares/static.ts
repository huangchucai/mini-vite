import { NextHandleFunction } from 'connect'
import sirv from 'sirv'
import { isImportRequest, normalizePath } from '../../utils'
import path from 'path'
export function staticMiddleware(): NextHandleFunction {
  console.log('-hcc-', process.cwd())
  const serveFromRoot = sirv(normalizePath(path.join(process.cwd())), { dev: true })
  return (req, res, next) => {
    if (!req.url) {
      return
    }

    // 不处理 import 请求
    if (isImportRequest(req.url)) {
      return;
    }

    let a= path.resolve('/')
    serveFromRoot(req, res, next);
  }
}
