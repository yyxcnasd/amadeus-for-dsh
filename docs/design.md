# Amadeus for DSH — 架构设计

## 目标

在 DSH Web GUI 中实现《命运石之门 0》的 Amadeus 体验：牧濑红莉栖 Live2D 立绘 + 实时语音朗读助手回复 + 可选人格注入。

## 总体架构

```
┌───────────────────────────── DSH Web GUI (browser) ────────────────────────────┐
│                                                                                │
│  Client half (React, plugin/src/client.js)                                     │
│   ├─ shell.overlay  → AmadeusOverlay（可拖拽浮层：标题栏控制 + 状态栏）        │
│   │     └─ <iframe src="/amadeus/panel.html">  ← 同源 iframe，完全自治         │
│   │           ├─ Live2D 渲染（pixi.js + pixi-live2d-display, CDN）            │
│   │           ├─ 语音队列轮询 GET /amadeus/poll                                 │
│   │           ├─ TTS 播放 GET /amadeus/tts（AnalyserNode 能量 → 嘴型参数）     │
│   │           └─ 开机动画 / 气泡 / 解锁提示                                     │
│   └─ settings.section → AmadeusSettings（音色/语速/音调/开关）                  │
│                                                                                │
└───────────────────────────────┬────────────────────────────────────────────────┘
                                │ 同源 HTTP（/amadeus/*）+ 包私有 RPC（host.call）
┌───────────────────────────────┴────────────────────────────── Host half ──────┐
│  Host half (plugin/src/host.js)                                                │
│   ├─ session/event 监听 → assistant/message → 按句切分 → 语音队列（id 递增）   │
│   ├─ webServer 路由                                                            │
│   │    /amadeus/tts        Edge TTS 合成（curl + 内嵌 SHA-256 → Sec-MS-GEC）   │
│   │    /amadeus/poll       语音队列消费（cursor 语义，消费即出队）              │
│   │    /amadeus/manifest   Live2D 模型清单                                     │
│   │    /amadeus/panel.html /amadeus/web/*  面板页面与脚本                      │
│   │    /amadeus/assets/*   Live2D 模型 / 立绘静态资产（防路径穿越）            │
│   ├─ harness.handle RPC：getStatus / setConfig / say / repeat / clear          │
│   └─ systemPrompt.section（personaOn 时注入 persona/prompt.txt）               │
└────────────────────────────────────────────────────────────────────────────────┘
```

## 语音链路与降级

```
Agent 回复
  → host: session/event ('assistant/message')
  → 提取 text blocks → 去重（message.id）→ 截断（maxCharsPerTurn）
  → splitSentences（。！？!?…\n 处断开，每句 ≤200 字符，每条消息 ≤12 句）
  → 队列 {id, text, force?}
iframe 每 300ms 轮询 /amadeus/poll?after=cursor
  → 逐句 GET /amadeus/tts?text=&voice=&rate=&pitch=
      ① provider=edge（默认）：edge-tts + 情绪 prosody + 词时间戳
      ② provider=voicevox：本地 VOICEVOX（audio_query → synthesis，WAV）
      ③ provider=aqua：本地 Aqua-TTS / GPT-SoVITS（/tts/file，WAV）
      ④ provider=quest：VOICEVOX 公共 API；provider=openai：OpenAI 兼容 TTS
      ⑤ provider=auto：Aqua（若配置）→ 本地 VOICEVOX；默认不切公共 API
  → 失败：默认保持声线稳定，直接 502 → iframe 不切浏览器语音；
    仅当显式关闭 voiceStability 时才允许浏览器 speechSynthesis 兜底，
    且只有同时开启 fallbackToQuest 才切公共 API
  → 音频响应头 X-Amadeus-Words 携带逐词时间戳
  → <audio> 真正开始播放后才启动嘴型（词包络 + AnalyserNode 能量双驱动）
  → Live2D 常驻动画循环：呼吸/眨眼/眼球/头部/身体平滑动作，说话时叠加情绪手势
```

### 语音输入

```
iframe 麦克风按钮
  → 若浏览器支持 SpeechRecognition 且未强制 API：使用浏览器识别（JA/ZH/TW）
  → 否则 MediaRecorder 录音（8s 自动停止）→ POST /amadeus/stt
  → host 将音频 base64 写入 tmp，调 tools/stt.py 请求 OpenAI Whisper 兼容接口
  → 识别文本填入输入框并自动发送
```

### 为什么 TTS 走 Host 的子进程

