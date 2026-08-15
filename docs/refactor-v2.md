# Amadeus for DSH — v2 重构说明

## 背景（原实现问题）

- 语音输入只靠 SpeechRecognition，iframe 未授权麦克风，很多环境不可用。
- Live2D 摆位双重偏移易错位；口型在音频未播放时就动，且 `ttsmeta` 重复合成导致时间戳失真。
- TTS 失败会静默切音色/切浏览器语音，声线不统一；待机时几乎没有自然动作。

## 重构后架构

```
iframe (panel.js)：SpeechRecognition → MediaRecorder+STT → /amadeus/tts（X-Amadeus-Words）
                  → Live2D 常驻 rAF 动画（呼吸/眨眼/眼/头/身体 + 说话时嘴型与情绪手势）→ 轮询 /amadeus/poll
Host (host.js)：声线稳定策略 + TTS 通道（edge/voicevox/aqua/quest/openai/auto）
               + STT + 语音队列 / AI 聊天 / 主动来电 / 记忆 / 事件播报 + 静态 RPC 桥
```

## 关键改动

- `src/host.js`：新增 `/amadeus/stt`；`/amadeus/tts` 响应头带 `X-Amadeus-Words`；新增 `voiceStability`（默认 true）；扩展情绪列表；移除失效的 Kokoro/Qwen 分支。
- `src/client.js`：iframe 加 `allow="microphone; camera; autoplay"`；设置页新增语音输入与声线稳定配置。
- `web/panel.js`：v10 重写 —— 语音输入降级、Live2D 常驻动画、精确口型、自然动作。
- `web/emotion.js`、`tools/stt.py`（新增）、`tools/tts_emote.py`（情绪别名）、`config/*`（默认 `provider=edge`、`voiceStability=true`）。

## 迭代记录（v2.1 → v2.4 反馈修复）

| 轮次 | 要点 |
| --- | --- |
| v2.1 | 调低情绪 prosody 极端 pitch（去"松鼠音"）；`emotionIntensity` 1.2→1.0；短回复 1~3 句；L2D 校准模式（拖拽/缩放/复位，localStorage）；预取 2 条、轮询 300→200ms；点击模型随机活泼短句；开机动画跑满 3s；头发/眉毛/手臂动作增强 |
| v2.2 | 短回复必 1~2 句、`maxTokens` 1200→600；预取 4 条；`applyEmotionFace()` 按情绪驱动脸红/眉/眼/嘴/瞳孔/泪光，停止时复位 |
| v2.3 | 按 `kurisu.moc` 实际参数名修正：眼睛微笑拆 `PARAM_EYE_L/R_SMILE`、眉毛多参数联动、情绪脸不再覆盖嘴型；幅度上调（嘴型目标 1.8×） |
| v2.4 | 嘴型 2.2×、头/身摆幅加大；**关键**：流式输出每完成一句立刻推送 TTS（不再攒批），轮询 200→150ms；短回复继续收紧 |

## 验证

`build_static.mjs` / `build_client.mjs` / `node --check` / `py_compile` 全过；STT 已用本地 mock Whisper 服务验证。