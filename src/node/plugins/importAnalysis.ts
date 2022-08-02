import { Plugin } from '../plugin'
import { ServerContext } from '../server'
import { cleanUrl, getShortName, isJSRequest, normalizePath } from '../utils'
import { init, parse } from 'es-module-lexer'
// magic-string 用来作字符串编辑
import MagicString from 'magic-string';
import { BARE_IMPORT_RE, PRE_BUNDLE_DIR } from '../constants'
import path from 'path'

import createDebug from 'debug'
const debug = createDebug('dev');
/**
 * @returns {Plugin}
 */
export function importAnalysisPlugin(): Plugin {
  let serverContext: ServerContext;

  return {
    name: 'm-vite:import-analysis',
    configureServer(s) {
      serverContext = s
    },
    async transform(code, id) {
      if (!isJSRequest(id)) {       // 只处理 JS 相关的请求
        return null
      }
      await init

      const { moduleGraph } = serverContext
      const curMod = moduleGraph.getModuleById(id)
      const importedModules = new Set<string>()

      const resolve = async (id: string, importer?: string) => {
        const resolved = await serverContext.pluginContainer.resolveId(
            id,
            importer
        );
        if (!resolved) {
          return;
        }
        const cleanedId = cleanUrl(resolved.id);
        const mod = moduleGraph.getModuleById(cleanedId);
        let resolvedId = normalizePath(`/${getShortName(resolved.id, serverContext.root)}`);
        if (mod && mod.lastHMRTimestamp > 0) {
          // resolvedId += "?t=" + mod.lastHMRTimestamp;
        }
        return resolvedId;
      };

      // 解析import语句
      const [ imports ] = parse(code)
      const ms = new MagicString(code)
      // 对每一个 import 语句依次进行分析
      for (const importInfo of imports) {
        // 举例说明: const str = `import React from 'react'`
        // str.slice(s, e) => 'react'
        const { s: modStart, e: modEnd, n: modSource } = importInfo;
        if (!modSource) continue

        // 处理静态资源
        if (modSource.endsWith('.svg')) {
          // 加入?import后缀
          const resolvedUrl = normalizePath(path.join('/', 'src', `${ modSource }`))
          ms.overwrite(modStart, modEnd, `${ resolvedUrl }?import`)
          continue
        }
        // 第三方库： 路径重写到预构建产物的路径
        if (BARE_IMPORT_RE.test(modSource)) {
          // const bundlePath = path.join(
          //     serverContext.root,
          //     PRE_BUNDLE_DIR,
          //     `${modSource}.js`
          // )
          const bundlePath = normalizePath(path.join('/', PRE_BUNDLE_DIR, `${ modSource }.js`))
          ms.overwrite(modStart, modEnd, bundlePath)
          importedModules.add(bundlePath)
        } else if (modSource.startsWith('.') || modSource.startsWith('/')) {
          // 直接调用插件上下文的 resolve 方法，会自动经过路径解析插件的处理
          const resolved = await this.resolve(modSource, id)
          if (resolved) {
            ms.overwrite(modStart, modEnd, resolved.id)
            importedModules.add(resolved.id);
          }
        }
      }
      if (curMod) {
        moduleGraph.updateModuleInfo(curMod, importedModules)
      }

      debug('moduleGraph: %s', moduleGraph);

      return {
        code: ms.toString(),
        map: ms.generateMap()
      }
    }
  }
}
