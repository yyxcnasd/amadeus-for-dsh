# Amadeus for DSH — v2 重构说明

## 背景

原实现存在以下问题：
- 语音输入只依赖 `SpeechRecognition`，iframe 未授权麦克风，很多环境不可用。
- Live2D 摆位使用双重偏移，模型容易错位。
- TTS 失败会静默切到其它音色 / 浏览器语音，声线不统一。
- 口型在音频未播放时就开始，且 `ttsmeta` 会重复合成导致时间戳与实际音频不一致。
- 头部/身体动作依赖零散定时器，待机时几乎没有自然动作。

## 重构后架构

```
浏览器 iframe (panel.js)
├─ SpeechRecognition → 浏览器语音输入
├─ MediaRecorder → POST /amadeus/stt → tools/stt.py → Whisper 兼容 API
├─ GET /amadeus/tts → 音频 + X-Amadeus-Words 词时间戳
├─ Live2D 常驻 rAF 动画循环
│   ├─ 呼吸 / 眨眼 / 眼球 / 头部 / 身体
│   └─ 说话时叠加词包络 + 能量驱动的嘴型与情绪手势
└─ 轮询 /amadeus/poll 获取语音队列

Host (host.js)
├─ 声线稳定策略：voiceStability=true 时失败不切音色、不切浏览器语音
├─ TTS 通道：edge / voicevox / aqua / quest / openai / auto
├─ STT 通道：/amadeus/stt
├─ 语音队列 / AI 聊天 / 主动来电 / 记忆 / 事件播报
└─ 静态 RPC 桥（/amadeus/rpc）
```

## 关键改动

- `plugin/src/host.js`
  - 新增 `readBody`、`transcribeAudio`、`/amadeus/stt`
  - `/amadeus/tts` 响应头携带 `X-Amadeus-Words`
  - 新增 `voiceStability`，默认 `true`
  - 扩展情绪列表；移除失效的 Kokoro/Qwen 分支
- `plugin/src/client.js`
  - iframe 增加 `allow="microphone; camera; autoplay"`
  - 设置页新增语音输入与声线稳定配置
- `plugin/web/panel.js`
  - 重写为 v10：语音输入降级、Live2D 常驻动画、精确口型、自然动作
- `plugin/web/emotion.js`
  - 扩展表情/动作映射
- `tools/stt.py`
  - 新增 Whisper 兼容 STT 调用器（纯标准库，支持 BOM 容错）
- `tools/tts_emote.py`
  - 新增扩展情绪别名，保持同一音色
- `config/amadeus.json`
  - 默认 `provider=edge`、`voiceStability=true`、`fallbackToQuest=false`
- `config/manifest.json`
  - 增加 Live2D `layout` 可调摆位

## 验证

- `node tools/build_static.mjs` ✅
- `node tools/build_client.mjs` ✅
- `node --check package/*.mjs package/client.js` ✅
- `python -m py_compile tools/tts_emote.py tools/stt.py` ✅
- `tools/stt.py` 已用本地 mock Whisper 服务验证（返回 `ok:true`）

---

## v2.1 第二轮反馈修复

- **松鼠音/换人感**
  - `tools/tts_emote.py` 调低所有情绪 prosody 的极端 pitch，避免变成“松鼠音”。
  - `emotionIntensity` 默认从 `1.2` 降为 `1.0`。
  - 保持 `voiceStability=true`，失败不切音色、不切浏览器语音。
- **短回复 / 多条消息**
  - `CHAT_FORMAT_RULES` 改为允许 1~3 句，短回复不必凑字数；每句仍带情绪标签，可形成多条独立 TTS 消息。
- **L2D 仍错位**
  - 新增内置校准：右上角（左上角）`⚙` 按钮进入校准模式，可拖动位置、滚轮缩放、双击复位，保存到 `localStorage`。
  - 加载时自动读取上次校准结果。
- **句间 TTS 间隔**
  - 预取从 1 条改为提前 2 条。
  - 轮询从 300ms 降到 200ms。
- **点击模型反馈**
  - 点击头部/身体会随机说“ん？なに？”、“ちょっと！”等活泼短句，不再反复说“准备完成”。
