import { 
  faCode, faExchangeAlt, faClock, faGlobe, faLink, faLock, 
  faImage, faCogs, faFileCode, faKey, faFont, 
  faCalendarAlt, faPalette, faEdit, faRuler, faNetworkWired,
  faEraser, faCalculator, faFileAlt, faCube,faObjectGroup, faCompress, faRobot
} from '@fortawesome/free-solid-svg-icons';
import { Tool } from '@/types/tools';

// 定义工具列表
const tools: Tool[] = [
  {
    code: 'json_formatter',
    icon: faCode,
    category: ['common', 'json'],
    keywords: ['json', 'json格式化', '格式化', '美化', '压缩', '校验', 'formatter', 'validator', 'gshjson', 'gshjson', 'jsonxg', 'jxg']
  },
  {
    code: 'http_tester',
    icon: faGlobe,
    category: ['common','network'],
    keywords: ['http测试', 'api测试', '接口测试', '请求测试', 'http', 'api', 'request', 'jiekou', 'qingqiu', 'ceshi', 'postman']
  },
  {
    code: 'timestamp_converter',
    icon: faClock,
    category: ['common', 'datetime'],
    keywords: ['时间戳', '时间', '日期', 'timestamp', 'time', 'date', 'unix时间', 'datetime', 'shijian', 'sjc', 'sj', 'riqi', 'rq']
  },

  {
    code: 'encoding_converter',
    icon: faExchangeAlt,
    category: ['common', 'encoding'],
    keywords: ['编码', '解码', 'base64', 'url编码', 'unicode', '编码转换', 'encoding', 'decoding', 'bianma', 'jiema', 'bm', 'jm']
  },
  {
    code: 'regex_tester',
    icon: faKey,
    category: ['text'],
    keywords: ['正则', '正则表达式', 'regex', '表达式', '正则测试', 'regular expression', 'zhengze', 'zz']
  },
  {
    code: 'crypto_tools',
    icon: faLock,
    category: ['encoding'],
    keywords: ['加密', '解密', '哈希', 'md5', 'sha', 'aes', 'des', '加密工具', '解密工具', 'encrypt', 'decrypt', 'hash', 'jiami', 'jiemi', 'jm']
  },
  {
    code: 'color_tools',
    icon: faPalette,
    category: ['frontend'],
    keywords: ['颜色', '调色板', '颜色转换', '颜色选择', 'color', 'rgb', 'hex', 'hsv', 'hsl', 'yanse', 'ys', 'colors']
  },
  {
    code: 'code_formatter',
    icon: faFileCode,
    category: ['code'],
    keywords: ['代码格式化', '代码美化', '格式化', '美化', 'code', 'formatter', 'beautify', 'html', 'css', 'js', 'sql', 'daima', 'dm', 'geshi']
  },

  {
    code: 'json_editor',
    icon: faEdit,
    category: ['common', 'json'],
    keywords: ['json编辑器', 'json修改', '编辑器', 'json', 'editor', 'jsonbj', 'json编辑', 'bianji', 'bj']
  },
  {
    code: 'json_converter',
    icon: faExchangeAlt,
    category: ['json'],
    keywords: ['json转换', 'json2xml', 'json2csv', 'json2yaml', 'xml转json', 'csv转json', 'yaml转json', 'jsonzh', 'json互转', 'zhuanhuan', 'zh']
  },
  {
    code: 'url_encoder',
    icon: faLink,
    category: ['encoding'],
    keywords: ['url编码', 'url解码', 'url转换', '网址编码', 'urlencode', 'urldecode', 'url编解码', 'wangzhi', 'wz']
  },
  {
    code: 'unicode_converter',
    icon: faFont,
    category: ['encoding'],
    keywords: ['unicode', '中文', '编码转换', 'unicode转中文', '中文转unicode', 'zhongwen', 'zw', 'unicode编码', 'unicode解码']
  },
  {
    code: 'jwt_decoder',
    icon: faLock,
    category: ['encoding'],
    keywords: ['jwt', 'token', 'jwt解析', 'jwt验证', 'json web token', '令牌', 'token解析', 'jwtjx', 'lingpai']
  },
  {
    code: 'ip_lookup',
    icon: faNetworkWired,
    category: ['common','network'],
    keywords: ['ip查询', 'ip地址', 'ip归属地', '地址查询', 'ip', 'ip归属', 'dizhi', 'dz', 'ip地址查询', 'ipdz']
  },
  {
    code: 'date_calculator',
    icon: faCalendarAlt,
    category: ['datetime'],
    keywords: ['日期计算', '日期差值', '计算器', '日期', 'date', 'calculator', 'date差值', '天数计算', 'riqi', 'rq', 'jsq']
  },
  {
    code: 'timezone_converter',
    icon: faClock,
    category: ['datetime'],
    keywords: ['时区', '时区转换', '时间转换', '时区计算', 'timezone', 'time zone', 'shiqu', 'sq', 'GMT', 'UTC']
  },
  {
    code: 'text_counter',
    icon: faRuler,
    category: ['text'],
    keywords: ['字数统计', '字符统计', '字数', '词数', '行数', '计数', 'word count', 'character count', 'zishu', 'zs', 'tongji', 'tj']
  },
  {
    code: 'text_space_stripper',
    icon: faEraser,
    category: ['text'],
    keywords: ['去空格', '去换行', '去空白', '字符串处理', '文本处理', '空格删除', '换行符', 'trim', 'strip', 'space', 'whitespace', 'newline']
  },
  {
    code: 'html_markdown_converter',
    icon: faFileCode,
    category: ['code', 'text'],
    keywords: ['html', 'markdown', 'md', 'html转markdown', 'markdown转html', '文档转换', 'html2md', 'md2html', 'wenzhang']
  },
  {
    code: 'image_compressor',
    icon: faImage,
    category: ['common', 'image'],
    keywords: ['图片压缩', '压缩图片', '图片', '压缩', 'image', 'compress', 'compressor', 'tupian', 'tp', 'yasuo', 'ys']
  },
  {
    code: 'qrcode_generator',
    icon: faImage,
    category: ['common','image'],
    keywords: ['二维码', '二维码生成', 'qrcode', 'qr码', '扫码', '二维码生成器', 'erweima', 'ewm', 'saoma', 'sm']
  },
  {
    code: 'css_gradient_generator',
    icon: faCogs,
    category: ['frontend'],
    keywords: ['css渐变', '渐变', '渐变背景', 'css', 'gradient', '背景', 'css生成器', 'jianbian', 'jb', 'beijing', 'bj']
  },
  {
    code: 'number_base_converter',
    icon: faCalculator,
    category: ['encoding'],
    keywords: ['进制转换', '进制', '二进制', '八进制', '十进制', '十六进制', '二进制转换', '十六进制转换', 'binary', 'hex', 'decimal', 'octal', 'base conversion', 'jinzhi', 'jzzh', 'jz']
  },
  {
    code: 'yml_properties_converter',
    icon: faFileAlt,
    category: ['code'],
    keywords: ['yml', 'yaml', 'properties', 'yml转properties', 'properties转yml', '配置文件', '转换工具', 'yml互转properties', 'yaml互转properties', '配置转换', 'peizhi', 'pz', 'zhuanhuan', 'zh']
  },
  {
    code: 'base64_to_image',
    icon: faImage,
    category: ['image', 'encoding'],
    keywords: ['base64', 'base64转图片', '图片转base64', '图片', '解码', '编码', '转换', 'base64 to image', 'image to base64', 'image decoder', 'image encoder', 'tupian', 'tp', 'jm', 'bm', 'zhuanhuan', 'zh', 'base64转换']
  },
  {
    code: 'image_watermark',
    icon: faImage,
    category: ['image'],
    keywords: ['图片水印', '水印', '水印添加', '图片', '文字水印', '图片水印', 'watermark', 'image watermark', 'tupian shuiyin', 'tpshuiyin', 'shuiyin', 'sy', 'tp']
  },
  {
    code: 'cron_generator',
    icon: faCalendarAlt,
    category: ['datetime'],
    keywords: ['cron', 'cron表达式', '定时任务', '调度', '表达式生成', '执行时间', 'crontab', 'quartz', 'schedule', 'dingshi', 'dingshibiaodashi', 'dsrw', 'bds', 'cronbds']
  },
  {
    code: 'icon_designer',
    icon: faCube,
    category: ['common', 'image'],
    keywords: ['图标设计', '图标生成', 'icon设计', '图标制作', 'app图标', 'logo设计', 'favicon制作', '图标工具', 'icon designer', 'icon generator', 'tubiao', 'tb', 'sheji', 'sj', 'zhizuo', 'zz']
  },

  {
    code: 'password_generator',
    icon: faKey,
    category: ['code'],
    keywords: ['密码', '随机密码', '密码生成', '口令', '强密码', 'password', 'random', 'generator', 'security', 'mima', 'mm', 'suiji']
  },

  {
    code: 'ai_api_checker',
    icon: faRobot,
    category: ['common', 'network'],
    keywords: ['ai', 'api', 'ai检测', 'api检测', '可用性检测', '接口检测', 'openai', 'chatgpt', 'claude', 'anthropic', 'gemini', '大模型', '模型列表', 'model', 'api check', 'ai api', 'aijc', 'apijc', 'kyx']
  },

  // PDF工具


  {
    code: 'pdf_converter',
    icon: faExchangeAlt,
    category: ['pdf'],
    keywords: ['pdf转换', 'pdf转图片', '图片转pdf', 'pdf转文本', 'pdf转换器', 'pdf converter', 'pdf转换工具', 'pdf', 'zhuanhuan', 'zh', 'zhuanhuanqi', 'zhq']
  },
  {
    code: 'pdf_manager',
    icon: faObjectGroup,
    category: ['pdf'],
    keywords: ['pdf合并', 'pdf分割', 'pdf合并器', 'pdf分割器', '合并pdf', '分割pdf', 'pdf合并工具', 'pdf分割工具', 'pdf merger', 'pdf splitter', 'pdf合并软件', 'pdf分割软件', 'pdf', 'hebing', 'fenge', 'hb', 'fg', 'hebingqi', 'fengeqi', 'hbq', 'fgq']
  },
  {
    code: 'pdf_compressor',
    icon: faCompress,
    category: ['pdf'],
    keywords: ['pdf压缩', 'pdf压缩器', '压缩pdf', 'pdf压缩工具', 'pdf compressor', 'pdf压缩软件', 'pdf', 'yasuo', 'ys', 'yasuoqi', 'ysq']
  },


] as Tool[];

export default tools; 