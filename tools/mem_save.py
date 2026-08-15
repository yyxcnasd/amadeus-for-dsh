#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Amadeus 记忆落盘兜底：从本机 /amadeus/memory 拉取 JSON 并写入磁盘。
用法: python tools/mem_save.py <port> <outfile>
（fs 服务的沙箱可能拦截写入；python 子进程写盘已验证可用。）
"""
import sys
import json
import urllib.request


def main():
    port = sys.argv[1] if len(sys.argv) > 1 else '3080'
    out = sys.argv[2] if len(sys.argv) > 2 else 'memory/amadeus-memory.json'
    url = 'http://127.0.0.1:' + port + '/amadeus/memory'
    with urllib.request.urlopen(url, timeout=10) as r:
        data = json.loads(r.read().decode('utf-8'))
    payload = {
        'facts': data.get('facts', []),
        'history': data.get('history', []),
        'lastCallAt': data.get('lastCallAt', 0),
        'callCount': data.get('callCount', 0),
    }
    tmp = out + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    import os
    os.replace(tmp, out)
    print('mem_save ok, history=%d' % len(payload['history']))


if __name__ == '__main__':
    main()
