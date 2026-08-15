"""Amadeus 常驻 Edge-TTS 合成 worker（降低逐句合成的延迟）。

每次逐句 `python tts_emote.py ...` 都要重新启动 Python 并导入 edge-tts（约 0.5~1s）。
本 worker 常驻一个进程，把 edge-tts 导入好、事件循环活起来，后续每句只需一次 WS 合成。

协议（HTTP POST /synth，json）：
    请求: { text, voice, emotion, rate, pitch, intensity, out }
    响应 200: { ok: true, out: <abs.mp3>, words: [{o,d},...] }
    错误 500: { ok: false, error }

用法: python tts_server.py --root <tmp_dir>
启动后向 stdout 打印 "READY:PORT"（用于握手）。
"""
import argparse
import asyncio
import json
import os
import sys
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

# 让 tts_emote 的 SSML 情感 patch 生效：import 即完成 monkeypatch。
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tts_emote  # noqa: E402

DEFAULT_VOICE = 'ja-JP-NanamiNeural'
MAX_WORDS_BYTES = 262144


class _Handler(BaseHTTPRequestHandler):
    root = None  # 由 main() 注入

    def do_POST(self):
        try:
            n = int(self.headers.get('Content-Length') or 0)
            req = json.loads(self.rfile.read(n).decode('utf-8') or '{}')
            text = req.get('text', '')
            if not text:
                raise ValueError('empty text')
            out = req.get('out') or os.path.join(
                self.root, 'w-' + uuid.uuid4().hex[:12] + '.mp3')
            asyncio.run(tts_emote.synth(
                text,
                req.get('voice') or DEFAULT_VOICE,
                req.get('emotion') or 'neutral',
                out,
                req.get('rate') or '+0%',
                req.get('pitch') or '+0Hz',
                float(req.get('intensity') or 1.0),
            ))
            words = []
            words_path = out + '.words.json'
            if os.path.exists(words_path):
                try:
                    with open(words_path, encoding='utf-8') as f:
                        w = json.load(f)
                    words = w.get('words', []) if isinstance(w, dict) else []
                finally:
                    os.unlink(words_path)
            self._json(200, {'ok': True, 'out': out, 'words': words})
        except Exception as e:  # noqa: BLE001
            self._json(500, {'ok': False, 'error': str(e)})

    def _json(self, code, body):
        data = json.dumps(body, ensure_ascii=False).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, *args):  # 静默
        pass


def main():
    ap = argparse.ArgumentParser(add_help=False)
    ap.add_argument('--root', default=os.path.expanduser('~/.dsh/amadeus/tmp'))
    ap.add_argument('--port', type=int, default=0)
    args = ap.parse_args()
    os.makedirs(args.root, exist_ok=True)
    server = ThreadingHTTPServer(('127.0.0.1', args.port), _Handler)
    _Handler.root = args.root
    port = server.server_address[1]
    print('READY:%d' % port, flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == '__main__':
    main()