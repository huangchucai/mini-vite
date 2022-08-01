import { readFile } from 'fs-extra'
import { Plugin } from '../plugin'

export function cssPlugin(): Plugin {
  return {
    name: 'm-vite: css',
    load(id) {  // 文件的绝对路径
      // 加载
      if (id.endsWith('.css')) {
        return readFile(id, 'utf-8')
      }
    },
    async transform(code, id) {
      if (id.endsWith('.css')) {
        const jsContent = `
const css = '${code.replace(/\r\n/g, "")}';
const style = document.createElement("style");
style.setAttribute("type", "text/css");
style.innerHTML = css;
document.head.appendChild(style);
export default css;
`.trim();
        return {
          code: jsContent
        }
      }
      return null
    }

  }
}
