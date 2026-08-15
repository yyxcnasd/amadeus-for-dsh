# AMADEUS for DSH

《命运石之门 0》Amadeus —— 牧濑红莉栖（Makise Kurisu）智能助手，DeepSeek Harness 插件。

红发翻盖手机里的她：Live2D 立绘 + 日语语音 + 长期记忆 + 主动来电 + AI 聊天。

## ✨ 功能

- **红色翻盖手机 UI**：上屏 Live2D 红莉栖（腰以上构图、呼吸/眨眼/说话嘴型/手势），下屏聊天历史；暗红全局主题。
- **实时语音**：默认 Edge TTS（稳定、开箱即用），也可切本地 VOICEVOX / Aqua-TTS / OpenAI 兼容 TTS / VOICEVOX 公共 API。默认开启「声线稳定」，失败不会自动切到其它音色；每句按情感着色（happy / excited / elated / sad / angry / furious / question / soft / neutral / blush / thinking / surprised 等），情绪强度和回退策略可调。
- **词级口型同步**：TTS 音频响应直接携带逐词时间戳（`X-Amadeus-Words`），嘴型按词包络开合 + 音频能量双驱动，不再重复合成取词。
- **AI 聊天**：红莉栖人格（毒舌傲娇），日语音频 + 中文逐 token 实时流式显示；支持独立 OpenAI 兼容 API（可选，留空用 DSH 默认模型）。
- **长期记忆**：聊天历史 + 长期事实抽取，落盘 `%DSH_HOME%\amadeus\memory\amadeus-memory.json`，跨会话、跨重启保留。
- **主动来电**：像原作一样主动「打电话」（复古铃声 + 震屏 + 接听/拒接），间隔可调；另有空闲闲聊（长时间无互动自动开口）。
- **事件播报**：目标完成 / 子代理结束 / 工作流结束 / 后台任务完成时，她用日语播报。
- **语音输入**：浏览器 SpeechRecognition 优先（JA/ZH 切换），不支持时自动降级为 MediaRecorder 录音 + 后端 Whisper 兼容 API（`/amadeus/stt`）。

## 🚀 一键安装（任何人可用）

> 环境要求：Windows + PowerShell 5.1+，已安装并启动过一次 DeepSeek Harness。
> Edge TTS 通道需要 Python 3.9+（安装器会自动 `pip install edge-tts`，失败也不影响安装，可改用 VOICEVOX 公共 API 通道）。

### 方式一：在线一行命令（推荐，无需下载任何文件）

复制下面这一行，粘贴到 **PowerShell**（或 CMD）里回车：

```powershell
powershell -ExecutionPolicy Bypass -c "irm https://raw.githubusercontent.com/yyxcnasd/amadeus-for-dsh/main/install-online.ps1 | iex"
```

然后按提示选择：

```text
[0] Edge TTS（云端快速，默认推荐）
[1] VOICEVOX 公共 API（云端备用）
[2] 仅安装 / 更新插件
```

### 方式二：发行包 + 双击

1. 到 GitHub Releases 页下载 **Amadeus-for-DSH.zip**；
2. 解压到任意目录；
3. 双击 **`Amadeus-OneClick.bat`**，按提示选择 TTS 通道。

### 方式三：源码 / 开发者

```powershell
git clone https://github.com/yyxcnasd/amadeus-for-dsh.git
cd amadeus-for-dsh
.\install.ps1            # 无参数进入交互菜单；或 .\install.ps1 -Channel edge
```

### 安装后

**重启 DSH**（所有会话自动加载，含右侧栏 UI）。当前正在运行的会话不受影响。

> 注意：静态行生效后不要再让 AI 用「动态插件」方式重复安装（`cordis_define/cordis_run`），否则两条 `/amadeus/*` 路由会冲突（已验证：mount 校验能通过模块解析与 apply，唯一报错是路由重复——重启后即无此问题）。

## ⚙️ 命令参数

```powershell
# 非交互指定 TTS 通道
.\install.ps1 -Channel edge      # Edge TTS（默认）
.\install.ps1 -Channel quest     # VOICEVOX 公共 API

# 卸载（保留你的配置与记忆）
.\install.ps1 -Uninstall
```

## 🗂 安装了什么

