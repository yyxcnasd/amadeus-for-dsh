"""Amadeus 语音识别（STT）调用器（OpenAI Whisper 兼容，纯标准库）。

用法: python stt.py <audio.b64> <result.json> <baseUrl> <apiKey> <model> [lang]
- audio.b64: 存放音频二进制 base64 的文本文件
- result.json: 输出 {"ok": true, "text": "..."} 或 {"ok": false, "error": "..."}
"""
import base64
import json
import mimetypes
import sys
import uuid
import urllib.error
import urllib.request


def build_candidates(base_url):
    base = (base_url or "").strip().rstrip("/")
    if not base:
        return []
    if base.endswith("/audio/transcriptions"):
        return [base]
    candidates = [base + "/audio/transcriptions"]
    if not base.endswith("/v1"):
        candidates.append(base + "/v1/audio/transcriptions")
    return candidates


def multipart_body(fields, boundary):
    """构造 multipart/form-data 请求体。

    fields: list of (name, value_or_bytes, filename, content_type)
    """
    lines = []
    for name, value, filename, content_type in fields:
        lines.append(f"--{boundary}".encode("utf-8"))
        if filename:
            lines.append(
                f'Content-Disposition: form-data; name="{name}"; filename="{filename}"'.encode("utf-8")
            )
            lines.append(f"Content-Type: {content_type}".encode("utf-8"))
        else:
            lines.append(f'Content-Disposition: form-data; name="{name}"'.encode("utf-8"))
        lines.append(b"")
        if isinstance(value, bytes):
            lines.append(value)
        else:
            lines.append(str(value).encode("utf-8"))
        lines.append(b"")
    lines.append(f"--{boundary}--".encode("utf-8"))
    lines.append(b"")
    return b"\r\n".join(lines)


def call_once(url, api_key, model, audio_bytes, lang):
    boundary = "----AmadeusSTT" + uuid.uuid4().hex
    fields = [
        ("model", model, None, None),
        ("response_format", "json", None, None),
        (
            "file",
            audio_bytes,
            "amadeus-mic.webm",
            "audio/webm",
        ),
    ]
    if lang:
        fields.append(("language", lang, None, None))
    body = multipart_body(fields, boundary)
    headers = {
        "Authorization": "Bearer " + api_key,
        "Content-Type": f"multipart/form-data; boundary={boundary}",
        "User-Agent": "Amadeus-DSH/1.0",
    }
    req = urllib.request.Request(url, data=body, headers=headers)
    with urllib.request.urlopen(req, timeout=60) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    if isinstance(data, dict):
        text = data.get("text") or data.get("result") or ""
        if text:
            return text
    raise RuntimeError("unexpected STT response: " + json.dumps(data, ensure_ascii=False)[:300])


def main():
    if len(sys.argv) < 6:
        print("usage: stt.py <audio.b64> <result.json> <baseUrl> <apiKey> <model> [lang]", file=sys.stderr)
        sys.exit(2)
    b64file, outfile, base_url, api_key, model = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5]
    lang = sys.argv[6] if len(sys.argv) >= 7 else ""
    try:
        with open(b64file, "r", encoding="utf-8-sig") as f:
            audio_bytes = base64.b64decode(f.read().strip())
        if len(audio_bytes) < 100:
            raise RuntimeError("audio too small")
        candidates = build_candidates(base_url)
        if not candidates:
            raise RuntimeError("missing STT base URL")
        last_err = None
        text = None
        for url in candidates:
            try:
                text = call_once(url, api_key, model, audio_bytes, lang)
                break
            except Exception as e:
                last_err = e
        if text is None:
            raise RuntimeError("STT failed: " + str(last_err))
        with open(outfile, "w", encoding="utf-8") as f:
            json.dump({"ok": True, "text": text}, f, ensure_ascii=False)
    except Exception as e:
        with open(outfile, "w", encoding="utf-8") as f:
            json.dump({"ok": False, "error": str(e)}, f, ensure_ascii=False)


if __name__ == "__main__":
    main()
