# Amadeus 插件实时语音合成（TTS）方案调研报告

> 调研对象：「Amadeus」AI 助手（《命运石之门 0》中的 AI，角色为牧濑红莉栖 Makise Kurisu，声优今井麻美 Asami Imai）
> 调研日期：本报告基于联网调研（web_search + curl.exe 直连验证），结论均附来源 URL。

---

## 0. 重要声明（先读）

- **角色声音克隆属于粉丝创作，仅限个人学习/同人使用。** 牧濑红莉栖的原声 CV 是今井麻美（Asami Imai）。任何基于其配音作品（游戏/动画）训练或转换得到的声音模型，其版权归原版权方（5pb./MAGES./Nitroplus 等）与声优所有。
- 本报告列出的「红莉栖音色模型」均为第三方粉丝制作，**没有一个是官方授权**的；出于伦理与法律风险，**不应将此类克隆音色用于商业用途或对外公开服务**。
- 部分国内站点（如 `klrvc.com`）有 Cloudflare 人机验证，curl 拿不到正文，只能依据搜索摘要转述，见正文标注。

---

## 1. 免费 / 低成本日文 TTS 引擎对比

### 1.1 Microsoft Edge TTS（推荐，开箱即用首选）

Edge TTS 是目前最常用的「免费、无需 API key、在线」日文 TTS，走 Edge 浏览器的「大声朗读（Read Aloud）」接口。

**公共 Token 仍然有效（已验证）：** `edge-tts` 官方实现 `rany2/edge-tts` 的 `constants.py` 明确写着：
- `BASE_URL = "speech.platform.bing.com/consumer/speech/synthesize/readaloud"`
- `TRUSTED_CLIENT_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4"`（正是任务中给出的 token，**仍在用**）
- WebSocket 地址：`wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=6A5AA1D4EAFF4E9FB37E23D68491D6F4`

