"""Amadeus 独立 AI API 调用器（OpenAI 兼容 /chat/completions，纯标准库）。

用法: python llm_chat.py <request.json> <result.json>
request.json: {baseUrl, apiKey, model, system, messages:[{role,content}], maxTokens, temperature}
result.json:  {ok: true, content: "..."} 或 {ok: false, error: "..."}
"""
import json
import sys
import urllib.error
import urllib.request


def mask_url(url):
    """隐藏 URL 中的敏感信息（当前 key 在 header，不在这里，但保留安全习惯）。"""
    return url


def build_candidates(base_url):
    base = (base_url or 'https://api.deepseek.com/v1').strip().rstrip('/')
    if base.endswith('/chat/completions'):
        return [base]
    candidates = [base + '/chat/completions']
    # 常见情况：用户只填了域名如 https://api.deepseek.com，缺少 /v1
    if not base.endswith('/v1'):
        candidates.append(base + '/v1/chat/completions')
    return candidates


def call_once(url, body, headers):
    req = urllib.request.Request(url, data=body, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        detail = ''
        try:
            detail = e.read().decode('utf-8', 'replace')[:500]
        except Exception:
            detail = ''
        raise RuntimeError(
            'HTTP {} {} (url={}){}'.format(
                e.code,
                e.reason,
                mask_url(url),
                (' - ' + detail) if detail else '',
            )
        )
    except Exception as e:
        raise RuntimeError('{} (url={})'.format(e, mask_url(url)))
    if not isinstance(data, dict) or 'choices' not in data:
        raise RuntimeError('unexpected response (url={}): {}'.format(mask_url(url), json.dumps(data, ensure_ascii=False)[:300]))
    try:
        return data['choices'][0]['message']['content']
    except Exception:
        raise RuntimeError('response missing choices[0].message.content (url={}): {}'.format(mask_url(url), json.dumps(data, ensure_ascii=False)[:300]))


def main():
    infile, outfile = sys.argv[1], sys.argv[2]
    with open(infile, 'r', encoding='utf-8') as f:
        req = json.load(f)
    body = json.dumps({
        'model': req.get('model') or 'deepseek-chat',
        'messages': [{'role': 'system', 'content': req.get('system') or ''}] + list(req.get('messages') or []),
        'max_tokens': int(req.get('maxTokens') or 300),
        'temperature': float(req.get('temperature') or 0.9),
        'stream': False,
    }).encode('utf-8')
    headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + (req.get('apiKey') or ''),
        'User-Agent': 'Amadeus-DSH/1.0',
    }
    candidates = build_candidates(req.get('baseUrl'))
    last_err = None
    content = None
    for url in candidates:
        try:
            content = call_once(url, body, headers)
            break
        except Exception as e:
            last_err = e
    if content is None:
        with open(outfile, 'w', encoding='utf-8') as f:
            json.dump({'ok': False, 'error': str(last_err)}, f, ensure_ascii=False)
        return
    with open(outfile, 'w', encoding='utf-8') as f:
        json.dump({'ok': True, 'content': content}, f, ensure_ascii=False)


if __name__ == '__main__':
    main()
