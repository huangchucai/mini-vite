// connect 是一个具有中间件机制的轻量级 Node.js 框架。
// 既可以单独作为服务器，也可以接入到任何具有中间件机制的框架中，如 Koa、Express
import connect from 'connect';
// picocolors 是一个用来在命令行显示不同颜色文本的工具
import { blue, green } from 'picocolors';
import { optimizer } from '../optimizer'
import { createPluginContainer, PluginContainer } from '../pluginContainer'
import { resolvePlugins } from '../plugins'
import { Plugin } from "../plugin";
import { indexHtmlMiddle } from './middlewares/indexHtml'
import { transformMiddleware } from './middlewares/transform'

export interface ServerContext {
  root: string;
  pluginContainer: PluginContainer;
  app: connect.Server;
  plugins: Plugin[];
}

export async function startDevServer() {
  const app = connect()
  const root = process.cwd()
  const startTime = performance.now()

  // 模拟rollup插件机制
  const plugins = resolvePlugins()
  const pluginContainer = createPluginContainer(plugins)

  const serverContext: ServerContext = {
    root: process.cwd(),
    app,
    pluginContainer,
    plugins
  }
  for (const plugin of plugins) {
    if (plugin.configureServer) {
      await plugin.configureServer(serverContext)
    }
  }

  // html中间件
  app.use(indexHtmlMiddle(serverContext))

  // js插件
  app.use(transformMiddleware(serverContext))

  app.listen(3000, async () => {
    await optimizer(root)

    console.log(green('🚀 No-Bundle 服务已经成功启动!'),
        `耗时：${ ( performance.now() - startTime ).toFixed(2) }ms`
    )
    console.log(`> 本地访问路径：${ blue('http://localhost:3000') }`)
  })
}