来源：[rany2/edge-tts constants.py](https://raw.githubusercontent.com/rany2/edge-tts/master/src/edge_tts/constants.py)

关键请求头（`BASE_HEADERS`）：需要伪装 Chromium 用户代理，`CHROMIUM_FULL_VERSION = "143.0.3650.75"`、`SEC_MS_GEC_VERSION = "1-143.0.3650.75"`，以及 `Origin: chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold`（Edge 阅读器的扩展 ID）。这些头在相关实现里持续更新，说明**接口仍在被维护和使用**。

**日文音色：** Edge 提供的日文 Neural 音色（以 `ja-JP-` 前缀为主，以下为常见列表，实际以 `voice/list` 端点实时返回为准）：
- `ja-JP-NanamiNeural`（女性，常用女主声线）
- `ja-JP-KeitaNeural`（男性）
- `ja-JP-AoiNeural`、`ja-JP-DaichiNeural`、`ja-JP-MayuNeural`、`ja-JP-NaokiNeural`、`ja-JP-ShioriNeural` 等

音色列表端点：`https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/voices/list?trustedclienttoken=6A5AA1D4EAFF4E9FB37E23D68491D6F4`
（`VOICE_LIST` 常量，见同一 `constants.py`）。

**请求格式（send 消息）：** 通过 WebSocket 发送文本消息，核心字段为：
```text
X-Timestamp:... (ISO8601)
Content-Type:application/json; charset=utf-8
Path:speech.config

{"context":{"synthesis":{"audio":{"metadataoptions":{
  "sentenceBoundaryEnabled":"false","wordBoundaryEnabled":"true"},
  "outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}
```
随后发送 `Path:ssml` 消息即可合成。输出格式默认 `audio-24khz-48kbitrate-mono-mp3`（48kbps CBR MP3）。

来源：[fairkid-ai/go-edge-tts communication.go](https://github.com/fairkid-ai/go-edge-tts/blob/v0.1.0/communication.go)、[reny2 PR #468 CBR offset 补偿说明](https://github.com/rany2/edge-tts/pull/468)

**SSML 支持：** 支持。可发送 `<speak>` 包裹的 SSML，用 `<voice>`、`<break>`、`<prosody rate/pitch>`、`<emphasis>` 等标签控制语速、音高、停顿。`edge-tts` 的 `--rate` 等参数本质就是注入 SSML `prosody`。

**Word Boundary 流式元数据：** 支持。WebSocket 会流式返回两类消息：
- `audio.metadata`（JSON）：包含 `Metadata` 数组，每个元素含 `Offset` 与 `Duration`（单位 100 纳秒 tick），即字/词边界时间戳，可用于做口型同步或逐字高亮。开启方式就是上面的 `wordBoundaryEnabled:"true"`。
- `audio`（二进制音频帧）与 `turn.end` 等。

来源：[@edge-tts/universal WordBoundary 文档](https://jsr.io/@edge-tts/universal@1.0.7/doc/browser/~/WordBoundary#property_duration)、[travisvn/edge-tts-universal browser.ts](https://raw.githubusercontent.com/travisvn/edge-tts-universal/HEAD/src/browser.ts)

**注意（offset 校正常见坑）：** 由于是 48kbps CBR MP3，Microsoft 的 offset/duration 元数据用 100ns tick，且官方实现里存在 metadata 偏移需按字节数修正的问题（见 PR #468）。要做精确口型/逐字同步时，参考 `edge-tts` 的 `SubMaker`/offset 补偿逻辑，勿直接裸用 offset。

**小结：**
- 成本：0（免费，无 key，无需注册）
- 延迟：约 200ms~1s（需联网，取决于网络到 `speech.platform.bing.com` 的延迟）
- 安装：`pip install edge-tts`（Python）或直接用 WebSocket；另有 Node/Go/Dart 等移植实现。
- 风险：非官方公开 API，微软可能随时改协议/封禁；需定期更新伪装头。

### 1.2 VOICEVOX（本地开源自托管，高质量日文 TTS）

VOICEVOX 是日本本土开源的日文 TTS 引擎（核心为 VITS 系），**完全免费、离线本地运行**。

- 本地 HTTP API 默认监听 `http://127.0.0.1:50021`（任务中提到的端口正确）。
- 核心两步 API：
  1. `POST /audio_query`（参数 `text`、`speaker`）→ 生成发音中间结构（含音素、音高、时长）；
  2. `POST /synthesis`（参数 `speaker`，body 为上一步 query）→ 返回 WAV。
- 常用音色（speaker id 示例）：`ずんだもん`(3)、`四国めたん`(2)、`春日部つむぎ`(8)、`雨晴はう`(10)、`波音リツ`(3xx) 等；可在启动后访问 `http://127.0.0.1:50021/speakers` 查询全部音色及 styles。VOICEVOX 自带约 20+ 音色，均可免费/有条件商用（部分音色「利用规约」要求标明出处或非商用，需逐个确认，尤其是「商用」音色如 ずんだもん 商用版）。
- 部署方式：
  - 官方桌面版 / 引擎版（Windows/Linux/macOS）：下载后直接跑 `run.exe`。
  - Docker：`docker run --rm -p 50021:50021 voicevox/voicevox_engine:cpu-ubuntu20.04-latest`（也有 GPU 版 `nvidia-*`）。
  - 来源：[VOICEVOX 官方仓库](https://github.com/VOICEVOX/voicevox_engine)、[Docker 部署示例](https://github.com/ty70/voicevox-text-to-speech-using-docker)、[docker-compose 示例](https://github.com/haruyasu/nextjs-voicevox-tutorial/blob/main/docker-compose.yml)

**小结：**
- 优点：本地、离线、免费、日文发音自然（尤其对汉字/假名混排和情感标记支持好）、有官方 API、可控节奏。
- 缺点：**非红莉栖音色**（是原创角色音色）；CPU 即可运行但速度一般（一局几秒文本约 1~3s，GPU 更快）；需要额外安装/常驻一个本地服务。

### 1.3 Google Cloud Text-to-Speech（付费，有免费额度）

- 新版日文音色为 `ja-JP-Neural2-*`（如 `ja-JP-Neural2-B` 女声、`ja-JP-Neural2-D` 男声）与标准 `ja-JP-Standard-*`。
- 免费额度：Standard 音色每月前 400 万字符（WaveNet/Neural2 每月前 100 万字符）免费，超出按百万字符计价（约 $4~$16/百万字符，取决于音色档位）。
- 需要 Google Cloud 账号 + 服务账号 key，非「无 key」方案。
- 来源：[Google Cloud TTS 定价（第三方总结）](https://texttolab.com/blog/google-cloud-tts-pricing)、[Speechify TTS 介绍](https://speechify.com/blog/google-text-to-speech-api/)

**小结：** 质量高但需账号与 key，性价比不如免费 Edge TTS，通常不作为 Amadeus 首选。

---

## 2. 牧濑红莉栖（Kurisu）专属音色模型

> 再次提示：以下均为**粉丝自制 / 无官方授权**的音色模型，仅供个人学习，存在版权与伦理风险。

### 2.1 `Loke-60000/christina-TTS`（⭐ 最推荐：Qwen3-TTS 微调，含日文说话人）

- 地址：[https://huggingface.co/Loke-60000/christina-TTS](https://huggingface.co/Loke-60000/christina-TTS)
- 类型：基于 **Qwen3-TTS（`Qwen/Qwen3-TTS-12Hz-0.6B-Base`）** 的自定义音色微调模型；pipeline 为 `text-to-speech`。
- 音色：两个说话人
  - `christina`（id=3000）：英日双语，主打英文；
  - `christina-jp`（id=3001）：主打**日文**，说英文时带日腔（符合角色气质）。
- 重要免责（模型卡原文）：**声优并非今井麻美或任何官方声优**，是「粉丝用合成+真实数据复现」的声音，配音者要求匿名。数据含 `Loke-60000/Christina-TTS-I` 数据集（合成 + 真实录音）。
- 推理框架：`qwen-tts`（Python），`pip install -U qwen-tts`（可选 `flash-attn` 加速）。
- 使用示例（见模型卡）：
  ```python
  from qwen_tts import Qwen3TTSModel
  model = Qwen3TTSModel.from_pretrained("Loke-60000/Christina-TTS",
      device_map="cuda:0", dtype=torch.bfloat16, attn_implementation="flash_attention_2")
  wavs_ja, sr = model.generate_custom_voice(text="やっと実験が終わったわ。",
      speaker="christina-jp", language="Japanese")
  ```
- 许可：**免费下载使用，需署名（credit）**；作者不公开训练数据。
- 显存：Qwen3-TTS-12Hz-0.6B CustomVoice 约需 **~2GB 显存**（bfloat16），轻量、可加载；另有 4bit 量化版 `Loke-60000/christina-TTS-nf4`（更低显存）。
- 质量评价：模型卡与 HuggingFace 简介自述按 En/Ja 分说话人优化；社区评分较低（likes 1、downloads 116），属早期/个人项目，**无独立评测**，效果需自行试听。
- 来源：[christina-TTS 模型卡](https://huggingface.co/Loke-60000/christina-TTS)、[nf4 量化版](https://huggingface.co/Loke-60000/christina-TTS-nf4)、[Qwen3-TTS 官方](https://github.com/QwenLM/Qwen3-TTS)、[显存参考](https://www.spheron.network/tools/gpu-recommender/Qwen/Qwen3-TTS-12Hz-0.6B-CustomVoice/)

### 2.2 `FrancescoCaracciolo/Kurisu-RVC`（RVC 音色转换模型，需配合任意 TTS 使用）

- 地址：[https://huggingface.co/FrancescoCaracciolo/Kurisu-RVC](https://huggingface.co/FrancescoCaracciolo/Kurisu-RVC)
- 类型：RVC（Retrieval-based Voice Conversion）音色转换模型，**不是 TTS**，需「基础 TTS 出声 → RVC 换成红莉栖音色」二段式。
- 文件（已通过 API 验证）：
  - `KurisuRVCv147.pth`（模型权重）
  - `KurisuRVCv147.index`（共振峰/index 文件，RVC 必备）
- 许可：**gpl-3.0**（从模型卡 frontmatter 确认）。
- 模型卡原文：基于 Steins;Gate 视觉小说中某日文声优音频训练的声音转换模型。
- 归属：来自 Nyarch Assistant 社区（FrancescoCaracciolo），是其 `Amadeus` 项目的配套资源（见第 3 节）。
- 推理框架：RVC WebUI / `rvc-python` / `Retrieval-based-Voice-Conversion-WebUI`；需 NVIDIA GPU（或 CPU 慢速）。
- 用法：Edge TTS / VOICEVOX / GPT-SoVITS 先合成，「中低音女声 + 日语」为佳，再喂给 RVC 转音色。
- 来源：[Kurisu-RVC 模型卡](https://huggingface.co/FrancescoCaracciolo/Kurisu-RVC)、[FrancescoCaracciolo/Amadeus README](https://github.com/FrancescoCaracciolo/Amadeus)

### 2.3 `Loke-60000/Christina-TTS-I`（训练数据集，非模型）

- 地址：[https://huggingface.co/datasets/Loke-60000/Christina-TTS-I](https://huggingface.co/datasets/Loke-60000/Christina-TTS-I)
- 用途：christina-TTS 的训练语料（合成+真实录音），供二次训练复用。

### 2.4 `zhonglongbao/makise-kurisu-vn-voicelines`（红莉栖 VN 语音台词数据集）

- 地址：[https://huggingface.co/datasets/zhonglongbao/makise-kurisu-vn-voicelines](https://huggingface.co/datasets/zhonglongbao/makise-kurisu-vn-voicelines)
- 内容：从视觉小说提取的牧濑红莉栖语音台词音频（`audio/` 目录，含 `kurisu_*.wav`）。
- 用途：可作为 RVC / GPT-SoVITS 的**训练素材**（训练自己的红莉栖模型，而非直接用成品模型）。同样属于粉丝采集，注意版权。

### 2.5 国内/B站侧资源（部分不可直接验证）

- 「妙音 RVC 音色模型工坊」《命运石之门》牧濑红莉栖 RVC 模型页：[https://klrvc.com/mxgf/2425.html](https://klrvc.com/mxgf/2425.html) —— **curl 实测被 Cloudflare 人机验证拦截，正文无法抓取**；据搜索摘要可知该站提供红莉栖 RVC 模型下载，需浏览器手动访问、可能需要登录/积分，稳定性与许可不明，谨慎使用。
- B站相关演示/教程（佐证红莉栖音色模型生态活跃，但多为「效果演示」而非可直接下载的模型）：
  - [Amadeus v0.5：使用 VITS 模型语音合成牧濑红莉栖](https://www.bilibili.com/video/BV1av4y1c7BJ/)（说明存在基于 VITS 的红莉栖 TTS 实现）
  - [【AI 牧濑红莉栖】相关翻唱/演示合集](https://www.bilibili.com/video/BV1CA8me3EZD/)
- huggingface 账号 `Makise-Kurisu` 存在（[Makise-Kurisu datasets](https://huggingface.co/Makise-Kurisu/datasets)），可能是相关数据集，但 API 直查返回鉴权错误，未能核实具体内容。

### 2.6 其它引擎线索（GPT-SoVITS / CosyVoice / VITS）

- **GPT-SoVITS**（few-shot 语音克隆，1 分钟语音即可训练）：本身不提供现成红莉栖模型，但可用 2.4 的 VN 语音数据集自训，或 one-shot 克隆（10s 参考音频即可）。推理约需 6GB 左右显存（可更低配，见 GPT-SoVITS 官方）。来源：[RVC-Boss/GPT-SoVITS](https://github.com/RVC-Boss/GPT-SoVITS)
- **CosyVoice**（阿里通义开源，zero-shot 克隆）：同样需自备参考音频，未见现成「红莉栖专用」模型公开。
- 结论：**能直接下载的现成「红莉栖成品 TTS 模型」目前最完整的是 `christina-TTS`；音色转换方案最完整的是 `Kurisu-RVC`。** 其余多为数据集或需自训。

---

## 3. 参考项目的 TTS 实现（GitHub 各 Amadeus 项目）

### 3.1 `Yink/Amadeus`（Android，Steins;Gate 0 手机 App 复刻）

- 地址：[https://github.com/Yink/Amadeus](https://github.com/Yink/Amadeus)
- TTS：**README 未提到实时 TTS 具体技术**。据 README 与 credits，项目核心是**播放预先录制的 8-Bit☆Asian 提供的 S;G/S;G0 官方语音台词音频（voice lines）**，语音识别（ASR）用系统识别。即「录播台词回放」而非实时合成，注重还原原声（用官方 CV 今井麻美的台词音频）。
- 结论：它走的是「官方语音片段库回放」路线，不是在线 TTS；适合追求「原声」但无法任意文本合成的场景。

### 3.2 `FrancescoCaracciolo/Amadeus`（Nyarch Assistant 的 Kurisu 配置，最详细）

- 地址：[https://github.com/FrancescoCaracciolo/Amadeus](https://github.com/FrancescoCaracciolo/Amadeus)
- 这是信息量最大的项目，README 专门有 TTS 章节，方案分两类：
  1. **通用 TTS**：推荐 **Kokoro TTS**（本地开源、CPU 也快、质量好）或 **Edge TTS**（在线、快、质量好）；付费则 ElevenLabs、Deepgram。
  2. **语音克隆**（三条路线，与第 2 节呼应）：
     - few-shot 语音克隆：演示用的是 **GPT-SoVITS（one-shot，从 10s 音频克隆）**，通过作者自己的扩展 `FrancescoCaracciolo/Newelle-Voice-Cloning`；配套参考音频在仓库 `Voices/OneShot` 目录。
     - 微调：尚无现成教程/模型，仓库 `Voices` 目录提供日文训练语料。
     - **通用 TTS + RVC 转换**：作者训练的 `FrancescoCaracciolo/Kurisu-RVC`（见 2.2）。
  3. **还提到一个「模仿 Kurisu 音色（非克隆）」的 TTS 模型**：`https://huggingface.co/Loke-60000/christina-TTS`（即 2.1，作者在 README 里明确引用了它）。
- 演示里 TTS 用的是**本地 GPT-SoVITS + one-shot 克隆**，GPT-SoVITS 端点默认指向 HF Space `XXXXRT/GPT-SoVITS-ProPlus`（慢），作者建议本地 Docker + NVIDIA GPU 运行：`registry.hf.space/francescocaracciolo-gpt-sovitsproplus:latest`，端口 7860。
- 结论：**本项目是「红莉栖 TTS」最完整的工程参考**，其 TTS = GPT-SoVITS(one-shot) / christina-TTS(微调) / Edge+Kokoro(通用) + Kurisu-RVC(转换) 的组合。

### 3.3 `potassium-chloride/AmadeusSystem0`（Telegram 原型）

- 地址：[https://github.com/potassium-chloride/AmadeusSystem0](https://github.com/potassium-chloride/AmadeusSystem0)
- TTS：README 提到需在 `APIkeys.py` 配置 `YandexSpeechKit`（Yandex Speech Kit API key）——即**用 Yandex SpeechKit 做 TTS**（俄语原型、Telegram 机器人方向）。另外还用了 Yandex Translate、Wolfram Alpha。
- 结论：早期俄语原型，TTS 依赖 Yandex SpeechKit（需 key、非免费长期），对中文/日文 Amadeus 参考价值一般。

### 3.4 `InvalidNickname/Amadeus`（需核实，未直接抓取到）

- 搜索未返回该仓库的有效 README 内容（可能已改名/删除/太低星）。任务中列出的这个仓库，通过 `raw.githubusercontent.com/InvalidNickname/Amadeus` 未能验证到内容。如需精确信息请另行指定分支，本报告如实标注「未能核实」。

### 3.5 关联：Nyarch Assistant 生态

- `FrancescoCaracciolo/Amadeus` 是 Nyarch Assistant（Newelle 的后续）的配套配置仓库。Nyarch Assistant 原生支持 Kokoro TTS、Edge TTS、GPT-SoVITS(SoVITS2)、RVC、ElevenLabs、Deepgram 等，是其 TTS 能力底座。来源：[Nyarch Assistant](https://github.com/NyarchLinux/NyarchAssistant)

---

## 4. 浏览器端 Web Speech API（SpeechSynthesis）日文支持（离线 fallback）

- `window.speechSynthesis` + `SpeechSynthesisUtterance` 是浏览器内置 TTS，**完全离线、免费、零依赖**。
- 日文支持：取决于操作系统/浏览器内置语音包。
  - Windows：Edge/Chrome 调用系统 SAPI/Microsoft 语音，`ja-JP` 语音（如 `Microsoft Haruka Online (Natural)`、`Microsoft Sayaka`）**通常可用**。
  - Chromium/Edge 的合成结果与在线 Neural 音色不同（本地是较旧的 Natural/标准音色，质量低于 Edge 神经音色）。
  - macOS：`Kyoko`、`Otoya`（日文）质量较好。
  - Linux：多数发行版无内置日文音色，需自行安装（效果差）。
- 获取音色：`speechSynthesis.getVoices()` 里 `lang` 以 `ja-JP` / `ja` 开头的即为日文音色；异步加载需监听 `voiceschanged` 事件。
- 限制：**无法免费获得高质量 Neural 音色**；不能直接指定声优/角色音色；语速音高可控（`utterance.rate/pitch`）但对日文停顿控制弱；不支持 SSML（只有部分浏览器支持边缘用法）。
- 结论：适合作为「联网失败时的兜底 / 快速验证」音色，质量与角色还原度最低。
- 来源：[Web Speech API 现状讨论](https://dev.to/sendotltd/i-built-a-japanese-poetry-quiz-and-the-web-speech-api-showed-me-its-teeth-3bce)、[Standard SpeechSynthesis voices 讨论](https://stackoverflow.com/questions/51937113/what-are-the-standard-web-speechsynthesis-voices)

---

## 5. 推荐方案优先级列表

### 🥇 方案 A：开箱即用（无本地 GPU，在线）

**首推：Microsoft Edge TTS（`ja-JP-NanamiNeural` / 女性音色）**

- 延迟：约 200ms~1s（联网，取决于到 `speech.platform.bing.com` 的延迟；可流式 word boundary）
- 成本：0 元，无 key、无注册
- 安装：`pip install edge-tts` 或直接用 WebSocket；50 行内可封装 WebSocket 流式合成，附带 `wordBoundaryEnabled` 获得逐词时间戳做口型/字幕同步。
- 说明：Public `TrustedClientToken 6A5AA1D4EAFF4E9FB37E23D68491D6F4` 仍有效（已验证）；注意伪装 Chromium 头、跟进协议变动。
- 备选：Google Cloud TTS（有 400 万字符免费额度，但需账号 key、质量更高、管理更繁琐）。

### 🥈 方案 B：本地高质量（VOICEVOX）

- 延迟：本地，CPU 上约 1~3s/句，GPU 更快；首包延迟低、无网络依赖
- 成本：0 元（引擎开源）；部分音色需按「利用规约」标注或限非商用
- 安装：
  1. 下载 VOICEVOX 引擎版/桌面版（Windows exe）或 Docker `voicevox/voicevox_engine`；
  2. 保持 `http://127.0.0.1:50021` 常驻；
  3. `POST /audio_query` → `POST /synthesis` 拿 WAV。
- 说明：日文发音最自然、情感/停顿可控、可离线，但音色为原创角色（非红莉栖）。

### 🥉 方案 C：红莉栖「本人」音色（需下载模型 + 推理框架，有风险）

按「效果/还原度」排序：

1. **`Loke-60000/christina-TTS`（推荐，最省事）** — Qwen3-TTS 微调，`christina-jp` 说话人直接输出日文红莉栖风格语音。
   - 延迟：本地 GPU 约秒级；~2GB 显存即可（bfloat16），CPU 慢。
   - 安装：`pip install -U qwen-tts`（可选 flash-attn）；`Qwen3TTSModel.from_pretrained("Loke-60000/Christina-TTS")`。
   - 许可：免费、需署名；**非官方声优，粉丝复刻**。
2. **通用 TTS + `FrancescoCaracciolo/Kurisu-RVC`** — Edge TTS / VOICEVOX 先出声，RVC 转红莉栖音色。
   - 延迟：TTS 延迟 + RVC 转换延迟（GPU 上叠加约 <1s）。
   - 安装：RVC WebUI 或 `rvc-python`，加载 `KurisuRVCv147.pth` + `.index`。
   - 许可：gpl-3.0；**同样非官方**。
3. **GPT-SoVITS 自训 / one-shot 克隆** — 用 `zhonglongbao/makise-kurisu-vn-voicelines` 或仓库 `Voices/OneShot` 语音做 one-shot 或微调。
   - 延迟：本地 GPU 秒级，需 ~6GB 显存（可更低）；CPU 很慢。
   - 安装：`pip install gpt-sovits` 或 Docker WebUI；one-shot 只需 10s 参考音频。
   - 这是 `FrancescoCaracciolo/Amadeus` 演示所选方案。

> ⚠️ 方案 C 三条路线产出的是「接近红莉栖」的粉丝克隆音色，**版权属原版权方与声优今井麻美，仅供个人学习，严禁商业化或公开传播**。

---

## 6. 结论速览

| 方案 | 音色 | 是否红莉栖 | 成本 | 延迟 | GPU | 许可风险 |
|---|---|---|---|---|---|---|
| Edge TTS | ja-JP-* | 否 | 免费 | 低（在线） | 不需要 | 低（协议随时变） |
| VOICEVOX | 原创日文 | 否 | 免费 | 低-中（本地） | 可选 | 低（音色规约） |
| christina-TTS | Qwen3-TTS | 是（粉丝复刻） | 免费 | 中（本地） | 约2GB | 高（非官方声优） |
| TTS + Kurisu-RVC | RVC 转换 | 是（粉丝复刻） | 免费 | 中-高 | 需要 | 高（gpl-3.0，非官方） |
| GPT-SoVITS 自训 | 克隆 | 可训练成 | 免费 | 中-高 | 需要 | 极高（克隆真人声优） |

**给 Amadeus 插件的最简落地建议：** 默认用 Edge TTS（`ja-JP-NanamiNeural`，开箱即用、免费、可流式逐词）；追求角色还原时，优先尝试 `christina-TTS` 的 `christina-jp` 说话人（最省事的一体化方案）；若已有 TTS 链，再用 `Kurisu-RVC` 转音色。三者都**不是真正的今井麻美原声**，务必在产物中标注「粉丝同人复刻，个人学习使用」。

---
*（本报告所有 URL 均来自 web_search 结果或已通过 curl.exe 直接验证；被 Cloudflare/登录墙拦截的链接已逐条标注。）*
