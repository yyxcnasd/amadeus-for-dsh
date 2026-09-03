// ============================================================
// Amadeus for DSH — Client half (v3)
// 功能：暗红全局主题；牧濑红莉栖 Live2D 常驻右侧栏（details 列）；
//   设置页；侧边栏打开按钮；配置与状态轮询。
// 说明：本文件内容即动态 Cordis 插件的 client 函数体（return {...}）。
// ============================================================
// 静态版 client（由 tools/build_static.mjs 生成，勿手改）
import React from 'react'

export const inject = ['timer', 'slots']
export function apply(ctx) {
    const slots = ctx.get('slots')
    if (slots === undefined) return
    const layout = ctx.get('layout')    // ---------------- 静态版桥接（host → fetch；styles → DOM） ----------------
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


    // ---------------- 样式 ----------------
    const removeCss = domCss(
      ".amad-col{display:flex;flex-direction:column;height:100%;min-height:440px;background:var(--dsw-alias-bg-base,transparent);border-left:1px solid var(--dsw-alias-border-l1,transparent);}" +
      ".amad-header{display:flex;align-items:center;gap:6px;padding:8px 10px;user-select:none;background:linear-gradient(90deg,rgba(163,67,59,.45),rgba(163,67,59,.12));border-bottom:1px solid rgba(255,255,255,.1);flex:none;}" +
      ".amad-dot{width:8px;height:8px;border-radius:50%;display:inline-block;flex:none;}" +
      ".amad-title{font-weight:700;letter-spacing:2px;color:var(--dsw-alias-label-primary,#f2e9e6);font-size:13px;}" +
      ".amad-sub{font-size:10px;color:var(--dsw-alias-label-secondary,#9a8f8b);margin-right:auto;}" +
      ".amad-btn{border:0;background:rgba(255,255,255,.08);color:inherit;width:24px;height:24px;border-radius:6px;font-size:12px;cursor:pointer;line-height:1;padding:0;flex:none;}" +
      ".amad-btn:hover{background:rgba(255,255,255,.18);}" +
      ".amad-frame{flex:1;min-height:300px;width:100%;border:0;display:block;background:transparent;}" +
      ".amad-footer{padding:4px 10px;font-size:10px;color:var(--dsw-alias-label-secondary,#8d8380);border-top:1px solid rgba(255,255,255,.08);flex:none;}" +
      ".amad-settings-row{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:10px 4px;border-bottom:1px solid rgba(128,128,128,.18);}" +
      ".amad-settings-label{font-weight:600;}" +
      ".amad-settings-desc{font-size:12px;color:#9a8f8b;margin-top:2px;}" +
      ".amad-settings select{border:1px solid rgba(128,128,128,.4);border-radius:6px;padding:4px 8px;background:transparent;color:inherit;}" +
      ".amad-settings-btn{border:1px solid rgba(128,128,128,.4);background:transparent;color:inherit;border-radius:6px;padding:5px 12px;cursor:pointer;margin-right:8px;}" +
      ".amad-settings-btn:hover{background:rgba(128,128,128,.15);}" +
      ".amad-sb-btn{border:0;background:transparent;color:inherit;cursor:pointer;font-size:12px;padding:6px 10px;border-radius:6px;display:flex;align-items:center;gap:6px;}" +
      ".amad-sb-btn:hover{background:rgba(128,128,128,.15);}" +
      ".amad-warn{margin-top:14px;font-size:12px;color:#b08968;}"
    )
    ctx.effect(() => removeCss)

    // ---------------- Amadeus 全局主题（强制暗红：light/dark 均取暗色） ----------------
    const theme = ctx.get('theme')
    const AMADEUS_TOKENS = {
      '--dsw-alias-bg-base': { light: '#170b0e', dark: '#170b0e' },
      '--dsw-alias-bg-layer-1': { light: '#200f13', dark: '#200f13' },
      '--dsw-alias-bg-layer-2': { light: '#2a1419', dark: '#2a1419' },
      '--dsw-alias-bg-overlay': { light: '#331a20', dark: '#331a20' },
      '--dsw-alias-border-l1': { light: '#42262c', dark: '#42262c' },
      '--dsw-alias-border-l2': { light: '#5a333c', dark: '#5a333c' },
      '--dsw-alias-brand-primary': { light: '#e0604f', dark: '#e0604f' },
      '--dsw-alias-label-primary': { light: '#f2e4e1', dark: '#f2e4e1' },
      '--dsw-alias-label-secondary': { light: '#b49a93', dark: '#b49a93' },
      '--dsw-alias-state-error-primary': { light: '#ff6f61', dark: '#ff6f61' },
      '--dsw-alias-state-success-primary': { light: '#7fd47f', dark: '#7fd47f' },
      '--dsw-alias-state-warn-primary': { light: '#e0a06a', dark: '#e0a06a' },
      '--dsw-specific-sidebar-fill': { light: '#1a0c10', dark: '#1a0c10' },
    }
    let themeLayer = null
    function applyTheme(on) {
      if (theme === undefined) return
      if (on && themeLayer === null) {
        try {
          themeLayer = theme.overrideTokens('amade-theme', AMADEUS_TOKENS)
        } catch (e) {
          console.error('[amadeus] 主题覆盖失败', e)
          themeLayer = null
        }
      } else if (!on && themeLayer !== null) {
        try { themeLayer() } catch (e) { /* ignore */ }
        themeLayer = null
      }
    }

    // ---------------- 微 store ----------------
    function createStore(initial) {
      let value = initial
      const subs = []
      return {
        get: () => value,
        set: (next) => {
          if (next === value) return
          value = next
          for (let i = 0; i < subs.length; i++) subs[i]()
        },
        subscribe: (fn) => {
          subs.push(fn)
          return () => {
            const i = subs.indexOf(fn)
            if (i >= 0) subs.splice(i, 1)
          }
        },
      }
    }

    function useStore(store) {
      const [v, setV] = React.useState(store.get())
      React.useEffect(() => store.subscribe(() => setV(store.get())), [])
      return v
    }

    const configStore = createStore(null)
    const statusStore = createStore({ tts: '', queue: 0, cache: 0, error: '', callPending: false, pendingClose: null })

    function encURI(s) {
      const bytes = new TextEncoder().encode(String(s))
      let out = ''
      for (let i = 0; i < bytes.length; i++) {
        const b = bytes[i]
        const c = String.fromCharCode(b)
        if ((c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z') || (c >= '0' && c <= '9') || c === '-' || c === '_' || c === '.' || c === '~') out += c
        else out += '%' + (b < 16 ? '0' : '') + b.toString(16).toUpperCase()
      }
      return out
    }

    let lastConfigJson = ''
    let lastStatusJson = ''
    let lastCallPending = false
    let lastPendingClose = null

    async function refreshStatus() {
      try {
        const res = await hostLocal.call('getStatus', {})
        if (res && typeof res === 'object') {
          const cfg = res.config || null
          let cfgJson = ''
          try { cfgJson = cfg ? JSON.stringify(cfg) : '' } catch (e) { cfgJson = '' }
          if (cfgJson !== lastConfigJson) {
            lastConfigJson = cfgJson
            configStore.set(cfg)
            applyTheme(cfg ? cfg.themeOn !== false : true)
          }
          const st = { tts: res.tts || '', queue: res.queue || 0, cache: res.cache || 0, error: '', callPending: res.callPending === true, pendingClose: typeof res.pendingClose === 'number' ? res.pendingClose : null }
          const stJson = JSON.stringify(st)
          if (stJson !== lastStatusJson) {
            lastStatusJson = stJson
            statusStore.set(st)
          }
          // 来电 → 自动展开右侧栏
          if (res.callPending === true && !lastCallPending) {
            lastCallPending = true
            openDetailsSafe()
          }
          if (res.callPending !== true) lastCallPending = false
          // 面板请求关闭 Amadeus 系统 → 收起右侧栏并确认
          if (typeof res.pendingClose === 'number' && res.pendingClose !== lastPendingClose) {
            lastPendingClose = res.pendingClose
            try { if (layout) layout.closeDetails() } catch (e) { /* ignore */ }
            hostLocal.call('ackClose', {}).catch(() => {})
          }
          if (typeof res.pendingClose !== 'number') lastPendingClose = null
        }
      } catch (e) {
        const st = { tts: '', queue: 0, cache: 0, error: String(e && e.message ? e.message : e) }
        const stJson = JSON.stringify(st)
        if (stJson !== lastStatusJson) {
          lastStatusJson = stJson
          statusStore.set(st)
        }
      }
    }

    async function patchConfig(patch) {
      try {
        const next = await hostLocal.call('setConfig', patch)
        if (next && typeof next === 'object') configStore.set(next)
        return next
      } catch (e) {
        console.error('[amadeus] setConfig failed', e)
        return null
      }
    }

    async function rpcSay(text) {
      try { return await hostLocal.call('say', { text }) } catch (e) { return { ok: false } }
    }
    async function rpcRepeat() {
      try { return await hostLocal.call('repeat', {}) } catch (e) { return { ok: false } }
    }
    async function rpcClear() {
      try { return await hostLocal.call('clear', {}) } catch (e) { return { ok: false } }
    }

    async function rpcTestCall() {
      try { return await hostLocal.call('testCall', {}) } catch (e) { return { ok: false } }
    }

    async function rpcTestChat() {
      try { return await hostLocal.call('testChat', {}) } catch (e) { return { ok: false, error: String(e && e.message ? e.message : e) } }
    }

    async function rpcReport(msg) {
      try { await hostLocal.call('clientReport', { msg: String(msg).slice(0, 250) }) } catch (e) { /* ignore */ }
    }

    function openDetailsSafe() {
      if (layout === undefined) return
      try { layout.openDetails() } catch (e) { /* ignore */ }
    }

    rpcReport('client apply start')

    // iframe 引用与初始 src（模块级单例）
    let iframeEl = null
    let panelSrc = '/amadeus/panel.html'
    let panelSrcSet = false
    let lastSentCfg = ''

    function notifyOpen() {
      if (!iframeEl || !iframeEl.contentWindow) return
      try { iframeEl.contentWindow.postMessage({ type: 'amadeus/open' }, '*') } catch (e) { /* iframe 未就绪 */ }
    }

    function iframeSrc(config) {
      let q = ''
      try { q = encURI(JSON.stringify(config || {})) } catch (e) { q = '' }
      return '/amadeus/panel.html' + (q ? '?cfg=' + q : '')
    }

    // ---------------- 轮询根组件（始终渲染 null） ----------------
    function RootPoller() {
      React.useEffect(() => {
        refreshStatus().then(() => rpcReport('rpc getStatus ok'))
        const dispose = ctx.interval(refreshStatus, 2000)
        return dispose
      }, [])
      return null
    }

    // ---------------- 右侧栏 Amadeus 列 ----------------
    function AmadeusColumn() {
      const config = useStore(configStore)
      const status = useStore(statusStore)

      React.useEffect(() => {
        rpcReport('column mounted')
        return () => rpcReport('column unmounted')
      }, [])

      if (!panelSrcSet && config) {
        panelSrcSet = true
        panelSrc = iframeSrc(config)
      }

      React.useEffect(() => {
        if (!config) return
        let s = ''
        try { s = JSON.stringify(config) } catch (e) { return }
        if (s === lastSentCfg) return
        lastSentCfg = s
        if (iframeEl && iframeEl.contentWindow) {
          try { iframeEl.contentWindow.postMessage({ type: 'amadeus/config', value: config }, '*') } catch (e) { /* iframe 未就绪 */ }
        }
      }, [config])

      return React.createElement('div', { className: 'amad-col' },
        React.createElement('iframe', {
          className: 'amad-frame',
          src: panelSrc,
          title: 'Amadeus Live2D',
          allow: 'microphone; camera; autoplay',
          ref: (el) => { iframeEl = el },
        }),
        React.createElement('div', { className: 'amad-footer' },
          React.createElement('span', null, status.error ? '⚠ host 不可达' : ('● ' + (status.tts || '…') + ' · 队列 ' + status.queue + (status.callPending ? ' · 📞 来电中' : ''))),
        ),
      )
    }

    // ---------------- 设置页 ----------------
    const VOICES = [
      ['ja-JP-NanamiNeural', 'Nanami（女声，默认）'],
      ['ja-JP-KeitaNeural', 'Keita（男声）'],
      ['ja-JP-AoiNeural', 'Aoi（女声）'],
      ['ja-JP-MayuNeural', 'Mayu（女声）'],
      ['ja-JP-ShioriNeural', 'Shiori（女声）'],
      ['ja-JP-NaokiNeural', 'Naoki（男声）'],
      ['ja-JP-DaichiNeural', 'Daichi（男声）'],
    ]
    const RATES = ['-20%', '-10%', '+0%', '+10%', '+20%']
    const PITCHES = ['-20Hz', '-10Hz', '+0Hz', '+10Hz', '+20Hz']

    function Row(props) {
      return React.createElement('div', { className: 'amad-settings-row' },
        React.createElement('div', null,
          React.createElement('div', { className: 'amad-settings-label' }, props.label),
          props.desc ? React.createElement('div', { className: 'amad-settings-desc' }, props.desc) : null,
        ),
        props.control,
      )
    }

    function Check(props) {
      return React.createElement('input', {
        type: 'checkbox',
        checked: !!props.checked,
        onChange: (e) => props.onChange(!!e.target.checked),
      })
    }

    function Select(props) {
      const options = props.options.map((o) => React.createElement('option', { key: o[0], value: o[0] }, o[1]))
      return React.createElement('select', {
        value: props.value,
        onChange: (e) => props.onChange(e.target.value),
      }, options)
    }

    function TextInput(props) {
      return React.createElement('input', {
        type: props.type || 'text',
        value: props.value || '',
        placeholder: props.placeholder || '',
        onChange: (e) => props.onChange(e.target.value),
        style: { flex: 1, minWidth: 0, border: '1px solid rgba(128,128,128,.4)', borderRadius: '6px', padding: '4px 8px', background: 'transparent', color: 'inherit' },
      })
    }

    function AmadeusSettings() {
      const config = useStore(configStore)
      const status = useStore(statusStore)
      if (!config) {
        return React.createElement('div', null,
          React.createElement('div', { className: 'amad-settings-row' }, React.createElement('span', null, status.error ? '⚠ 无法连接 Amadeus Host：' + status.error : '正在连接 Amadeus Host…')),
        )
      }
      const group = (title) => React.createElement('div', { style: { marginTop: '18px', marginBottom: '4px', fontSize: '12px', fontWeight: 700, letterSpacing: '1px', color: '#d98a7d', textTransform: 'uppercase' } }, title)
      const idleOptions = [[300000, '5 分钟'], [600000, '10 分钟'], [1200000, '20 分钟（默认）'], [1800000, '30 分钟'], [3600000, '60 分钟']]
      const callOptions = [[7200000, '2 小时'], [21600000, '6 小时'], [36000000, '10 小时（默认）'], [86400000, '24 小时']]
      const pickIdle = (v) => idleOptions.find((o) => o[0] === v) ? v : 1200000
      const pickCall = (v) => callOptions.find((o) => o[0] === v) ? v : 36000000
      return React.createElement('div', null,
        group('基本开关'),
        Row({ label: '语音朗读', desc: '助手回复自动由 Amadeus 朗读', control: Check({ checked: config.voiceOn !== false, onChange: (v) => patchConfig({ voiceOn: v }) }) }),
        Row({ label: 'AI 聊天', desc: '右栏底部与 Amadeus 直接对话（日语音频 + 中文文字，带长期记忆）', control: Check({ checked: config.chatOn !== false, onChange: (v) => patchConfig({ chatOn: v }) }) }),
        Row({ label: '主动来电', desc: '她每天像原作一样主动「打电话」给你（来电铃音 + 震屏）', control: Check({ checked: config.callOn !== false, onChange: (v) => patchConfig({ callOn: v }) }) }),
        Row({ label: '空闲闲聊', desc: '长时间不互动时，她主动找话题开口说话', control: Check({ checked: config.idleChatOn !== false, onChange: (v) => patchConfig({ idleChatOn: v }) }) }),
        Row({ label: '红莉栖人格注入', desc: '让 Agent 以 Amadeus（红莉栖）口吻回答，作用于所有会话', control: Check({ checked: config.personaOn === true, onChange: (v) => patchConfig({ personaOn: v }) }) }),
        Row({ label: 'Amadeus 全局主题', desc: '整套 GUI 强制暗红 Amadeus 配色（插件停止后自动还原）', control: Check({ checked: config.themeOn !== false, onChange: (v) => patchConfig({ themeOn: v }) }) }),

        group('AI 聊天（独立 API，留空则用 DSH 默认模型）'),
        Row({ label: 'API 地址', desc: 'OpenAI 兼容格式', control: TextInput({ value: config.chatBaseUrl, placeholder: 'https://api.deepseek.com/v1', onChange: (v) => patchConfig({ chatBaseUrl: v }) }) }),
        Row({ label: '模型名', control: TextInput({ value: config.chatModel, placeholder: 'deepseek-chat', onChange: (v) => patchConfig({ chatModel: v }) }) }),
        Row({ label: 'API Key', desc: '留空 = 使用 DSH 默认模型通道', control: TextInput({ type: 'password', value: config.chatApiKey, placeholder: 'sk-…', onChange: (v) => patchConfig({ chatApiKey: v }) }) }),

        group('语音合成'),
        Row({ label: 'TTS 通道', desc: '为保证声线统一，默认不自动切换音色', control: Select({ value: config.provider, options: [['edge', 'Edge TTS（默认，稳定）'], ['voicevox', '本地 VOICEVOX'], ['quest', 'VOICEVOX 公共 API'], ['aqua', '本地 Aqua-TTS / GPT-SoVITS'], ['openai', 'OpenAI 兼容 TTS'], ['auto', '自动（Aqua→VOICEVOX，仅在显式开启时切公共）']], onChange: (v) => patchConfig({ provider: v }) }) }),
        Row({ label: '音色', control: Select({ value: config.voiceName, options: VOICES, onChange: (v) => patchConfig({ voiceName: v }) }) }),
        Row({ label: '语速', control: Select({ value: config.rate, options: RATES.map((r) => [r, r]), onChange: (v) => patchConfig({ rate: v }) }) }),
        Row({ label: '音调', control: Select({ value: config.pitch, options: PITCHES.map((p) => [p, p]), onChange: (v) => patchConfig({ pitch: v }) }) }),
        Row({ label: '情绪强度', desc: '放大/减弱情绪 prosody（0.5~2.0，默认 1.0）', control: Select({ value: String(config.emotionIntensity || 1.0), options: [['0.5', '0.5（克制）'], ['0.75', '0.75'], ['1', '1.0（默认）'], ['1.2', '1.2（稍夸张）'], ['1.5', '1.5（夸张）'], ['2', '2.0（极夸张）']], onChange: (v) => patchConfig({ emotionIntensity: Number(v) }) }) }),
        Row({ label: '保持声线稳定', desc: '开启后 TTS 失败也不切到其它音色（推荐）', control: Check({ checked: config.voiceStability !== false, onChange: (v) => patchConfig({ voiceStability: v }) }) }),
        Row({ label: '失败切公共 API', desc: '仅当“保持声线稳定”关闭时生效', control: Check({ checked: config.fallbackToQuest === true, onChange: (v) => patchConfig({ fallbackToQuest: v }) }) }),

        group('语音输入'),
        Row({ label: '识别方式', control: Select({ value: config.sttProvider || 'auto', options: [['auto', '自动（优先浏览器识别）'], ['browser', '仅浏览器识别'], ['api', '后端 Whisper API']], onChange: (v) => patchConfig({ sttProvider: v }) }) }),
        Row({ label: 'STT API 地址', desc: '留空使用 AI API 地址', control: TextInput({ value: config.sttApiUrl, placeholder: 'https://api.openai.com/v1', onChange: (v) => patchConfig({ sttApiUrl: v }) }) }),
        Row({ label: 'STT API Key', desc: '留空使用 AI API Key', control: TextInput({ type: 'password', value: config.sttApiKey, placeholder: 'sk-…', onChange: (v) => patchConfig({ sttApiKey: v }) }) }),
        Row({ label: 'STT 模型', control: TextInput({ value: config.sttModel || 'whisper-1', placeholder: 'whisper-1', onChange: (v) => patchConfig({ sttModel: v }) }) }),

        group('主动互动节奏'),
        Row({ label: '空闲多久开口', control: Select({ value: pickIdle(config.idleChatMs), options: idleOptions, onChange: (v) => patchConfig({ idleChatMs: Number(v) }) }) }),
        Row({ label: '来电间隔', control: Select({ value: pickCall(config.callIntervalMs), options: callOptions, onChange: (v) => patchConfig({ callIntervalMs: Number(v) }) }) }),

        React.createElement('div', { style: { marginTop: '16px' } },
          React.createElement('button', { className: 'amad-settings-btn', onClick: () => rpcSay('アマデウス、準備完了。') }, '💬 测试语音'),
          React.createElement('button', { className: 'amad-settings-btn', onClick: async () => { const r = await rpcTestChat(); window.alert(r && r.ok ? 'AI API OK: ' + r.content : 'AI API Error: ' + (r && r.error ? r.error : 'unknown')) } }, '🔌 测试 AI API'),
          React.createElement('button', { className: 'amad-settings-btn', onClick: rpcRepeat }, '↺ 重播上一条'),
          React.createElement('button', { className: 'amad-settings-btn', onClick: rpcClear }, '🧹 清空队列'),
          React.createElement('button', { className: 'amad-settings-btn', onClick: rpcTestCall }, '📞 测试来电'),
          React.createElement('button', { className: 'amad-settings-btn', onClick: () => { notifyOpen(); if (layout) layout.openDetails() } }, '👁 打开右侧栏'),
          React.createElement('button', { className: 'amad-settings-btn', onClick: () => { if (layout) layout.closeDetails() } }, '🚫 关闭右侧栏'),
        ),
        React.createElement('div', { className: 'amad-settings-row', style: { marginTop: '10px' } },
          React.createElement('span', { style: { fontSize: '12px', color: '#9a8f8b' } },
            status.error ? '⚠ host 不可达'
              : ('● ' + (status.tts || '…') + ' · 队列 ' + status.queue + (status.callPending ? ' · 📞 来电中' : '')),
          ),
        ),
        React.createElement('div', { className: 'amad-warn' }, '注意：右侧栏为 Amadeus 专用，原「工具详情」面板在插件运行期间被替代，停止插件后恢复。牧濑红莉栖角色版权归 MAGES./Nitroplus；Live2D 模型与语音素材为粉丝制作，仅供个人学习，禁止商用。'),
      )
    }

    // ---------------- 侧边栏常驻入口 ----------------
    function SidebarToggle(props) {
      const wide = !!(props && props.wide)
      return React.createElement('div', null,
        React.createElement(RootPoller),
        React.createElement('button', {
          className: 'amad-sb-btn',
          title: '打开 Amadeus 右侧栏',
          onClick: () => { notifyOpen(); if (layout) layout.openDetails() },
        }, wide ? 'Amadeus' : 'A'),
      )
    }

    // ---------------- 槽位注册 ----------------
    slots.inject('details', () => slots.register(
      { name: 'details', priority: -1 },
      () => React.createElement(AmadeusColumn),
    ))

    slots.inject('sidebar.footer.action', () => slots.register(
      { name: 'sidebar.footer.action', id: 'amadeus', order: 50, label: 'Amadeus' },
      (props) => React.createElement(SidebarToggle, props),
    ))

    slots.inject('settings.section', () => slots.register(
      { name: 'settings.section', id: 'amadeus', order: 90, label: 'Amadeus' },
      () => React.createElement('div', null,
        React.createElement('h2', null, 'Amadeus'),
        React.createElement(AmadeusSettings),
      ),
    ))

    // 默认开启全局主题 + 打开右侧栏（多重保障：立即 + 延迟重试 + 连接重置后重试）
    applyTheme(true)
    openDetailsSafe()
    rpcReport('openDetails called (immediate)')
    ctx.timeout(() => {
      openDetailsSafe()
      rpcReport('openDetails retry (2s)')
    }, 2000)
    ctx.on('connection/reset', () => {
      rpcReport('connection/reset -> openDetails')
      openDetailsSafe()
    })
}