- **加载动画**
  - 开机 logo 动画必须完整跑完一圈且至少 3 秒后才隐藏，避免“没播完就进去”。
- **L2D 动作增强**
  - 增加头发（前/侧/后）摆动、眉毛微动、手臂/肩膀待机动作。
  - 嘴型幅度上调，`PARAM_MOUTH_FORM` 联动增强。
- **情绪饱满度**
  - 提示词要求文间切换情绪标签、自然加入感嘆詞，避免呆板。

---

## v2.2 第三轮反馈修复

- **短回复仍未生效**
  - `CHAT_FORMAT_RULES` 改为“通常 1~2 句，用户明确要求详细才 3 句；短回复必 1 句”。
  - `amadeusChat` 的 `maxTokens` 从 `1200` 降到 `600`，从生成侧限制长篇大论。
- **TTS 预取**
  - 预取从 2 条增加到 4 条，进一步减少句间等待。
- **L2D 表现增强**
  - 新增 `applyEmotionFace()`：说话时按情绪实时驱动脸红（`ParamCheek`）、眉毛、眼睛微笑、嘴型、瞳孔位置/大小（`ParamPupilX/Y/Size`、`ParamEyeScale`）、泪光（`ParamTear`）。
  - 点击模型时也会临时应用对应情绪脸，不再只有动作没有表情。
  - 停止说话时统一复位情绪脸参数。
  - 眨眼仍由常驻动画循环驱动，与情绪脸叠加。

---

## v2.3 第四轮反馈修复（L2D 可见性）

- 从 `kurisu.moc` 提取实际参数名，确认本地 Cubism2 模型支持：
  - `PARAM_ANGLE_X/Y/Z`、`PARAM_BODY_ANGLE_X/Y/Z`
  - `PARAM_EYE_L_OPEN/R_OPEN`、`PARAM_EYE_L_SMILE/R_SMILE`、`PARAM_EYE_BALL_X/Y`
  - `PARAM_BROW_L/R_Y/ANGLE/FORM/X`
  - `PARAM_CHEEK`、`PARAM_MOUTH_OPEN_Y`、`PARAM_MOUTH_FORM`
  - `PARAM_HAIR_FRONT/SIDE/BACK`、`PARAM_BREATH`
- 修复“加了但看不到”的问题：
  - 眼睛微笑原来错误写成不存在的 `PARAM_EYE_SMILE`，现在拆成 `PARAM_EYE_L_SMILE` / `PARAM_EYE_R_SMILE`。
  - 眉毛现在同时驱动 `PARAM_BROW_L/R_Y/ANGLE/FORM`，不再只驱动一个参数。
  - 说话时不再让情绪脸的 `ParamMouthForm` 覆盖嘴型开合，嘴可以张到更大。
- 幅度大幅上调：
  - 说话头部摆动、身体摆动、头发摆动、待机动作全部加大。
  - 嘴型目标从 `1.15` 倍提高到 `1.8` 倍，`PARAM_MOUTH_FORM` 联动到 `1.3` 倍。
- 未出现在模型中的参数（瞳孔大小、泪光、嘴缩放等）保留为兼容性设置，不会报错，但本地模型没有对应骨骼时自然看不到。

---

## v2.4 第五轮反馈修复（更明显 + 句间提速 + 短回复）

- **L2D 幅度再次大幅上调**
  - 嘴型目标从 `1.8` 倍提高到 `2.2` 倍，`PARAM_MOUTH_FORM` 联动到 `1.6` 倍。
  - 说话头部摆动提高到 `1.5`，身体摆动提高到 `1.2 + 1.2e`。
  - 待机头部/身体/头发摆动继续加大，确保肉眼可辨。
- **句间 TTS 间隔**
  - 关键修复：AI 流式输出时不再把短句攒到 `80` 字或 `3` 句才推送，而是“每完成一句立刻推送 TTS”。
  - 这样短回复和多条消息都能马上出声，句间不再被批处理延迟。
  - 轮询从 `200ms` 降到 `150ms`，预取保持提前 4 条。
- **短回复**
  - 继续强化提示词：通常 1~2 句，短回复必 1 句，禁止凑字数。
  - `maxTokens` 保持 `600`，从生成侧限制长篇。
