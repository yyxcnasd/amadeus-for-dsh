# plugin/ — Amadeus 插件源码

本目录是插件的**可移植源码**，构建流程：`node tools/build_static.mjs` 将两半源码生成静态包 `package/`（安装器安装的就是它）。

| 文件 | 说明 |
| --- | --- |
| `src/host.js` | 宿主半：TTS 合成（edge/voicevox/aqua/openai/quest）、STT、语音队列、`/amadeus/*` 路由、RPC、记忆、人格注入 |
| `src/client.js` | 客户端半：浮动面板、设置页、状态轮询、主题 |
| `web/` | 翻盖手机面板（panel.html/css/js）+ Live2D vendor 库 + emotion 映射 |

## 运行方式

- **静态安装**（正式）：`install.ps1` 安装 `package/` 静态包，ROOT 由 `import.meta.url` 自动定位，无需改任何路径。
- **动态调试**（会话内热更新）：把 `src/host.js` / `src/client.js` 内容经 `cordis_define` 加载，或用环境变量 `AMADEUS_ROOT=<项目根>` 覆盖资源目录。

## 依赖

- **Host**：Python 3.8+ 与 `pip install edge-tts`（TTS 主通道）；`curl.exe`（Windows 自带，备用通道）。可选：Whisper 兼容 STT API。
- **浏览器**：可访问 jsDelivr CDN（pixi.js / pixi-live2d-display）。