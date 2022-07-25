// connect 是一个具有中间件机制的轻量级 Node.js 框架。
// 既可以单独作为服务器，也可以接入到任何具有中间件机制的框架中，如 Koa、Express
import connect from 'connect';
// picocolors 是一个用来在命令行显示不同颜色文本的工具
import { blue, green } from 'picocolors';
import { optimizer } from '../optimizer'


export async function startDevServer() {
  const app = connect()
  const root = process.cwd()
  const startTime = performance.now()
  app.listen(3000, async () => {
    await optimizer(root)

    console.log(green('🚀 No-Bundle 服务已经成功启动!'),
        `耗时：${ ( performance.now() - startTime ).toFixed(2) }ms`
    )
    console.log(`> 本地访问路径：${ blue('http://localhost:3000') }`)
  })
}
