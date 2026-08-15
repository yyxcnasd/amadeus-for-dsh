# 调研：牧濑红莉栖 Live2D 模型、渲染运行时与人设

> 版权：角色形象/声音/台词归 MAGES./Nitroplus；下述粉丝自制素材仅供个人学习，禁止商用。

## 一、Live2D 模型（已实测可下载）

- **来源**：`FrancescoCaracciolo/Amadeus`（Nyarch Linux）托管，下载：
  - `https://nyarchlinux.moe/Kurisu.zip`（≈8.7MB，已验证 HTTP 200）
  - `https://nyarchlinux.moe/kurisu.tar.gz`（≈8.6MB）
- **格式**：Cubism 2（`.moc` + `.model.json`，非 Cubism 3/4）。骨架基于官方示例 shizuku，仅替换贴图与配置。
- **规格**：4 表情、6 组动作 ×3、物理+姿势+音效、`hit_areas`（head/mouth/body）。**作者不明、无开源许可，禁商用。**
- **其它仓库均无可直接下载的 Kurisu 模型**：Yink/Amadeus（模型内置于 APK）、AmadeusSystem0（纯 Telegram bot）、live2d-widget 聚合库（无 Kurisu）。

## 二、渲染运行时选型

| 方案 | 支持 | 说明 |
| --- | --- | --- |
| **pixi-live2d-display**（guansss，MIT）| Cubism 2/4 | **首选**。jsDelivr `.../pixi-live2d-display@0.4.0/dist/cubism2.min.js`，`Live2DModel.from()` 自动识别格式 |
| oh-my-live2d（MIT）| 2/3/4 | 开箱即用看板娘组件 |
| Cubism 4 官方 SDK | 仅 4（.moc3）| Core 为 wasm；**不能**加载 Cubism 2 `.moc` |

结论：MVP 用 pixi-live2d-display（cubism2 构建）；未来换 Cubism 4 模型切同库 cubism4 构建。

## 三、人设速记

- **牧濑红莉栖**（Makise Kurisu）：18 岁跳级天才，脑科学研究所研究员，LabMem No.004；理性、毒舌、傲娇。
- 绰号「助手」「克里斯蒂娜」均会抗议（招牌台词「我不是你的助手！」）；对冈部用「冈伦（おかりん）」。
- **Amadeus（0 线）**：由红莉栖记忆上传而成的 AI 助手，住手机里，知道自己不是本人；就绪语 `Amadeus, ready.`。
- 现成人设卡：`FrancescoCaracciolo/Amadeus` 的 `Prompts/Kurisu_EN.md`（英文完整版）；本项目中文版见 `persona/prompt.txt`。

## 四、参考项目（一句话）

- **FrancescoCaracciolo/Amadeus**（★最完整）：Nyarch Assistant 上还原 Amadeus —— Live2D + Whisper STT + GPT-SoVITS/christina-TTS + RVC 音色 + 通用 LLM + 三层记忆。
- **Yink/Amadeus**：Android 原生 App，界面还原 > 功能，无 LLM，纯预制台词回放。
- **potassium-chloride/AmadeusSystem0**：Python Telegram bot 原型，关键词规则 + Yandex API，参考价值低。
- **InvalidNickname/Amadeus**：Java Android App，无许可、细节未展开。

启示：把渲染(Client) / LLM+记忆 / TTS 解耦成可替换组件，最贴合 DSH 插件架构。

## 五、来源

- 模型：[FrancescoCaracciolo/Amadeus](https://github.com/FrancescoCaracciolo/Amadeus) · [模型下载](https://nyarchlinux.moe/kurisu.tar.gz)
- 渲染：[pixi-live2d-display](https://github.com/guansss/pixi-live2d-display) · [oh-my-live2d](https://github.com/manakamanaka/oh-my-live2d) · [Cubism SDK](https://docs.live2d.com/)
- 人设：[萌娘百科-牧濑红莉栖](https://mzh.moegirl.org.cn/牧濑红莉栖) · [S;G Fandom](https://steins-gate.fandom.com/wiki/Kurisu_Makise)