| 位置 | 内容 |
| --- | --- |
| `%DSH_HOME%\profiles\node_modules\amadeus-for-dsh\` | 插件本体（静态包 + 资源，重装会整体替换） |
| `%DSH_HOME%\amadeus\config\amadeus.json` | 你的配置（升级不丢） |
| `%DSH_HOME%\amadeus\memory\amadeus-memory.json` | 长期记忆（升级不丢） |
| `%DSH_HOME%\amadeus\tmp\` | 临时音频/合成文件 |
| `%DSH_HOME%\profiles\web\cordis.patch.yml` | 主机组合补丁层（自动插入 `amadeus` 行，原文件备份为 `.bak-*`） |

`%DSH_HOME%` 默认是 `C:\Users\<你>\\.dsh`，可用环境变量 `DSH_HOME` 覆盖。

## 🧹 卸载

```powershell
.\install.ps1 -Uninstall
```

或手动：删除 `cordis.patch.yml` 里的 Amadeus insert 段 + 删除 `profiles\node_modules\amadeus-for-dsh\` 目录。你的数据保留在 `%DSH_HOME%\amadeus\`，如需彻底清除请手动删除该目录。

## 🛠 开发 / 升级

- 动态源（当前会话热更新用）：`plugin/src/host.js`、`plugin/src/client.js`、`plugin/web/*`（html/css/js 为磁盘实时生效）。
- 修改后重建静态包：`node tools\build_static.mjs`（生成 `package/host.mjs`、`package/client.mjs`）→ `node tools\build_client.mjs`（esbuild 打包含 React 的 `package/client.js`）→ 重新 `.\install.ps1`。
- 构建发行包：`powershell -ExecutionPolicy Bypass -File tools\make_dist.ps1`（生成 `Amadeus-for-DSH.zip`）。
- 路径解析：静态包用 `import.meta.url` 定位安装目录；运行数据在 `%DSH_HOME%\amadeus`。开发/调试可用环境变量 `AMADEUS_ROOT` 覆盖资源根目录。

## 配置

DSH 设置页 → **Amadeus** 分区（分组：基本开关 / AI 聊天 / 语音合成 / 主动互动节奏）：

| 项 | 说明 |
| --- | --- |
| 语音朗读 | 助手回复自动朗读 |
| AI 聊天 | 手机键盘区与红莉栖对话 |
| 主动来电 / 来电间隔 | 她主动「打电话」给你 |
| 空闲闲聊 / 空闲多久开口 | 长时间不互动时主动找话题 |
| 红莉栖人格注入 | 让 Agent 全局以红莉栖口吻回答 |
| API 地址 / 模型名 / API Key | 独立 AI 通道（OpenAI 兼容，留空走 DSH 默认模型） |
| TTS 通道 / 音色 / 语速 / 音调 | Edge（默认）/ 本地 VOICEVOX / Aqua-TTS / OpenAI 兼容 TTS / VOICEVOX 公共 API / 自动 |
| 保持声线稳定 / 失败回退 | 默认开启声线稳定，TTS 失败不切其它音色；需显式关闭后才允许切公共 API |
| 语音输入 | 识别方式（自动/浏览器/后端 Whisper）、STT API 地址/Key/模型 |

配置保存在 `%DSH_HOME%\amadeus\config\amadeus.json`。

## 目录结构

```
Amadeus for DSH/
├── install.ps1               # 通用安装器（在线/本地两用，含 -Uninstall）
├── install-amadeus.ps1       # 旧名兼容入口（内部调用 install.ps1）
├── Amadeus-OneClick.bat      # 双击即用的一键安装（选择 TTS 通道）
├── Amadeus-for-DSH.zip       # 发行包（make_dist.ps1 生成，发布到 GitHub Releases）
├── package/                  # 静态插件包（DSH 按裸包名 amadeus-for-dsh 加载）
│   ├── package.json          #   dsh.client 声明 + exports
│   ├── index.js              #   裸包名入口
│   ├── host.mjs              #   静态 host 插件（ESM，生成物）
│   ├── client.mjs            #   静态 client 插件（生成物）
│   └── client.js             #   esbuild 打包产物（含 React）
├── plugin/
│   ├── src/host.js           # host 半（动态插件源）
│   ├── src/client.js         # client 半（动态插件源）
│   └── web/                  # 翻盖手机面板（panel.html/css/js）+ vendor 库
├── tools/                    # tts_emote.py / stt.py / llm_chat.py / mem_save.py / gen_ring.py / 构建脚本
├── assets/                   # Live2D 模型、官方 Amadeus 图标、铃声
├── config/                   # 发行默认配置模板（amadeus.json）+ manifest.json
├── persona/                  # 人格提示词（chat-persona.txt / prompt.txt）
└── docs/                     # 设计文档
```

## 技术说明

- **平台**：host 半（Node，HTTP 路由 + 事件 + 子进程 TTS）+ client 半（浏览器，Slots/Theme/Layout + iframe 面板）。
- **路由**：`/amadeus/tts`（响应头携带词时间戳）、`/amadeus/ttsmeta`（兼容保留）、`/amadeus/stt`（语音输入后端识别）、`/amadeus/chat`+`/amadeus/chatstream`（逐 token 流式）、`/amadeus/memory`、`/amadeus/poll`、`/amadeus/action`、`/amadeus/rpc`（静态版 RPC 桥）。
- **记忆落盘**：`fs.writeText` 携带 `sandboxPolicy.resolve({mode:'danger-full-access'})`；失败时 `tools/mem_save.py` 兜底。
- **铃声**：Mixkit 复古电话铃声（免费许可），`assets/audio/ring.mp3`。

牧濑红莉栖角色版权归 MAGES./Nitroplus；Live2D 模型与语音素材为粉丝制作，仅供个人学习，禁止商用。
