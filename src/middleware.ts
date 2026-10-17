import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';

// 安全验证配置
const SECURITY_CONFIG = {
  // 允许的最大请求体大小（50MB）
  maxBodySize: 50 * 1024 * 1024,
  
  // 请求频率限制时间窗口（毫秒）
  rateWindowMs: 60 * 1000,
  
  // 时间窗口内允许的最大请求数（普通API）
  apiRateLimit: 100,
  
  // 文件上传API的请求限制（更严格）
  fileUploadRateLimit: 10,
  
  // API调用需要的请求头
  requiredHeaders: {
    // 'X-API-Client': 'jisuxiang-web',
  },
};

// 需要验证令牌的API路径
const PROTECTED_API_PATHS = [
  // 所有API路径都需要验证
  '/api/',
  // 以下是特别指定的API路径，方便单独配置
  '/api/markdown-convert',
  '/api/ip',
  // 这里可以添加更多需要保护的API路径
];

// 文件上传类API路径
const FILE_UPLOAD_API_PATHS = [
  '/api/markdown-convert',
  // 这里可以添加更多文件上传类API
];

// 频率限制较高的API路径
const HIGH_RATE_LIMIT_API_PATHS = [
  '/api/ip',
  '/api/proxy',
  '/api/ai-check',
  // 其他可以有较高频率限制的API
];

// 免于客户端令牌与反爬行为检测的API路径
// /api/ai-check 是受限转发接口（请求头白名单 + 内网地址拦截），一次检测会产生多次请求，
// 不应被通用反爬与黑名单机制误伤
const BEHAVIOR_EXEMPT_API_PATHS = [
  '/api/ai-check',
];

// 请求频率限制存储（使用IP作为键）
const rateLimits = new Map<string, {count: number, timestamp: number}>();

// 客户端令牌存储（简单的内存存储，生产环境可以使用Redis等）
const clientTokens = new Map<string, {timestamp: number}>();

// IP黑名单（恶意IP会被临时加入黑名单）
const ipBlacklist = new Map<string, {timestamp: number, reason: string}>();

// 黑名单时长（24小时）
const BLACKLIST_DURATION = 24 * 60 * 60 * 1000;

// 可疑行为记录
const suspiciousActivities = new Map<string, {count: number, timestamp: number}>();

// 可疑行为阈值（超过这个值会被加入黑名单）
const SUSPICIOUS_THRESHOLD = 5;

/**
 * 生成客户端令牌
 */
function generateClientToken(): string {
  return nanoid(32);
}

/**
 * 验证客户端令牌是否有效
 */
function validateClientToken(token: string): boolean {
  if (!token) return false;
  
  const tokenData = clientTokens.get(token);
  if (!tokenData) return false;
  
  // 令牌有效期检查（2小时）
  const now = Date.now();
  if (now - tokenData.timestamp > 2 * 60 * 60 * 1000) {
    clientTokens.delete(token);
    return false;
  }
  
  return true;
}

/**
 * 清理过期的令牌和限制记录
 */
function cleanupExpiredData() {
  const now = Date.now();
  
  // 清理过期的令牌
  clientTokens.forEach((data, token) => {
    if (now - data.timestamp > 2 * 60 * 60 * 1000) {
      clientTokens.delete(token);
    }
  });
  
  // 清理过期的频率限制记录
  rateLimits.forEach((data, ip) => {
    if (now - data.timestamp > SECURITY_CONFIG.rateWindowMs) {
      rateLimits.delete(ip);
    }
  });
  
  // 清理过期的IP黑名单
  ipBlacklist.forEach((data, ip) => {
    if (now - data.timestamp > BLACKLIST_DURATION) {
      ipBlacklist.delete(ip);
    }
  });
  
  // 清理过期的可疑行为记录
  suspiciousActivities.forEach((data, ip) => {
    if (now - data.timestamp > SECURITY_CONFIG.rateWindowMs) {
      suspiciousActivities.delete(ip);
    }
  });
}

/**
 * 检查请求频率限制
 */
function checkRateLimit(ip: string, path: string, recordSuspicion: boolean = true): boolean {
  const now = Date.now();
  const userLimit = rateLimits.get(ip);
  
  // 确定当前路径的请求限制
  const isFileUpload = FILE_UPLOAD_API_PATHS.some(apiPath => path.startsWith(apiPath));
  const isHighRateApi = HIGH_RATE_LIMIT_API_PATHS.some(apiPath => path.startsWith(apiPath));
  
  // 确定适用的限制
  let limit;
  if (isFileUpload) {
    limit = SECURITY_CONFIG.fileUploadRateLimit;
  } else if (isHighRateApi) {
    limit = SECURITY_CONFIG.apiRateLimit * 3; // 对于IP查询等API，允许更高的访问频率
  } else {
    limit = SECURITY_CONFIG.apiRateLimit;
  }
  
  if (!userLimit) {
    rateLimits.set(ip, { count: 1, timestamp: now });
    return true;
  }
  
  // 如果时间窗口已过，重置计数
  if (now - userLimit.timestamp > SECURITY_CONFIG.rateWindowMs) {
    rateLimits.set(ip, { count: 1, timestamp: now });
    return true;
  }
  
  // 增加计数并检查是否超过限制
  userLimit.count++;
  if (userLimit.count > limit) {
    if (recordSuspicion) {
      recordSuspiciousActivity(ip, '请求频率过高');
    }
    return false;
  }
  
  return true;
}

/**
 * 记录可疑行为
 */
