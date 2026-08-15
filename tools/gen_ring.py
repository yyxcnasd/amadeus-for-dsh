"""生成复古翻盖手机来电铃声（原创合成，无版权问题）。

输出: assets/audio/ring.wav（8 秒，日式响铃节奏 1s 响 / 2s 停）
若要替换为真实铃声素材，直接覆盖 assets/audio/ring.mp3 或 ring.wav 即可。
"""
import math
import struct
import sys
import wave

OUT = sys.argv[1] if len(sys.argv) > 1 else 'assets/audio/ring.wav'

RATE = 22050
DURATION = 8.0
total = int(RATE * DURATION)

# 双音铃（类似老式电话电子铃：基频 + 谐波 + 轻微颤音）
F1, F2 = 880.0, 1108.0
frames = bytearray()
for i in range(total):
    t = i / RATE
    seg = t % 3.0          # 1s 响 / 2s 停
    if seg > 1.0:
        frames += struct.pack('<h', 0)
        continue
    attack = min(1.0, seg / 0.02)
    decay = min(1.0, (1.0 - seg) / 0.08)
    env = attack * decay
    vibrato = 1.0 + 0.004 * math.sin(2 * math.pi * 6.0 * t)
    s = (
        math.sin(2 * math.pi * F1 * vibrato * t)
        + 0.6 * math.sin(2 * math.pi * F2 * vibrato * t)
        + 0.25 * math.sin(2 * math.pi * (F1 * 2.01) * t)
    )
    v = int(28000 * env * s / 1.85)
    frames += struct.pack('<h', max(-32768, min(32767, v)))

with wave.open(OUT, 'wb') as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(RATE)
    w.writeframes(bytes(frames))
print('written', OUT, len(frames), 'bytes')
