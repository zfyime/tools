import { NextRequest, NextResponse } from 'next/server';

// AI 接口检测请求通常较慢，给足超时时间
const TIMEOUT_MS = 60 * 1000;

// 目标接口返回内容的大小上限（5MB）
const MAX_RESPONSE_SIZE = 5 * 1024 * 1024;

// 只允许透传与鉴权相关的请求头，避免被当成通用代理使用
const ALLOWED_REQUEST_HEADERS = new Set([
  'content-type',
  'accept',
  'authorization',
  'x-api-key',
  'anthropic-version',
  'anthropic-beta',
  'x-goog-api-key',
  'openai-organization',
  'openai-project',
]);

const FORBIDDEN_HOST_SUFFIXES = [
  '.local',
  '.internal',
  '.intranet',
  '.lan',
  '.localhost',
  '.nip.io',
  '.sslip.io',
  '.xip.io',
  '.lvh.me',
  '.localtest.me',
];

/**
 * 检查目标 URL 是否安全，阻止访问内网地址与本地服务
 */
function isUrlSafe(rawUrl: string): boolean {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return false;
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return false;
  }

  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');

  // 基础主机名
  if (!hostname || hostname === 'localhost' || hostname === '::1' || hostname === '0.0.0.0') {
    return false;
  }

  // 禁用域名后缀（含内网探测类 DNS 服务）
  if (FORBIDDEN_HOST_SUFFIXES.some((suffix) => hostname.endsWith(suffix))) {
    return false;
  }

  // IPv4 私有 / 保留地址
  const ipv4 = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const octets = ipv4.slice(1).map(Number);
    if (octets.some((part) => part > 255)) return false;
    const [a, b] = octets;
    if (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a >= 224
    ) {
      return false;
    }
  }

  // IPv6 链路本地 / 唯一本地地址
  if (/^f[cd][0-9a-f]{2}:/i.test(hostname) || /^fe80:/i.test(hostname)) {
    return false;
  }

  return true;
}

/**
 * 代理 AI 接口检测请求
 */
export async function POST(request: NextRequest) {
  let payload: {
    url?: string;
    method?: string;
    headers?: Record<string, string>;
    body?: unknown;
  };

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: '请求体格式错误' }, { status: 400 });
  }

  const { url, method = 'POST', headers = {}, body } = payload;

  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: '缺少目标 URL' }, { status: 400 });
  }

  if (!isUrlSafe(url)) {
    return NextResponse.json({ error: '该 URL 不被允许访问' }, { status: 403 });
  }

  // 仅保留白名单请求头
  const sanitizedHeaders: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase();
    if (ALLOWED_REQUEST_HEADERS.has(lowerKey) && typeof value === 'string') {
      sanitizedHeaders[lowerKey] = value;
    }
  }
  sanitizedHeaders['user-agent'] = sanitizedHeaders['user-agent'] || 'JiSuXiang-AIChecker/1.0';

  let requestBody: string | undefined;
  if (body !== undefined && body !== null && method !== 'GET' && method !== 'HEAD') {
    requestBody = typeof body === 'string' ? body : JSON.stringify(body);
    if (requestBody.length > MAX_RESPONSE_SIZE) {
      return NextResponse.json({ error: '请求体超过大小限制' }, { status: 413 });
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const startTime = performance.now();

  try {
    const response = await fetch(url, {
      method,
      headers: sanitizedHeaders,
      body: requestBody,
      // 不自动跟随重定向，避免绕过内网地址检查
      redirect: 'manual',
      signal: controller.signal,
    });

    const time = Math.round(performance.now() - startTime);
    const contentType = response.headers.get('content-type') || '';
    const contentLength = Number(response.headers.get('content-length') || 0);

    if (contentLength > MAX_RESPONSE_SIZE) {
      return NextResponse.json({
        status: response.status,
        statusText: response.statusText,
        time,
        headers: { 'content-type': contentType },
        data: '响应内容过大，已被截断',
      });
    }

    const text = await response.text();

    if (text.length > MAX_RESPONSE_SIZE) {
      return NextResponse.json({
        status: response.status,
        statusText: response.statusText,
        time,
        headers: { 'content-type': contentType },
        data: '响应内容过大，已被截断',
      });
    }

    let data: unknown = text;
    if (contentType.includes('application/json') || contentType.includes('+json')) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    } else if (text) {
      // 部分中转站未正确设置 Content-Type，尝试按 JSON 解析
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    return NextResponse.json({
      status: response.status,
      statusText: response.statusText,
      time,
      headers: { 'content-type': contentType },
      data,
    });
  } catch (error) {
    const time = Math.round(performance.now() - startTime);

    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json({ error: '请求超时（60 秒）', time }, { status: 504 });
    }

    return NextResponse.json(
      { error: '无法连接到目标服务器，请检查地址是否正确', time },
      { status: 502 }
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
