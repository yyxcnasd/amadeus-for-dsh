// 从动态插件源生成可静态挂载的 ESM 插件包（package/host.mjs + package/client.mjs）
// 用法: node tools/build_static.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'package')

const HOST_SHIM = `    // ---------------- 静态版 RPC 桥（harness → /amadeus/rpc） ----------------
    const rpcHandlers = new Map()
    const harnessLocal = {
      handle: (name, fn) => {
        rpcHandlers.set(name, fn)
        return () => { rpcHandlers.delete(name) }
      },
    }
    ctx.effect(() => webServer.register({
      kind: 'exact',
      path: '/amadeus/rpc',
      handler: async (req, res) => {
        noteHost(req)
        const q = parseQuery(req.url)
        const m = q.m
        const h = typeof m === 'string' ? rpcHandlers.get(m) : undefined
        if (h === undefined) { sendJson(res, 404, { error: 'no such rpc' }); return }
        let args = {}
        if (typeof q.args === 'string' && q.args.length > 0) {
          try { args = JSON.parse(q.args) } catch (e) { /* ignore */ }
        }
        try { sendJson(res, 200, await h(args)) } catch (e) {
          sendJson(res, 500, { error: e && e.message ? e.message : String(e) })
        }
      },
    }))

`

// 静态 host 的路径块：ROOT = host.mjs 所在目录（即安装目录），运行数据在 %DSH_HOME%/amadeus
const STATIC_PATHS = `    // 静态版路径（由 tools/build_static.mjs 生成，勿手改）
    const MODULE_DIR = dirname(fileURLToPath(import.meta.url))
    const ROOT = (typeof process !== 'undefined' && process.env && process.env.AMADEUS_ROOT && process.env.AMADEUS_ROOT.length > 0) ? process.env.AMADEUS_ROOT : MODULE_DIR
    const DATA_DIR = (() => {
      const env = (typeof process !== 'undefined' && process.env) ? process.env : {}
      const dshHome = env.DSH_HOME || (env.USERPROFILE ? env.USERPROFILE + '\\\\.dsh' : '')
      return (dshHome || (typeof process !== 'undefined' && process.cwd ? process.cwd() : '.')) + '/amadeus'
    })()
    const CONFIG_PATH = DATA_DIR + '/config/amadeus.json'
    const MANIFEST_PATH = ROOT + '/config/manifest.json'
    const PERSONA_PATH = ROOT + '/persona/prompt.txt'
    const CHAT_PERSONA_PATH = ROOT + '/persona/chat-persona.txt'
    const MEMORY_PATH = DATA_DIR + '/memory/amadeus-memory.json'
    const TTS_EMOTE_PY = ROOT + '/tools/tts_emote.py'
    const STT_PY = ROOT + '/tools/stt.py'
    const LLM_CHAT_PY = ROOT + '/tools/llm_chat.py'
    const MEM_SAVE_PY = ROOT + '/tools/mem_save.py'
    const TMP_DIR = DATA_DIR + '/tmp'
`

function transformHost() {
  let s = readFileSync(join(ROOT, 'plugin/src/host.js'), 'utf8')
  const marker = `return {\n  inject: ['timer'],\n  apply(ctx) {`
  if (!s.includes(marker)) throw new Error('plugin/src/host.js: 找不到注入标记')
  s = s.replace(marker, `// 静态版 host（由 tools/build_static.mjs 生成，勿手改）
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
export const inject = ['timer', 'fs', 'webServer', 'subprocess']
export function apply(ctx) {`)

  // 路径块整体重写：@@AMADEUS_PATHS_BEGIN@@ … @@AMADEUS_PATHS_END@@
  const beginTag = '// @@AMADEUS_PATHS_BEGIN@@'
  const endTag = '// @@AMADEUS_PATHS_END@@'
  const bi = s.indexOf(beginTag)
  const ei = s.indexOf(endTag)
  if (bi < 0 || ei < 0 || ei <= bi) throw new Error('plugin/src/host.js: 找不到路径块标记')
  s = s.slice(0, bi) + STATIC_PATHS + s.slice(ei + endTag.length)

  // RPC 桥插入路径块之后
  const anchor = 'const MAX_TTS_BYTES = 2000000'
  if (!s.includes(anchor)) throw new Error('plugin/src/host.js: 找不到 shim 锚点 ' + anchor)
  s = s.replace(anchor, anchor + '\n' + HOST_SHIM)

  s = s.split('harness.handle(').join('harnessLocal.handle(')

  const tail = s.lastIndexOf('  },\n}')
  if (tail < 0) throw new Error('plugin/src/host.js: 找不到结尾标记')
  s = s.slice(0, tail) + '}'
  return s
}

function transformClient() {
  let s = readFileSync(join(ROOT, 'plugin/src/client.js'), 'utf8')
  const marker = `return {\n  inject: ['timer'],\n  apply(ctx) {`
  if (!s.includes(marker)) throw new Error('plugin/src/client.js: 找不到注入标记')
  s = s.replace(marker, `// 静态版 client（由 tools/build_static.mjs 生成，勿手改）
import React from 'react'

export const inject = ['timer', 'slots']
export function apply(ctx) {`)
  const anchor = `    const layout = ctx.get('layout')`
  if (!s.includes(anchor)) throw new Error('plugin/src/client.js: 找不到 shim 锚点 ' + anchor)
  s = s.replace(anchor, anchor + `    // ---------------- 静态版桥接（host → fetch；styles → DOM） ----------------
    const hostLocal = {
      call: async (m, args) => {
        const res = await fetch('/amadeus/rpc?m=' + encodeURIComponent(m) + '&args=' + encodeURIComponent(JSON.stringify(args || {})), { cache: 'no-store' })
        return await res.json()
      },
    }
    function domCss(css) {
      const st = document.createElement('style')
      st.textContent = css
      document.head.appendChild(st)
      return () => { try { st.remove() } catch (e) { /* ignore */ } }
    }
`)
  s = s
    .split('host.call(').join('hostLocal.call(')
    .split('const removeCss = styles.insert(').join('const removeCss = domCss(')
    .split(`slots.register(\n      { name: 'details' },`).join(`slots.register(\n      { name: 'details', priority: -1 },`)
  const tail = s.lastIndexOf('  },\n}')
  if (tail < 0) throw new Error('plugin/src/client.js: 找不到结尾标记')
  s = s.slice(0, tail) + '}'
  return s
}

mkdirSync(OUT, { recursive: true })
writeFileSync(join(OUT, 'host.mjs'), transformHost(), 'utf8')
writeFileSync(join(OUT, 'client.mjs'), transformClient(), 'utf8')
console.log('build_static ok -> package/host.mjs, package/client.mjs')
