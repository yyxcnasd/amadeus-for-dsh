# Amadeus for DSH — 架构设计

## 总体架构

```
Browser (client half, plugin/src/client.js)
├─ 浮动面板 iframe /amadeus/panel.html（Live2D 渲染 + 语音队列轮询 + TTS 播放）
└─ 设置页 + 状态轮询（host.call RPC）
        │  同源 HTTP（/amadeus/*）+ RPC
Host (plugin/src/host.js)
├─ session/event 监听 → 回复按句切分 → 语音队列
├─ webServer 路由：/amadeus/tts|poll|stt|chat|memory|manifest|panel|assets|rpc
├─ TTS 子进程（edge-tts / curl 调 VOICEVOX/Aqua/OpenAI/公共 API）
├─ 长期记忆 + 主动来电/空闲闲聊调度 + 人格注入（systemPrompt.section）
```

## 语音链路要点

1. 回复 → 按句切分（≤200 字/句、≤12 句/条）→ 入队；iframe 每 ~150ms 轮询取句。
2. TTS 按 `provider` 分发：edge（默认，Python edge-tts + 情绪 prosody）/ voicevox / aqua / quest / openai / auto。
3. 失败策略：默认 **voiceStability=true** 保持声线、不切音色、不切浏览器语音；显式关闭后才允许浏览器 speechSynthesis 兜底 / fallbackToQuest 切公共 API。
4. 口型同步：响应头 `X-Amadeus-Words` 携带逐词时间戳，词包络 + 音频能量（AnalyserNode）双驱动。
5. 语音输入：浏览器 SpeechRecognition 优先 → MediaRecorder 降级 → POST `/amadeus/stt`（Whisper 兼容 API）。

### 为什么 TTS 走子进程

DSH `web` 服务只能回 html/text，取不到二进制音频；Host 内置函数无 `fetch`，但可用 `subprocess`。统一由 Python/curl 合成到 `tmp/`（8 槽位 round-robin），`fs.readBytes` 读回后经路由同源返回；子进程 40s 超时。

## 人设注入

`systemPrompt.section({name:'amadeus-persona', text:() => personaOn ? prompt : ''})`，默认关闭；文本来自 `persona/prompt.txt`。

## 客户端浮层

`shell.overlay` 注册：拖拽（Pointer Capture）、折叠、关闭可经设置页重开；模块级微 store + 每 2s 轮询 `getStatus`；iframe 自治、不依赖父级转发语音。首次 `audio.play()` 被拒时显示「点击启用语音」，点击后恢复 AudioContext 并播放就绪语。

## 配置（%DSH_HOME%\amadeus\config\amadeus.json）

键：`voiceOn` `personaOn` `voiceName`（ja-JP-* 共 7 个）`rate/pitch` `provider`（edge/aqua/voicevox/quest/openai/auto）`questSpeaker` `emotionIntensity`（0.2~2）`fallbackToQuest` `voiceStability` `sttProvider/sttApiUrl/sttApiKey/sttModel` `aquaUrl/aquaVoice/aquaRefAudio/...` `voicevoxUrl/voicevoxSpeaker` `openaiTtsUrl/openaiTtsApiKey/openaiTtsModel/openaiTtsVoice` `maxCharsPerTurn`。`setConfig` 白名单校验后写回。

## 演进路线

- 当前：轮询拉取（~150ms）、句级 TTS、词级口型 + 能量双驱动、常驻 Live2D 动画、后端 STT 兜底。
- 候选：Host→iframe 改 WS/SSE；Aqua 流式分块；红莉栖专属音色接入（见 `research/tts.md`）。

## 合规

角色形象/声音/台词归 MAGES./Nitroplus；Live2D 模型与语音素材为粉丝制作，仅供个人学习，禁止商用。模型资产由 `tools/fetch-assets.ps1` 按需下载，路由仅托管本地文件。