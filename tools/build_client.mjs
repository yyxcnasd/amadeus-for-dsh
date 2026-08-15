// 打包静态客户端 bundle：CJS + react 外部化 + __ModuleLoader__.load 注册包装
// 用法: node tools/build_client.mjs
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const ID = 'amadeus-for-dsh'

const candidates = [
  'D:/apps/deepseek-harness/node_modules/.pnpm/esbuild@0.25.12/node_modules/esbuild/lib/main.js',
  'D:/apps/deepseek-harness/node_modules/.pnpm/esbuild@0.21.5/node_modules/esbuild/lib/main.js',
  'D:/apps/deepseek-harness/node_modules/.pnpm/esbuild@0.28.1/node_modules/esbuild/lib/main.js',
]
let mainPath = candidates.find((p) => existsSync(p))
if (mainPath === undefined) throw new Error('未找到 esbuild lib/main.js')

const req = createRequire(mainPath)
const esbuild = req('esbuild')

await esbuild.build({
  entryPoints: [join(ROOT, 'package/client.mjs')],
  bundle: true,
  format: 'cjs',
  platform: 'browser',
  external: ['react'],
  outfile: join(ROOT, 'package/client.js'),
  banner: {
    js: `window.__ModuleLoader__.load({ id: ${JSON.stringify(ID)}, factory: (require) => { var module = { exports: {} }; var exports = module.exports;`,
  },
  footer: { js: 'return module.exports; } });' },
  logLevel: 'warning',
})
console.log('build_client ok -> package/client.js')