function recordSuspiciousActivity(ip: string, reason: string): void {
  const now = Date.now();
  const record = suspiciousActivities.get(ip);
  
  if (!record) {
    suspiciousActivities.set(ip, { count: 1, timestamp: now });
    return;
  }
  
  // 如果时间窗口已过，重置计数
  if (now - record.timestamp > SECURITY_CONFIG.rateWindowMs) {
    suspiciousActivities.set(ip, { count: 1, timestamp: now });
    return;
  }
  
  // 增加计数并检查是否超过阈值
  record.count++;
  if (record.count >= SUSPICIOUS_THRESHOLD) {
    // 加入黑名单
    ipBlacklist.set(ip, { timestamp: now, reason });
    suspiciousActivities.delete(ip);
  }
}

/**
 * 验证安全请求头
 */
function validateSecurityHeaders(request: NextRequest, ip: string): boolean {
  // 检查必需的安全请求头
  const timestamp = request.headers.get('X-Timestamp');
  const nonce = request.headers.get('X-Nonce');
  const signature = request.headers.get('X-Signature');
  // const client = request.headers.get('X-Client');
  
  // 实际项目中应该进行更严格的验证，这里仅作示例
  if (!timestamp || !nonce || !signature) {
    // 记录可疑活动但不直接拒绝请求，因为可能是其他正常客户端
    if (PROTECTED_API_PATHS.some(path => request.nextUrl.pathname.startsWith(path))) {
      recordSuspiciousActivity(ip, '缺少安全请求头');
    }
    return true; // 不强制要求
  }
  
  // 检查时间戳是否合理（允许5分钟的时间差）
  const currentTime = Math.floor(Date.now() / 1000);
  const requestTime = parseInt(timestamp);
  
  if (isNaN(requestTime) || Math.abs(currentTime - requestTime) > 300) {
    recordSuspiciousActivity(ip, '请求时间戳异常');
    return false;
  }
  
  // 实际项目中应该验证签名
  // 这里简化处理，仅检查格式
  if (!/^[a-f0-9]{8,}$/.test(signature)) {
    recordSuspiciousActivity(ip, '安全签名格式异常');
    return false;
  }
  
  return true;
}

/**
 * 检查请求是否来自爬虫
 */
function checkBotHeaders(request: NextRequest, ip: string): boolean {
  // const fingerprint = request.headers.get('X-Browser-Fingerprint');
  const clientType = request.headers.get('X-Client-Type');
  
  // 如果明确标记为爬虫
  if (clientType === 'potential-bot') {
    recordSuspiciousActivity(ip, '客户端自识别为爬虫');
    return false;
  }
  
  // 检查可疑特征
  const userAgent = request.headers.get('user-agent') || '';
  const botPatterns = [
    'bot', 'spider', 'crawl', 'slurp', 'scrape',
    'phantomjs', 'headless', 'selenium', 'webdriver', 'puppeteer',
  ];
  
  if (botPatterns.some(pattern => userAgent.toLowerCase().includes(pattern))) {
    recordSuspiciousActivity(ip, '爬虫特征的User-Agent');
    return false;
  }
  
  return true;
}

/**
 * 中间件处理函数
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 定期清理过期数据
  if (Math.random() < 0.01) { // 1%的请求触发清理
    cleanupExpiredData();
  }
  
  // 仅对API请求进行检查
  if (pathname.startsWith('/api/')) {
    // 获取客户端IP
    const ip = request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               'unknown';

    // 该接口不走令牌与可疑行为检测，仅保留频率限制
    const isBehaviorExempt = BEHAVIOR_EXEMPT_API_PATHS.some(apiPath => pathname.startsWith(apiPath));

    // 检查IP是否在黑名单中
    if (!isBehaviorExempt && ipBlacklist.has(ip)) {
      // const blacklistInfo = ipBlacklist.get(ip);
      return NextResponse.json(
        { error: '您的请求已被暂时限制，请稍后再试' },
        { status: 403 }
      );
    }

    // 检查请求频率限制
    if (!checkRateLimit(ip, pathname, !isBehaviorExempt)) {
      return NextResponse.json(
        { error: '请求频率过高，请稍后再试' },
        { status: 429 }
      );
    }

    if (isBehaviorExempt) {
      return NextResponse.next();
    }

    // 检查安全请求头
    if (!validateSecurityHeaders(request, ip)) {
      return NextResponse.json(
        { error: '请求安全验证失败' },
        { status: 400 }
      );
    }
    
    // 检查是否可能是爬虫
    if (!checkBotHeaders(request, ip)) {
      // 对于爬虫，不直接拒绝，但会加入可疑活动计数
      // 如果达到阈值会自动加入黑名单
    }
    
    // 检查所需的请求头
    for (const [headerName, headerValue] of Object.entries(SECURITY_CONFIG.requiredHeaders)) {
      if (request.headers.get(headerName) !== headerValue) {
        recordSuspiciousActivity(ip, '缺少必要的请求头');
        return NextResponse.json(
          { error: '缺少必要的请求头' },
          { status: 403 }
        );
      }
    }
    
    // 验证客户端令牌
    const clientToken = request.headers.get('X-Client-Token');
    
    // 对于首次请求，不需要令牌，将返回一个新令牌
    if (!clientToken) {
      const newToken = generateClientToken();
      clientTokens.set(newToken, { timestamp: Date.now() });
      
      const response = NextResponse.json(
        { error: '需要客户端令牌', token: newToken },
        { status: 401 }
      );
      
      return response;
    }
    
    // 验证现有令牌
    if (!validateClientToken(clientToken)) {
      const newToken = generateClientToken();
      clientTokens.set(newToken, { timestamp: Date.now() });
      
      const response = NextResponse.json(
        { error: '令牌无效或已过期', token: newToken },
        { status: 401 }
      );
      
      return response;
    }
  }
  
  return NextResponse.next();
}

/**
 * 配置中间件只在API路径上运行
 */
export const config = {
  matcher: [
    '/api/:path*',
  ],
}; 