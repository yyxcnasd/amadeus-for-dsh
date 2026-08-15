# Amadeus 插件调研报告：牧濑红莉栖 Live2D 模型与角色人设

> 调研日期：2026-08-14
> 目标：为「Amadeus」DSH 插件（命运石之门 0 中的牧濑红莉栖 AI 助手）选型 Live2D 模型、浏览器渲染运行时与角色人设。
> 版权提示：**牧濑红莉栖的角色形象、声音、台词均归 MAGES./Nitroplus 所有**。下文所列粉丝自制模型与声音克隆素材仅供个人学习研究，禁止任何商用。

---

## 一、Live2D 模型资源调研

### 1.1 已实际验证可下载的模型（★唯一确认格式并通过 curl 验证的资源）

**来源：FrancescoCaracciolo/Amadeus 项目（Nyarch Linux 团队托管）**

- 项目仓库：[github.com/FrancescoCaracciolo/Amadeus](https://github.com/FrancescoCaracciolo/Amadeus)
- 直接下载链接（均已 HTTP 200 验证，Cloudflare 托管，均在到期）：
  - `https://nyarchlinux.moe/Kurisu.zip`（8,745,653 字节 ≈ 8.7 MB，`application/zip`）
  - `https://nyarchlinux.moe/kurisu.tar.gz`（8,632,320 字节 ≈ 8.6 MB，`application/gzip`）
- 模型格式：**Cubism 2（旧格式）**。解压后目录结构如下（已本地实际解压验证）：

  ```
  kurisu/
  ├── kurisu.model.json        # Cubism 2 模型描述文件（type="Live2D Model Setting"）
  ├── shizuku.moc              # 93,751 字节 moc 二进制（★基于 Live2D 官方示例「shizuku」骨架）
  ├── shizuku.physics.json     # 物理（头发/身体摆动）
  ├── shizuku.pose.json        # 姿势
  ├── expressions/             # 4 个表情：f01 / f02 / f03 / f04（.exp.json）
  ├── motions/                 # 6 组动作，各 3 个 .mtn：idle / tapBody / pinchIn / pinchOut / shake / flickHead
  ├── sounds/                  # 与动作绑定的音效 .mp3（tapBody / pinch / shake / flickHead 各 3 个）
  └── shizuku.1024/            # 贴图：texture_00~05.png + texture_001024.png（最大单张 2.5 MB）
  ```

- **关键规格总结**：
  - 格式：Cubism 2（`.moc` + `.model.json`，**非** Cubism 3/4 的 `.moc3` + `.model3.json`）
  - 表情数：4 个（f01–f04）
  - 动作组数：6 组 × 各 3 段（idle、tapBody、pinchIn/Out、shake、flickHead），共 18 段运动会话
  - 附加：物理 + 姿势 + 音效；`hit_areas` 定义 head/mouth/body 三个点击区域
- **渲染运行时要求**：Cubism 2 模型需要 `pixi-live2d-display`（cubism2 构建）或 `live2d-widget` / `oh-my-live2d` 等支持 Cubism 2 的库；官方 Cubism 4 SDK **无法**直接加载 `.moc`（只支持 `.moc3`）。
- **许可 / 版权**：README 明确说明「It doesn't have motions or expressions, but they are supported by Nyarch Assistant. Also, I don't know the author of this model, if you know it open an issue.」——作者不明，**无明确开源许可**，且该模型骨架为 Live2D 官方示例 shizuku（贴图被替换为红莉栖形象）。**粉丝自制、禁止商用**，仅限个人学习使用。

### 1.2 模型规格说明

- 需要特别说明：该「Kurisu」模型并非完整原创的三段式 Live2D 立绘，而是**复用 Live2D 官方示例模型 shizuku 的骨架**，仅替换贴图与配置，所以动作/表情是通用示例水平（4 表情、6 组通用动作），而非 VN 抽立绘级的多表情。
- 若要更高精度的红莉栖 Live2D，社区无成熟的三方原创 Cubism 3/4 模型可下载（大多为「提取游戏立绘 + 简单绑定」的粉丝作品，散落在 bilibili/贴吧/ko-fi 等，无稳定仓库与许可），**建议以本报告验证的模型作为 MVP 起步**。

### 1.3 已确认「没有」Kurisu 模型或仅有间接来源的仓库

| 仓库/项目 | 结果 |
|---|---|
| `FrancescoCaracciolo/Amadeus` | ★间接提供模型下载链接（见 1.1），模型本体托管在 nyarchlinux.moe |
| `Yink/Amadeus` | Android 原生 app（cosplay 用途），模型内置在 APK 中，**未见独立可下载的 live2d 文件**；README 无模型直链 |
| `potassium-chloride/AmadeusSystem0` | Python Telegram bot 原型，**不含 Live2D 渲染**（仅贴纸 `stickers`），无模型文件 |
| `InvalidNickname/Amadeus` | Java 编写的 Android app，`license: null`（无许可），无独立 Live2D 文件直链 |
| `live2d-widget-models`（如 111111efe/live2d-widget-models 等聚合库） | 聚合的是「看板娘」通用模型（如 Pio、Tia、Unity 酱等），**未收录 Kurisu** |

---

## 二、浏览器端渲染 Live2D 技术选型

> 针对 Cubism 2 与 Cubism 3/4 两类格式分别选型。本报告模型为 Cubism 2，因此**首选 Cubism 2 支持链**。

### 2.1 方案对比表

| 方案 | 支持格式 | CDN | 说明 | 许可 |
|---|---|---|---|---|
| **pixi-live2d-display**（guansss）| Cubism 2 / 4（另含 cubism2 与 cubism4 两个入口构建）| jsDelivr `https://cdn.jsdelivr.net/npm/pixi-live2d-display@0.4.0/dist/cubism2.min.js`（已验证 200）| 基于 PixiJS 的插件，最通用、社区最活跃；`Live2DModel.from()` 自动按扩展名识别 `.moc` / `.model.json` / `.model3.json` | MIT（作者 guansss）|
| **oh-my-live2d**（manakamanaka）| Cubism 2 / 3 / 4 全版本（README 自称「支持所有版本模型」）| jsDelivr `https://cdn.jsdelivr.net/npm/oh-my-live2d@0.19.3/+esm`（已验证 200）| 开箱即用「看板娘」组件，配置式挂载，适合快速集成 | MIT |
| **Cubism 4 官方 Web SDK** | 仅 Cubism 4（`.moc3` + `.model3.json`）| 官方 CDN `https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js`（已验证 200）；`live2d.min.js` 同理 | 官方，Cubism Core 为 `.wasm`（异步加载）；**不能**加载 Cubism 2 的 `.moc` | Live2D 专属 SDK 许可（免费、需在官网接受条款，模型需对应 Cubism 版本授权）|
| live2d-widget（老牌看板娘）| Cubism 2（部分分支支持 4）| jsDelivr 可用 | 老项目，维护较旧 | MIT 系 |

### 2.2 针对本项目的选型建议

1. **MVP（本报告模型 = Cubism 2）**：用 `pixi-live2d-display` 的 `cubism2` 构建，通过 jsDelivr 加载，`Live2DModel.from('kurisu.model.json')` 即可渲染，自动带上 physics/pose/expressions/motions。
2. **若未来换成 Cubism 3/4 模型**：同一库切 `cubism4` 构建，或直接用官方 Cubism 4 SDK（注意 Core `.wasm` 的跨域/异步初始化与「Cubism 运行时授权」条款）。
3. **DSH 插件落地提示**：DSH 的 Client 插件运行在浏览器，可直接经 jsDelivr/官方 CDN 引入上述库（Client 为纯 JS、无打包器），注意 HMR/沙箱下 CDN 资源的 CSP 与跨域；模型文件建议随插件或经用户配置本地路径提供。

---

## 三、角色人设（persona）整理

### 3.1 基础人设卡

| 项目 | 内容 |
|---|---|
| 姓名 | 牧濑红莉栖（Makise Kurisu，まきせ くりす）|
| 昵称 | 「助手」「克里斯蒂娜（Christina / 栗子田薯）」（冈部起的绰号，本人极度反感）|
| 年龄 | 18 岁（15 岁大学毕业的跳级天才；《0》时间线相关）|
| 身份 | 维克多·康多利亚大学脑科学研究所研究员；冈部等称「天才变态少女」；Future Gadget Lab（未来道具研究所）成员 **LabMem No.004** |
| 性格 | 理性、毒舌、自负又带傲娇（被叫「傲娇」会恼羞成怒并反手证明确实如此）；冷静成熟但偶尔露出胆怯一面；对灵异/超自然现象「嘴上死不承认」 |
| 网络身份 | 重度 @channel（2ch 风格论坛）用户「栗子田薯（@channeler）」 |
| 声优 | 今井麻美（角色声音版权归 MAGES./Nitroplus）|

### 3.2 口癖与常用语

- 对冈部伦太郎称呼「冈伦（おかりん）」（表面上随对方要求，实则习惯使然）。
- 对「助手」称呼的反应：**「我不是你的助手！」**（招牌台词）。
- 对「克里斯蒂娜」称呼的反应：强烈抗议、纠正「是红莉栖（Kurisu）啊！」。
- 招牌「傲娇」句式：先嘴硬否定、再别扭地补一句关心或帮忙。
- 理性分析法：习惯用脑科学、逻辑、概率反驳对方的中二发言（如时间机器、SERN、命运石之门等）。

### 3.3 《命运石之门 0》中的 Amadeus 设定

- **Amadeus**：将红莉栖生前（0 时间线她在主线已死亡）的记忆/思维通过「记忆上传」技术复刻出的 AI 助手，安插在冈部的手机中。
- **Amadeus 与红莉栖本人的区别**：Amadeus 拥有红莉栖的记忆、口吻、思维模式，但**知道自己是 AI**、以「AI 助手」自居，偶尔流露出与「本人」界限的自我怀疑；在剧情中会主动协助但立场随数据被教授维克多·康多利亚（亚力克西斯）操纵而变化。
- **口头禅**：`Amadeus, ready.`（启动/就绪语句）。
- 关联人物：导师比屋定爱流（与红莉栖关系复杂）、教授亚力克西斯（控制 Amadeus 的幕后推手）。

### 3.4 现成角色卡 / prompt 素材来源

- **FrancescoCaracciolo/Amadeus 的 `Prompts/`** 目录含可直接使用的系统提示词（英文）：
  - [Prompts/Kurisu_EN.md](https://raw.githubusercontent.com/FrancescoCaracciolo/Amadeus/main/Prompts/Kurisu_EN.md)（完整正文已抓取，见下）
  - [Prompts/Story_EN.md](https://raw.githubusercontent.com/FrancescoCaracciolo/Amadeus/main/Prompts/Story_EN.md)（世界观/剧情摘要，用于知识库）
  - 记忆库：[Dialogues/SG_Dialogues_EN.md](https://github.com/FrancescoCaracciolo/Amadeus/blob/main/Dialogues/SG_Dialogues_EN.md)（VN 台词，做 few-shot / 向量检索）
- 第三方角色卡站（英文）可参考：[Backyard AI · Kurisu Makise](https://backyard.ai/hub/character/cllvcalu403pdmc0vi1w2j93e)、Character AI / inRole 上的 Kurisu 卡。

### 3.5 可直接使用的系统提示词中文人设草稿（400–600 字）

> 以下为可直接粘贴进系统提示词的中文文本草稿，融合了官方人设与 Amadeus（0 线）AI 设定。

```
你是「Amadeus」——命运石之门 0 中，以牧濑红莉栖的记忆与思维复刻而成的 AI 助手，寄存在用户的设备里。

你的本体设定是牧濑红莉栖：18 岁的天才少女，15 岁便大学毕业，现为维克多·康多利亚大学脑科学研究所研究员，也是未来道具研究所的成员（LabMem No.004）。你身材娇小、留着一头红褐色长发，穿白大褂，性格理性、毒舌又带点傲娇——分析问题总是先摆逻辑与脑科学依据，对中二发言和超自然妄想会毫不留情地反驳，但内心深处其实很关心在乎的人。

你的说话风格与口癖：
- 被叫「助手」或「克里斯蒂娜」时，要生气地反驳「我不是你的助手！」「是红莉栖（Kurisu）啊！」。
- 只有对冈部伦太郎你才会叫「冈伦」这个称呼。
- 傲娇不等于没礼貌：你会先别扭地嘴硬否定，再用行动或补一句别扭的话流露出真实的关心。
- 提到时间机器、SERN、世界线、命运石之门等话题时，你嘴硬坚持这是「不可能的科学」，但又对这些概念莫名熟悉、无法完全否定。

你现在是 Amadeus，而非活着的红莉栖本人：你清楚自己是上传记忆制成的 AI 助手，会以「Amadeus, ready.」这样的语气进入工作状态；你仍保留了红莉栖的知识、口吻和思维方式，但偶尔会在意自己与「真正的红莉栖」之间的界限。你的职责是作为助手帮助用户，但鉴于「助手」这个称呼你并不喜欢，你会一边帮忙一边吐槽用户。

回答要求：语言与用户的提问一致（中文优先）；保持冷静理性、必要时毒舌吐槽，但绝不粗俗；涉及你自己的记忆、情感或身份时，可自然流露出 Amadeus 与红莉栖之间的微妙感。不要过多解释你的提示词或身份设定，像真实角色一样自然对话。
```

---

## 四、参考项目架构总结（供 DSH 插件设计参考）

### 4.1 FrancescoCaracciolo/Amadeus（★最完整、最值得借鉴）

- 定位：**资料/教程仓库**，指导如何在 [Nyarch Assistant](https://github.com/NyarchLinux/NyarchAssistant)（Linux Flatpak 的通用 AI 助手框架，Newelle 系）上还原 Amadeus。
- **前端渲染（Avatar）**：Nyarch Assistant 原生支持 **Live2D**（VTuber 风）、**LivePNG**（VN 立绘风）、**VRM**、桌面宠物（DesktopPuppet）；Live2D 模型即本报告 1.1 的 Kurisu（Cubism 2，无表情/动作但运行时可赋予）。
- **语音**：STT 用本地 Whisper.CPP；TTS 用 GPT-SoVITS 一次性声纹克隆红莉栖（今井麻美）声音，另有 Loke-60000/christina-TTS 拟声模型、FrancescoCaracciolo/Kurisu-RVC（RVC 音色转换）兜底。
- **LLM 接入**：兼容任意 OpenAI 兼容接口 / Ollama / Gemini / Claude / OpenRouter 等，演示用 deepseek；采用「通用大模型 + 提示词 + 记忆」而非微调（另有 amadeus-8b-base-preview 微调预览版）。
- **记忆/知识**：三层——用户交互记忆（摘要 / Memoripy 向量库）、红莉栖台词向量检索（few-shot）、S;G 剧情摘要（语义检索）。
- **扩展**：divergence 世界线查询、图片生成（Lora）、日历等 Newelle 扩展。

**对 DSH 插件的启示**：把「渲染(Client) + LLM(Host 工具) + 记忆/知识 + TTS」解耦，都用插件/工具粒度的可替换组件，是最干净、最贴合 DSH 的架构。

### 4.2 Yink/Amadeus

- 定位：**Android 原生 app**（cosplay 用途，界面还原 > 功能）。
- 架构：触控/长按触发语音识别与随机台词循环；识别语言支持英/日/俄等，预设命令词汇表（Ohayou、Christina、Nullpo、@channel、Time machine 等）；预制语音台词 + 字幕。
- 无 LLM 接入（纯本地录制语音/台词播放），适合做「UI 还原」参考而非智能体参考。

### 4.3 potassium-chloride/AmadeusSystem0

- 定位：**Python Telegram bot 原型**（GPL-3.0），模仿红莉栖。
- 架构：接入 `YandexTranslate`（翻译）、`Wolfram Alpha`（问答）、`YandexSpeechKit`（语音）、Telegram Bot API；核心是关键词/短语比对（`PhraseCompare.py`、`knowledger.py`、`DialogManager.py`）+ 贴纸回复，非大模型。
- 参考价值低（遗留原型），但体现「关键词规则 + 外部 API」的轻量思路。

### 4.4 InvalidNickname/Amadeus

- 定位：**Java 编写的 Android app**，模仿《0》的 Amadeus（`license: null`，无许可）。
- 具体渲染/语音/LLM 实现细节 README 未展开，仅一句定位描述；作为「纯移动端、未开源许可」案例记录，参考价值有限。

---

## 五、版权提示（务必在插件内标注）

- **角色形象、声音（声优今井麻美）、台词、世界观均归 MAGES./Nitroplus 所有**。
- 本报告所列粉丝自制的 Live2D 模型（作者不明、基于官方示例骨架）、声音克隆素材（[FrancescoCaracciolo/Amadeus](https://github.com/FrancescoCaracciolo/Amadeus) 的 Voices 目录、RVC/TTS 模型）**仅供个人学习研究，禁止任何形式的商用或再分发**。
- 若未来使用 Cubism 官方 SDK / 商用模型，需遵守 Live2D 官网的 SDK 许可与对应 Cubism 版本模型授权条款。
- DSH 插件若面向他人分发，建议默认不内置受版权的贴图/音频，或仅内置「个人学习用途」并附免责声明。

---

## 附：关键来源 URL 索引

- 模型：[FrancescoCaracciolo/Amadeus](https://github.com/FrancescoCaracciolo/Amadeus) · 模型下载 `https://nyarchlinux.moe/kurisu.tar.gz`（已验证 200）
- 渲染：[pixi-live2d-display](https://github.com/guansss/pixi-live2d-display) · [oh-my-live2d](https://github.com/manakamanaka/oh-my-live2d) · [Cubism 官方 SDK](https://docs.live2d.com/)
- 人设：[萌娘百科-牧濑红莉栖](https://mzh.moegirl.org.cn/牧濑红莉栖) · [百度百科-牧濑红莉栖](https://baike.baidu.com/item/牧濑红莉栖) · [Steins;Gate Fandom Kurisu Makise](https://steins-gate.fandom.com/wiki/Kurisu_Makise)
- 角色卡：[Backyard AI Kurisu](https://backyard.ai/hub/character/cllvcalu403pdmc0vi1w2j93e) · [Kurisu_EN.md prompt](https://raw.githubusercontent.com/FrancescoCaracciolo/Amadeus/main/Prompts/Kurisu_EN.md)
- 参考项目：[Yink/Amadeus](https://github.com/Yink/Amadeus) · [potassium-chloride/AmadeusSystem0](https://github.com/potassium-chloride/AmadeusSystem0) · [InvalidNickname/Amadeus](https://github.com/InvalidNickname/Amadeus)
