# Amadeus DSH 插件（plugin/）

本目录是 Amadeus 插件的「可移植源码」：`src/host.js` 与 `src/client.js` 的内容即动态 Cordis 插件两半的函数体（经 `cordis_define` 直接加载运行），`web/` 为 Live2D 面板页面。

## 运行方式（当前）

1. 在 DSH Web GUI 中通过动态 Cordis 插件加载本目录的 `src/host.js`（host 半）与 `src/client.js`（client 半）。
2. Host 半以 `D:/Random Things/Amadeus for DSH` 为项目根，注册 `/amadeus/*` 路由并托管本目录 `web/` 与仓库 `assets/`。
3. 若迁移到其他机器：修改 `src/host.js` 顶部的 `ROOT` 常量为新项目根路径。

## 依赖

- **Host 机器**：Python 3.8+ 且已安装 `edge-tts`（`pip install edge-tts`，TTS 主通道）；`curl.exe`（Windows 自带，VOICEVOX/Aqua/OpenAI 备用通道）。若使用后端语音输入，需要可访问的 Whisper 兼容 API（在设置页填写 STT API/Key）。
- **浏览器**：能访问 jsDelivr CDN（pixi.js / pixi-live2d-display）；同源 iframe 自动加载。

## 文件

| 文件 | 说明 |
| --- | --- |
| `src/host.js` | 宿主半：TTS 合成（edge/voicevox/aqua/openai/quest，声线稳定策略）、STT 后端识别、语音队列、路由、RPC、人格注入 |
| `src/client.js` | 客户端半：浮动面板、设置页、状态轮询（iframe 已开启麦克风权限） |
| `web/panel.html` / `panel.css` / `panel.js` | iframe 内 Amadeus 面板：Live2D 常驻动画循环、嘴型同步、语音输入、气泡、开机动画 |

## 嵌入到 dsh-web-ui 仓库（可选路线）

可复制为 `packages/dsh-amadeus/`，将 `src/host.js`/`src/client.js` 改造为 cordis 插件模块（`export default` + `import`），`ROOT` 改为通过配置注入；`web/` 由构建系统打进 dist 后经插件自身的路由托管。当前动态插件形态与永久插件形态的 API 完全一致（webServer / systemPrompt / slots 服务）。
