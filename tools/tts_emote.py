"""Amadeus 情感 TTS 合成器（edge-tts + SSML 风格注入 + 词级时间戳）。

用法: python tts_emote.py <text> <voice> <emotion> <out.mp3> [base_rate] [base_pitch] [intensity]
emotion: happy | excited | elated | sad | angry | furious | question | soft | neutral
base_rate/base_pitch: 用户配置的全局语速/音调（如 '+0%'、'+10Hz'），默认 '+0%'、'+0Hz'。
intensity: 可选 0.2~2.0，默认 1.0，用于按文本情感强度缩放 emotion 的 prosody 增量。
输出: <out.mp3> 与 <out.mp3>.words.json（词边界，单位毫秒，用于精准口型）
"""
import asyncio
import json
import re
import sys

import edge_tts
import edge_tts.communicate as ec

# 已知支持 <mstts:express-as> 的日文音色（Azure 官方语言支持表）。
# 目前只有 ja-JP-NanamiNeural 有 style；其它日文音色走纯 prosody，避免无效 style 导致音色漂移。
STYLE_SUPPORT = {
    'ja-JP-NanamiNeural': {'cheerful', 'chat', 'customerservice'},
}

# 情感 → (express-as style, rate, pitch, volume)
# style 仅用于支持该 style 的 voice；不支持的 voice 会自动降级为纯 prosody。
PROFILES = {
    # 日文 Nanami 支持 cheerful/chat/customerservice：正面情绪用 cheerful，中性/疑问用 chat，
    # soft 用 customerservice（更柔和、更礼貌）。
    # 注意：语速绝对不能变，只允许通过 pitch/volume/style 改变语气语调。
    # 2026 调参：降低极端 pitch，避免“松鼠音/换人感”，同时保留情绪起伏。
    'happy':    ('cheerful',      '+0%',  '+8Hz',  '+6%'),
    'excited':  ('cheerful',      '+0%',  '+18Hz', '+12%'),
    'elated':   ('cheerful',      '+0%',  '+24Hz', '+16%'),
    'sad':      (None,            '+0%',  '-14Hz', '-10%'),
    'angry':    (None,            '+0%',  '-4Hz',  '+16%'),
    'furious':  (None,            '+0%',  '+2Hz',  '+22%'),
    'question': ('chat',          '+0%',  '+14Hz', '+4%'),
    'soft':     ('customerservice', '+0%', '-6Hz', '-12%'),
    'neutral':  ('chat',          '+0%',  '+0Hz',  '+0%'),
    # 扩展情绪别名：保持同一音色，仅微调语气
    'blush':        ('customerservice', '+0%', '-4Hz',  '-8%'),
    'annoyed':      ('cheerful',      '+0%',  '-2Hz',  '+14%'),
    'thinking':     ('chat',          '+0%',  '+8Hz',  '-4%'),
    'surprised':    ('cheerful',      '+0%',  '+22Hz', '+14%'),
    'disappointed': (None,            '+0%',  '-12Hz', '-12%'),
    'eyes_closed':  (None,            '+0%',  '-8Hz',  '-8%'),
    'indifferent':  (None,            '+0%',  '-2Hz',  '-4%'),
    'side':         ('chat',          '+0%',  '+5Hz',  '-2%'),
    'winking':      ('cheerful',      '+0%',  '+12Hz', '+8%'),
}

_style = None
_orig_mkssml = ec.mkssml


def mkssml_patched(tc, escaped_text):
    """在库生成的 SSML 中注入 <mstts:express-as> 风格标签。"""
    ssml = _orig_mkssml(tc, escaped_text)
    global _style
    if _style:
        ssml = ssml.replace(
            "<speak version='1.0'",
            "<speak version='1.0' xmlns:mstts=\"http://www.w3.org/2001/mstts\"",
            1,
        )
        ssml = ssml.replace(
            f"<voice name='{tc.voice}'>",
            f"<voice name='{tc.voice}'><mstts:express-as style='{_style}'>",
            1,
        )
        ssml = ssml.replace('</voice>', '</mstts:express-as></voice>', 1)
    return ssml