- DSH 的 `web` 服务只返回 html/text（`WebFetchBody` 封闭联合），取不到二进制音频；
- 动态插件 Host 内置函数无 `fetch`，但拥有 `subprocess` 服务。本地 TTS 统一通过 Python/curl 子进程完成：VOICEVOX/Aqua-TTS 用 `curl.exe` 调 HTTP API；Edge（备用）用官方 `edge-tts` Python 库（`python -m edge_tts`，维护活跃、已在本机实测成功）；
- 备用通道 VOICEVOX 公共 API 用 `curl.exe`（两段：查询 JSON → 下载 mp3）；输出写临时文件（`tmp/` 目录 8 槽位 round-robin，无磁盘膨胀），用 `fs.readBytes` 读回后经 `webServer` 路由流式返回同源音频，浏览器无 CORS 问题；
- 子进程均有 40s 超时（`Promise.race` + `proc.terminate()`）。

## 人设注入

- `systemPrompt.section({name: 'amadeus-persona', text: () => personaOn ? prompt : ''})`；
- 文本来自项目目录 `persona/prompt.txt`（apply 时异步读取，失败用内嵌默认文本）；
- 默认关闭（`config/amadeus.json: personaOn=false`），开启后影响本进程所有 Agent 会话的语气。

## 客户端浮层

- 注册 `shell.overlay`（id `amadeus`，fresh id 不替换任何内置项）；
- 面板：拖拽（Pointer Capture，`getBoundingClientRect` 定位）、折叠成小圆片、关闭后经设置页重开；
- 状态通过微 store（模块级订阅）+ `host.call('getStatus')` 每 2s 轮询同步；
- 面板与设置页共享同一 store，iframe 自治（不依赖父级转发语音）。

## 浏览器自动播放策略

- iframe 内首次 `audio.play()` 被拒时显示「点击以启用语音」浮层；
- 用户点击 → 恢复 AudioContext → 播放就绪语「Amadeus, ready.」→ 后续程序化播放放行。

## 配置

`config/amadeus.json`（宿主启动时读取，`setConfig` 白名单校验后写回）：

| 键 | 默认 | 说明 |
| --- | --- | --- |
| voiceOn | true | 自动朗读 |
| personaOn | false | 人格注入 |
| voiceName | ja-JP-NanamiNeural | Edge 音色（7 个日文音色可选） |
| rate / pitch | +0% / +0Hz | SSML prosody |
| provider | edge | edge / aqua / voicevox / quest / openai / auto |
| questSpeaker | 8 | tts.quest VOICEVOX speaker |
| emotionIntensity | 1.2 | 情绪 prosody 缩放（0.2~2.0） |
| fallbackToQuest | false | 本地 TTS 失败时是否切公共 API（默认关，保音色稳定） |
| voiceStability | true | 开启后 TTS 失败不切其它音色 |
| sttProvider / sttApiUrl / sttApiKey / sttModel | auto / '' / '' / whisper-1 | 语音输入识别方式与 Whisper 兼容 API |
| aquaUrl / aquaVoice / aquaRefAudio / aquaPromptText / aquaApiKey | - | Aqua-TTS 本地服务、角色与可选鉴权配置 |
| voicevoxUrl / voicevoxSpeaker | 127.0.0.1:50021 / 8 | 本地 VOICEVOX 配置 |
| openaiTtsUrl / openaiTtsApiKey / openaiTtsModel / openaiTtsVoice | - | OpenAI 兼容 TTS（可选） |
| maxCharsPerTurn | 1400 | 单条回复朗读上限 |

## 已知限制与路线图

- **v1（当前）**：轮询拉取语音（300ms 粒度）；TTS 为句级请求（首句延迟约 0.5–1.5s）；已支持词级口型（响应头）+ 音频能量双驱动、常驻 Live2D 动画循环、后端 STT 兜底。
- **v2 候选**：Host→iframe 改 WebSocket/SSE 推送；Aqua-TTS 流式分块播放（当前走 /tts/file 整句）；GPT-SoVITS 角色音色一键接入（见 research/tts.md）。
- **v3 候选**：红莉栖专属音色（`Loke-60000/christina-TTS` 或 GPT-SoVITS 自训，需本地 GPU；见 research/tts.md）。

## 权限与合规

- 角色形象/声音/台词版权归 MAGES./Nitroplus；Live2D 模型为粉丝制作（作者不明、无许可、禁商用），插件默认**仅个人学习用途**。
- 插件不内置任何受版权内容：模型资产由 `tools/fetch-assets.ps1` 按需下载到本地 `assets/`，路由仅托管本地文件。
