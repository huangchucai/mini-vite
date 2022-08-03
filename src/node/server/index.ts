// connect 是一个具有中间件机制的轻量级 Node.js 框架。
// 既可以单独作为服务器，也可以接入到任何具有中间件机制的框架中，如 Koa、Express
import connect from 'connect';
// picocolors 是一个用来在命令行显示不同颜色文本的工具
import { blue, green } from 'picocolors';
import { optimizer } from '../optimizer'
import { createPluginContainer, PluginContainer } from '../pluginContainer'
import { resolvePlugins } from '../plugins'
import { Plugin } from '../plugin';
import { indexHtmlMiddle } from './middlewares/indexHtml'
import { transformMiddleware } from './middlewares/transform'
import { staticMiddleware } from './middlewares/static'
import { ModuleGraph } from '../ModuleGraph'
import chokidar, { FSWatcher } from 'chokidar'
import { createWebSocketServer } from '../ws'
import { bindingHMREvents } from '../hmr'

export interface ServerContext {
  root: string;
  pluginContainer: PluginContainer;
  app: connect.Server;
  plugins: Plugin[];
  moduleGraph: ModuleGraph
  ws: { send: (data: any) => void, close: () => void }
  watcher: FSWatcher
}

export async function startDevServer() {
  const app = connect()
  const root = process.cwd()
  const startTime = performance.now()

  // WebSocket对象
  const ws = createWebSocketServer(app)
  // hmr更新
  const watcher = chokidar.watch(root, {
    ignored: [ '**/node_modules/**', '**/.git/**' ],
    ignoreInitial: true
  })

  // 模拟rollup插件机制
  const plugins = resolvePlugins()
  const moduleGraph = new ModuleGraph((url, importer) => pluginContainer.resolveId(url, importer))

  const pluginContainer = createPluginContainer(plugins)
  // 模块依赖图
  // @ts-ignore
  const serverContext: ServerContext = {
    root: process.cwd(),
    app,
    pluginContainer,
    plugins,
    moduleGraph,
    ws,
    watcher
  }
  bindingHMREvents(serverContext)
  for (const plugin of plugins) {
    if (plugin.configureServer) {
      await plugin.configureServer(serverContext)
    }
  }

  // html中间件
  app.use(indexHtmlMiddle(serverContext))

  // js插件
  app.use(transformMiddleware(serverContext))

  // 静态资源
  app.use(staticMiddleware())

  app.listen(3000, async () => {
    await optimizer(root)

    console.log(green('🚀 No-Bundle 服务已经成功启动!'),
        `耗时：${ ( performance.now() - startTime ).toFixed(2) }ms`
    )
    console.log(`> 本地访问路径：${ blue('http://localhost:3000') }`)
  })
}