ec.mkssml = mkssml_patched


def _scale_prosody(value: str, intensity: float) -> str:
    """把 '+8%' / '-12Hz' 这类 prosody 按 intensity 缩放。"""
    m = re.match(r'^([+-]?\d+(?:\.\d+)?)(%|Hz)$', value)
    if not m:
        return value
    num = float(m.group(1)) * max(0.2, min(2.0, intensity))
    unit = m.group(2)
    if unit == '%':
        return f'{num:+.0f}%'
    return f'{num:+.0f}Hz'


def _add_prosody(base: str, delta: str) -> str:
    """把两个 '+8%' / '-12Hz' 字符串相加，得到最终 prosody。"""
    m1 = re.match(r'^([+-]?\d+(?:\.\d+)?)(%|Hz)$', base)
    m2 = re.match(r'^([+-]?\d+(?:\.\d+)?)(%|Hz)$', delta)
    if not m1 or not m2 or m1.group(2) != m2.group(2):
        return delta
    num = float(m1.group(1)) + float(m2.group(1))
    unit = m1.group(2)
    if unit == '%':
        return f'{num:+.0f}%'
    return f'{num:+.0f}Hz'


async def synth(text: str, voice: str, emotion: str, out: str,
                base_rate: str = '+0%', base_pitch: str = '+0Hz', intensity: float = 1.0) -> None:
    global _style
    style, emo_rate, emo_pitch, vol = PROFILES.get(emotion, PROFILES['neutral'])
    # 非支持音色强制去掉 express-as，避免无效 style 被服务端静默忽略/改变音色。
    supported = STYLE_SUPPORT.get(voice, set())
    if style not in supported:
        style = None

    # 根据情绪强度缩放 emotion 增量，再叠加用户全局语速/音调。
    emo_rate = _scale_prosody(emo_rate, intensity)
    emo_pitch = _scale_prosody(emo_pitch, intensity)
    rate = _add_prosody(base_rate, emo_rate)
    pitch = _add_prosody(base_pitch, emo_pitch)

    words = []
    last_err = None
    for attempt in (style, None):
        _style = attempt
        words = []
        try:
            communicate = edge_tts.Communicate(
                text, voice,
                rate=rate, pitch=pitch, volume=vol,
                boundary='WordBoundary',
            )
            with open(out, 'wb') as f:
                async for chunk in communicate.stream():
                    ctype = chunk.get('type')
                    if ctype == 'audio':
                        f.write(chunk['data'])
                    elif ctype == 'WordBoundary':
                        # offset/duration 单位 100ns → 毫秒
                        words.append({
                            'o': int(chunk['offset'] / 10000),
                            'd': int(chunk['duration'] / 10000),
                        })
            break
        except Exception as e:  # express-as 不支持时退回纯 prosody
            last_err = e
            _style = None
    else:
        raise last_err if last_err else RuntimeError('tts failed')
    _style = None
    with open(out + '.words.json', 'w', encoding='utf-8') as wf:
        json.dump({'words': words}, wf)


if __name__ == '__main__':
    if len(sys.argv) < 5:
        print('usage: tts_emote.py <text> <voice> <emotion> <out> [base_rate] [base_pitch] [intensity]', file=sys.stderr)
        sys.exit(2)
    text, voice, emotion, out = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
    base_rate = sys.argv[5] if len(sys.argv) >= 6 else '+0%'
    base_pitch = sys.argv[6] if len(sys.argv) >= 7 else '+0Hz'
    intensity = 1.0
    if len(sys.argv) >= 8:
        try:
            intensity = float(sys.argv[7])
        except ValueError:
            intensity = 1.0
    asyncio.run(synth(text, voice, emotion, out, base_rate, base_pitch, intensity))
