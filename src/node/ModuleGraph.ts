/**
 * 模块依赖图
 */
import { PartialResolvedId, TransformResult } from 'rollup'
import { cleanUrl } from './utils'

export class ModuleNode {
  // 资源访问 url
  url: string;

  // 资源绝对路径
  id: string | undefined = undefined;
  // 该模块的引用方
  importers = new Set<ModuleNode>();
  // 该模块所依赖的模块
  importedModules = new Set<ModuleNode>();
  // 经过 transform 钩子后的编译结果
  transformResult: TransformResult | null = null;

  // 上一次热更新的时间戳
  lastHMRTimestamp = 0;

  constructor(url: string) {
    this.url = url;
  }
}

export class ModuleGraph {
  // 资源 url 到 ModuleNode 的映射表
  urlToModuleMap = new Map<string, ModuleNode>()
  // 资源绝对路径到 ModuleNode 的映射表
  idToModuleMap = new Map<string, ModuleNode>()

  constructor(private resolveId: (url: string, importer?: string) => Promise<PartialResolvedId | null>) {
  }

  getModuleById(id: string): ModuleNode | undefined {
    return this.idToModuleMap.get(id)
  }

  async getModuleByUrl(rawUrl: string, importer?: string): Promise<ModuleNode | undefined> {
    const { url } = await this._resolve(rawUrl, importer)
    return this.urlToModuleMap.get(url);

  }

  async ensureEntryFromUrl(rawUrl: string, importer?: string): Promise<ModuleNode> {
    const { url, resolvedId } = await this._resolve(rawUrl,importer);
    // 首先检查缓存
    if (this.urlToModuleMap.has(url)) {
      return this.urlToModuleMap.get(url) as ModuleNode;
    }
    // 若无缓存，更新 urlToModuleMap 和 idToModuleMap
    const mod = new ModuleNode(url);
    mod.id = resolvedId;
    this.urlToModuleMap.set(url, mod);
    this.idToModuleMap.set(resolvedId, mod);
    return mod;
  }

  async updateModuleInfo(mod: ModuleNode, importedModules: Set<string | ModuleNode>) {
    const prevImports = mod.importedModules
    for (const curImports of importedModules) {
      const dep = typeof curImports === 'string' ? await this.ensureEntryFromUrl(cleanUrl(curImports), mod.id) : curImports
      if (dep) {
        mod.importedModules.add(dep)
        dep.importers.add(mod)
      }
    }
    // 清除已经不再被引用的依赖
    for (const prevImport of prevImports) {
      if (!importedModules.has(prevImport.url)) {
        prevImport.importers.delete(mod)
      }
    }
  }

  //HMR 触发时会执行这个方法, 清空之前的缓存数据
  invalidateModule(file: string) {
    const mod = this.idToModuleMap.get(file);
    if (mod) {
      // 更新时间戳
      mod.lastHMRTimestamp = Date.now();
      mod.transformResult = null;
      mod.importers.forEach((importer) => {
        this.invalidateModule(importer.id!);
      });
    }
  }

  private async _resolve(url: string, importer ?: string): Promise<{ url: string, resolvedId: string }> {
    const resolved = await this.resolveId(url, importer)
    const resolvedId = resolved?.id || url
    return {
      url, resolvedId
    }
  }
}
