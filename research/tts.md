# 调研：Amadeus 实时语音合成（TTS）方案

> 结论先行：**默认 Edge TTS（免费、无需 key、可逐词流式）**；追求红莉栖还原再考虑粉丝克隆音色（仅个人学习）。

## 一、通用日文 TTS 对比

| 方案 | 音色 | 成本 | 延迟 | 备注 |
| --- | --- | --- | --- | --- |
| **Edge TTS**（推荐）| `ja-JP-*`（Nanami/Keita/...7 个）| 免费无 key | 200ms~1s（在线）| `pip install edge-tts`；支持 SSML prosody 与 word boundary 时间戳（口型同步用）；公共 token 仍有效（已实测）；风险：非官方接口，协议可能变 |
| **VOICEVOX**（本地）| 原创角色（20+）| 免费 | 1~3s/句 | `POST /audio_query` → `/synthesis` 得 WAV；离线、日文自然；需常驻本地服务（Docker 或引擎版）|
| Google Cloud TTS | ja-JP-Neural2 | 有免费额度（400 万字符/月）| 在线 | 需账号+key，管理繁琐 |

浏览器 SpeechSynthesis 仅作离线兜底（质量最低、无角色还原）。来源：[edge-tts constants.py](https://raw.githubusercontent.com/rany2/edge-tts/master/src/edge_tts/constants.py)、[go-edge-tts](https://github.com/fairkid-ai/go-edge-tts)、[VOICEVOX](https://github.com/VOICEVOX/voicevox_engine)。

## 二、红莉栖专属音色（粉丝自制，⚠️ 仅供个人学习）

1. **`Loke-60000/christina-TTS`**（⭐ 最省事）— Qwen3-TTS 微调，`christina-jp` 说话人直接输出日文；`pip install qwen-tts`，≈2GB 显存。免费需署名，**非官方声优**。[模型卡](https://huggingface.co/Loke-60000/christina-TTS)
2. **`FrancescoCaracciolo/Kurisu-RVC`** — RVC 音色转换（非 TTS）：任意 TTS 出声 → 转红莉栖音色。gpl-3.0，需 GPU。[模型卡](https://huggingface.co/FrancescoCaracciolo/Kurisu-RVC)
3. **GPT-SoVITS 自训/one-shot** — 用 VN 台词数据集（[makise-kurisu-vn-voicelines](https://huggingface.co/datasets/zhonglongbao/makise-kurisu-vn-voicelines)）10s 音频克隆；≈6GB 显存。[GPT-SoVITS](https://github.com/RVC-Boss/GPT-SoVITS)

## 三、参考项目的 TTS 路线

- **FrancescoCaracciolo/Amadeus**（最完整）：通用 TTS（Kokoro/Edge）+ GPT-SoVITS one-shot 克隆 + christina-TTS 微调 + Kurisu-RVC 转换四路组合。
- **Yink/Amadeus**：预制官方台词回放，非实时合成。
- **AmadeusSystem0**：Yandex SpeechKit，参考价值低。

## 四、本插件落地

- **默认**：Edge TTS（`ja-JP-NanamiNeural`），免费开箱即用，`wordBoundary` 时间戳支撑词级口型。
- **本地**：VOICEVOX（原创音色）或本地 Aqua-TTS。
- **还原向（候选，未内置）**：christina-TTS `christina-jp` → Kurisu-RVC 转音。

> ⚠️ 所有"红莉栖音色"均为粉丝复刻，版权归原版权方与声优今井麻美，严禁商用/公开传播；产物需标注「同人复刻，个人学习使用」。