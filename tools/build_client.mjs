// 打包静态客户端 bundle：CJS + react 外部化 + __ModuleLoader__.load 注册包装
// 用法: node tools/build_client.mjs
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const ID = 'amadeus-for-dsh'

// 优先使用仓库本地 esbuild（devDependencies，标准 module resolution，跨平台）；
// 找不到时回退到历史 DSH checkout 的 esbuild（旧开发机兼容）。
let esbuild
try {
  const mod = await import('esbuild')
  esbuild = mod && typeof mod.build === 'function' ? mod : undefined
} catch (e) {
  esbuild = undefined
}
if (esbuild === undefined) {
  const candidates = [
    'D:/apps/deepseek-harness/node_modules/.pnpm/esbuild@0.25.12/node_modules/esbuild/lib/main.js',
    'D:/apps/deepseek-harness/node_modules/.pnpm/esbuild@0.21.5/node_modules/esbuild/lib/main.js',
    'D:/apps/deepseek-harness/node_modules/.pnpm/esbuild@0.28.1/node_modules/esbuild/lib/main.js',
  ]
  const mainPath = candidates.find((p) => existsSync(p))
  if (mainPath === undefined) throw new Error('未找到 esbuild：请在仓库运行 npm i -D esbuild 后重试')
  const req = createRequire(mainPath)
  esbuild = req('esbuild')
}

await esbuild.build({
  entryPoints: [join(ROOT, 'client.mjs')],
  bundle: true,
  format: 'cjs',
  platform: 'browser',
  external: ['react'],
  outfile: join(ROOT, 'client.js'),
  banner: {
    js: `window.__ModuleLoader__.load({ id: ${JSON.stringify(ID)}, factory: (require) => { var module = { exports: {} }; var exports = module.exports;`,
  },
  footer: { js: 'return module.exports; } });' },
  logLevel: 'warning',
})
console.log('build_client ok -> client.js（仓库根）')
