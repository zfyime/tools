'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCode, faCopy, faCheck, faCompress, faExpand,
  faSearch, faTrash, faSync, faFolderOpen, faFolder, faSpinner,
  faSave, faHistory, faTimes, faEdit, faStar, faTrashAlt, faEraser
} from '@fortawesome/free-solid-svg-icons';
import dynamic from 'next/dynamic';
import BackToTop from '@/components/BackToTop';
import ToolHeader from '@/components/ToolHeader';
import { useLanguage } from '@/context/LanguageContext';

// 动态导入@uiw/react-json-view组件，避免SSR问题
const ReactJson = dynamic(() => import('@uiw/react-json-view'), { ssr: false });

// 定义历史记录条目类型
interface JsonHistoryItem {
  id: string;
  title: string;
  json: string;
  timestamp: number;
  isFavorite?: boolean;
}

// 大 JSON 阈值：超过此大小默认折叠渲染，超过纯文本阈值则降级为纯文本
const LARGE_JSON_THRESHOLD = 100000;
const PLAIN_TEXT_THRESHOLD = 1000000;

// 转义映射表（单遍替换，避免链式替换的顺序问题）
const ESCAPE_MAP: Record<string, string> = {
  '\\': '\\\\',
  '"': '\\"',
  '\n': '\\n',
  '\r': '\\r',
  '\t': '\\t',
  '\f': '\\f',
  '\b': '\\b'
};

// 反转义映射表（单遍替换，避免链式替换的顺序问题）
const UNESCAPE_MAP: Record<string, string> = {
  n: '\n',
  r: '\r',
  t: '\t',
  f: '\f',
  b: '\b',
  '"': '"',
  '\\': '\\',
  '/': '/'
};

// 解析输入：先按标准JSON解析，失败后再尝试宽松模式（兼容JS对象字面量）
// 优先保证合法JSON永远不被正则预处理破坏
const parseJsonInput = (json: string): { parsed: unknown; lenient: boolean } => {
  try {
    return { parsed: JSON.parse(json), lenient: false };
  } catch (originalError) {
    // 宽松模式：处理常见的JS对象写法（单引号字符串、无引号键名）
    const processed = json
      .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":') // 键名标准化
      .replace(/'/g, '"'); // 单引号转双引号
    try {
      return { parsed: JSON.parse(processed), lenient: true };
    } catch {
      // 宽松模式也失败时，抛出原始错误（定位更准确）
      throw originalError;
    }
  }
};

// 从JSON解析错误中提取行列号并生成上下文标记
// 兼容V8（position N (line L column C)）、旧版V8（position N）和Firefox（line L column C）
const locateErrorPosition = (
  source: string,
  error: Error
): { line: number; column: number; context: string } | null => {
  let line: number | null = null;
  let column: number | null = null;

  const full = /position \d+ \(line (\d+),? column (\d+)\)/.exec(error.message);
  const firefox = /at line (\d+) column (\d+)/.exec(error.message);
  const posOnly = /position (\d+)/.exec(error.message);

  if (full) {
    line = parseInt(full[1], 10);
    column = parseInt(full[2], 10);
  } else if (firefox) {
    line = parseInt(firefox[1], 10);
    column = parseInt(firefox[2], 10);
  } else if (posOnly) {
    const pos = Math.min(parseInt(posOnly[1], 10), source.length);
    const before = source.slice(0, pos);
    const lastNewline = before.lastIndexOf('\n');
    line = before.split('\n').length;
    column = pos - lastNewline; // lastNewline为-1时正好得到从1开始的列号
  }

  if (line === null || column === null) return null;

  const lineText = source.split('\n')[line - 1] ?? '';
  // 超长行只保留错误位置附近的片段
  const isLongLine = lineText.length > 120;
  const start = isLongLine ? Math.max(0, column - 60) : 0;
  const snippet = isLongLine ? lineText.slice(start, start + 120) : lineText;
  const markerOffset = isLongLine ? column - start : column;
  const marker = ' '.repeat(Math.max(0, markerOffset - 1)) + '↑';
  return { line, column, context: `${snippet}\n${marker}` };
};

export default function JsonFormatter() {
  const { t } = useLanguage();
  const [jsonInput, setJsonInput] = useState('');
  const jsonInputRef = useRef<HTMLTextAreaElement>(null);
  const jsonPathInputRef = useRef<HTMLInputElement>(null);

  // 状态管理
  const [jsonOutput, setJsonOutput] = useState<string>('');
  const [jsonPath, setJsonPath] = useState<string>('');
  const [pathResult, setPathResult] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [notice, setNotice] = useState<string>('');
  const [isCompressed, setIsCompressed] = useState<boolean>(false);
  const [isFoldable, setIsFoldable] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLargeJson, setIsLargeJson] = useState<boolean>(false);
  // undefined 表示尚未解析成功（null 是合法的 JSON 值，不能用作哨兵）
  const [parsedJson, setParsedJson] = useState<unknown>(undefined);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    message: string;
  }>({ isValid: false, message: '' });

  // 历史记录相关状态
  const [historyItems, setHistoryItems] = useState<JsonHistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [savingTitle, setSavingTitle] = useState<string>('');
  const [isSaveModalOpen, setIsSaveModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<JsonHistoryItem | null>(null);

  // 从本地存储加载历史记录
  useEffect(() => {
    const savedHistory = localStorage.getItem('json_formatter_history');
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory) as JsonHistoryItem[];
        setHistoryItems(parsedHistory);
      } catch (e) {
        console.error(t('tools.json_formatter.load_history_error'), e);
      }
    }
    // t 每次渲染都会重新创建，放入依赖会导致无限循环；此effect只需挂载时执行一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 保存历史记录到本地存储
  const saveHistoryToLocalStorage = (items: JsonHistoryItem[]) => {
    localStorage.setItem('json_formatter_history', JSON.stringify(items));
  };

  // 实时格式化：输入或模式变化后debounce 400ms自动执行，
  // 打字过程中不清空旧输出/旧错误，避免中间态闪烁
  useEffect(() => {
    if (!jsonInput.trim()) {
      // 手动删空输入时同步清空结果，避免残留上一次的格式化内容
      setJsonOutput('');
      setParsedJson(undefined);
      setErrorMessage('');
      setNotice('');
      setValidationResult({ isValid: false, message: '' });
      setPathResult('');
      return;
    }
    const timer = setTimeout(() => formatJson(jsonInput, isCompressed), 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jsonInput, isCompressed]);

  // 格式化JSON
  const formatJson = (json: string, compress = false) => {
    if (!json.trim()) {
      setJsonOutput('');
      setParsedJson(undefined);
      setValidationResult({ isValid: false, message: '' });
      setErrorMessage('');
      setNotice('');
      setPathResult('');
      return;
    }

    setNotice('');

    // 检查JSON大小
    const isLarge = json.length > LARGE_JSON_THRESHOLD;
    setIsLargeJson(isLarge);

    // 设置加载状态，用setTimeout让spinner有机会绘制（大JSON解析是同步的）
    setIsLoading(true);

    setTimeout(() => {
      try {
        const { parsed, lenient } = parseJsonInput(json);

        // 根据模式输出不同格式
        const formattedJson = compress
          ? JSON.stringify(parsed)
          : JSON.stringify(parsed, null, 2);

        // 设置输出（缓存解析结果，供折叠视图和JSONPath查询复用）
        setJsonOutput(formattedJson);
        setParsedJson(parsed);

        // 计算大小
        const sizeKB = (formattedJson.length / 1024).toFixed(1);
        const largeJsonMessage = t('tools.json_formatter.large_json_processed').replace('{size}', sizeKB);

        setValidationResult({
          isValid: true,
          message: lenient
            ? t('tools.json_formatter.lenient_parsed')
            : isLarge ? largeJsonMessage : t('tools.json_formatter.json_valid')
        });
        setErrorMessage('');

        // 如果有JSONPath查询，执行查询
        if (jsonPath) {
          queryJsonPath(parsed, jsonPath);
        }

        setIsLoading(false);
      } catch (error) {
        // 解析失败：本地化错误信息并定位行列
        const located = error instanceof SyntaxError ? locateErrorPosition(json, error) : null;
        const message = located
          ? t('tools.json_formatter.json_parse_error_prefix')
            + t('tools.json_formatter.error_position')
              .replace('{line}', String(located.line))
              .replace('{column}', String(located.column))
          : t('tools.json_formatter.json_invalid');
        setValidationResult({ isValid: false, message });
        setErrorMessage(located ? `${message}\n${located.context}` : message);
        setParsedJson(undefined);
        setIsLoading(false);
      }
    }, 0);
  };

  // 压缩/美化切换
  const toggleCompression = () => {
    setIsCompressed(!isCompressed);
  };

  // 切换折叠功能
  const toggleFoldable = () => {
    setIsFoldable(!isFoldable);
  };

  // 移除JSON中的转义斜杠
  const removeSlashes = () => {
    if (!jsonInput) return;

    // 处理反斜杠串：\/ → /（转义斜杠还原），\\/ → \/（转义反斜杠+斜杠保持语义）
    const processed = jsonInput.replace(
      /(\\+)(\/+)/g,
      (_m, backslashes: string, slashes: string) =>
        '\\'.repeat(Math.floor(backslashes.length / 2)) + slashes.slice(0, 1)
    );

    if (processed === jsonInput) {
      setNotice(t('tools.json_formatter.no_change'));
      return;
    }

    // 更新输入框，由debounce统一触发格式化，避免同一份JSON被解析两次
    setJsonInput(processed);
  };

  // 字符串转义
  const escapeString = () => {
    if (!jsonInput) return;

    // 单遍替换，避免链式替换把已转义内容二次转义
    const processed = jsonInput.replace(/[\\"\n\r\t\f\b]/g, (c) => ESCAPE_MAP[c] ?? c);

    if (processed === jsonInput) {
      setNotice(t('tools.json_formatter.no_change'));
      return;
    }

    // 更新输入框，用户可能还需要进一步编辑
    setJsonInput(processed);
  };

  // 字符串反转义
  const unescapeString = () => {
    if (!jsonInput) return;

    // 单遍替换，避免链式替换的顺序问题（如 a\\nb 不应被错误换行）
    // \uXXXX / \xXX 还原为对应字符；未知转义（如 \z）原样保留，避免丢失反斜杠
    const processed = jsonInput.replace(
      /\\(u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2}|[\s\S])/g,
      (match, escape: string) =>
        escape.length > 1 ? String.fromCharCode(parseInt(escape.slice(1), 16)) : (UNESCAPE_MAP[escape] ?? match)
    );

    if (processed === jsonInput) {
      setNotice(t('tools.json_formatter.no_change'));
      return;
    }

    // 更新输入框，用户可能还需要进一步编辑
    setJsonInput(processed);
  };

  // 复制结果到剪贴板
  const copyToClipboard = () => {
    if (jsonOutput) {
      navigator.clipboard.writeText(jsonOutput)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(err => console.error(t('tools.json_formatter.copy_failed'), err));
    }
  };

  // 清空输入
  const clearInput = () => {
    setJsonInput('');
    setJsonOutput('');
    setParsedJson(undefined);
    setErrorMessage('');
    setNotice('');
    setValidationResult({ isValid: false, message: '' });
    setPathResult('');
    if (jsonInputRef.current) {
      jsonInputRef.current.focus();
    }
  };

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNotice('');
    setJsonInput(value);
  };

  // 处理粘贴事件：不再拦截粘贴，让onChange自然触发debounce格式化
  // （旧版拦截粘贴会整框覆盖已有内容，导致光标跳变和内容丢失）

  // 路径查询变化
  const handlePathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setJsonPath(value);

    // 如果有已解析的JSON和路径，执行查询
    if (value && parsedJson !== undefined) {
      queryJsonPath(parsedJson, value);
    } else {
      setPathResult('');
    }
  };

  // 执行JSONPath查询
  const queryJsonPath = (json: unknown, path: string) => {
    if (!path) {
      setPathResult('');
      return;
    }

    try {
      // 路径解析：支持点符号、方括号（数字/引号下标），并剥离前导 $
      const segments = path
        .replace(/^\$\.?/, '') // 剥离前导 $ 或 $.
        .replace(/\[(?:'([^']+)'|"([^"]+)"|(\w+))\]/g, (_m, s1: string, s2: string, s3: string) => `.${s1 || s2 || s3}`) // [abc] / ['abc'] / ["abc"] 转换为.abc
        .replace(/^\./, '') // 移除开头的点
        .split('.');

      let result: unknown = json;

      for (const segment of segments) {
        if (Array.isArray(result) && /^\d+$/.test(segment)) {
          // 数组数字下标
          const index = parseInt(segment, 10);
          if (index >= result.length) {
            throw new Error(t('tools.json_formatter.path_not_found').replace('{path}', path));
          }
          result = result[index];
        } else if (typeof result === 'object' && result !== null && segment in result) {
          result = (result as Record<string, unknown>)[segment];
        } else {
          throw new Error(t('tools.json_formatter.path_not_found').replace('{path}', path));
        }
      }

      // 格式化结果
      if (typeof result === 'object' && result !== null) {
        setPathResult(JSON.stringify(result, null, 2));
      } else {
        setPathResult(String(result));
      }
    } catch (error) {
      if (error instanceof Error) {
        setPathResult(t('tools.json_formatter.query_error').replace('{message}', error.message));
      }
    }
  };

  // 加载示例JSON
  const loadExample = () => {
    const example = {
      name: "极速工具箱",
      version: "1.0.0",
      description: "高效开发工具集成平台",
      author: {
        name: "JiSuXiang开发团队",
        email: "support@jisuxiang.com"
      },
      features: [
        "JSON格式化与验证",
        "时间戳转换",
        "编码转换工具",
        "正则表达式测试"
      ],
      statistics: {
        tools: 2400,
        users: 10000000,
        rating: 4.9
      },
      isOpenSource: true,
      lastUpdate: "2063-12-01T08:00:00Z"
    };

    const exampleJson = JSON.stringify(example);
    // 由debounce统一触发格式化，避免同一份JSON被解析两次
    setJsonInput(exampleJson);
  };

  // 重新格式化
  const reformat = () => {
    formatJson(jsonInput, isCompressed);
  };

  // 渲染可折叠的JSON（直接使用缓存的parsedJson，避免每次渲染重新解析）
  const renderFoldableJson = () => {
    if (parsedJson === undefined || !jsonOutput) return null;

    // 标量 JSON（字符串/数字/布尔/null）无法以树形展示，回退为纯文本
    if (typeof parsedJson !== 'object' || parsedJson === null) {
      return <pre className="whitespace-pre-wrap m-0 text-base leading-7" style={{ color: 'rgb(var(--color-text-primary))' }}>{jsonOutput}</pre>;
    }

    // 超过硬上限时降级为纯文本，避免渲染整棵树卡死页面
    if (jsonOutput.length > PLAIN_TEXT_THRESHOLD) {
      return (
        <div>
          <div className="mb-2 text-xs" style={{ color: 'rgb(var(--color-warning))' }}>
            {t('tools.json_formatter.large_json_text_mode')}
          </div>
          <pre className="whitespace-pre-wrap m-0 text-base leading-7" style={{ color: 'rgb(var(--color-text-primary))' }}>{jsonOutput}</pre>
        </div>
      );
    }

    return (
      <div className="json-viewer-theme">
        <ReactJson
          value={parsedJson}
          style={{
            backgroundColor: 'transparent',
            fontFamily: 'monospace',
            fontSize: '0.95rem',
            lineHeight: '1.7',
            color: 'rgb(var(--color-text-primary))'
          }}
          displayObjectSize={true}
          enableClipboard={false}
          displayDataTypes={false}
          collapsed={isLargeJson ? 2 : false}
        />
      </div>
    );
  };

  // 处理输入/输出区域的样式
  const getTextareaClasses = (hasError: boolean) => {
    return `w-full p-4 font-mono text-sm rounded-md border ${hasError ? 'border-[rgb(var(--color-error))]' : 'border-[rgba(var(--color-primary),0.2)]'
      } focus:outline-none focus:border-[rgb(var(--color-primary))] focus:ring-1 focus:ring-[rgb(var(--color-primary))] min-h-[350px] transition-all bg-[rgb(var(--color-bg-secondary))] text-[rgb(var(--color-text-primary))]`;
  };

  // 右侧输出区域样式
  const outputAreaClasses = `${getTextareaClasses(false)} overflow-auto relative flex-grow json-output-area`;

  // 工具栏按钮样式
  const toolbarButtonClass = "px-3 py-1.5 rounded text-sm flex items-center gap-1 transition-all border border-transparent hover:border-[rgba(var(--color-primary),0.3)]";

  // 工具栏动作按钮通用样式（底色+文字色+悬停色）
  const actionButtonClass = `${toolbarButtonClass} bg-[rgb(var(--color-bg-secondary))] text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-text-primary))]`;

  // 历史记录项目样式
  const historyItemClass = "p-3 rounded-md border border-[rgba(var(--color-primary),0.15)] hover:border-[rgba(var(--color-primary),0.4)] transition-all cursor-pointer bg-[rgb(var(--color-bg-secondary))] flex justify-between items-center mb-2";

  // 保存当前JSON到历史记录
  const saveToHistory = () => {
    if (!jsonOutput || !jsonOutput.trim()) return;

    // 默认标题（本地化）
    const fallbackTitle = `${t('tools.json_formatter.untitled')} ${new Date().toLocaleString()}`;

    if (editingItem) {
      // 更新现有项目
      const updatedItem = {
        ...editingItem,
        title: savingTitle || fallbackTitle,
        json: jsonOutput,
        timestamp: Date.now()
      };

      const updatedHistory = historyItems.map(item =>
        item.id === editingItem.id ? updatedItem : item
      );

      setHistoryItems(updatedHistory);
      saveHistoryToLocalStorage(updatedHistory);
    } else {
      // 创建新项目
      const newItem: JsonHistoryItem = {
        id: Date.now().toString(),
        title: savingTitle || fallbackTitle,
        json: jsonOutput,
        timestamp: Date.now()
      };

      const updatedHistory = [newItem, ...historyItems];
      setHistoryItems(updatedHistory);
      saveHistoryToLocalStorage(updatedHistory);
    }

    // 重置状态
    setSavingTitle('');
    setIsSaveModalOpen(false);
    setEditingItem(null);
  };

  // 加载历史记录中的JSON
  const loadFromHistory = (item: JsonHistoryItem) => {
    // 由debounce统一触发格式化，避免同一份JSON被解析两次
    setJsonInput(item.json);
    setIsHistoryOpen(false);
  };

  // 删除历史记录项目
  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 防止触发父元素的点击事件

    const updatedHistory = historyItems.filter(item => item.id !== id);
    setHistoryItems(updatedHistory);
    saveHistoryToLocalStorage(updatedHistory);
  };

  // 编辑历史记录项目标题
  const startEditingTitle = (item: JsonHistoryItem, e: React.MouseEvent) => {
    e.stopPropagation(); // 防止触发父元素的点击事件
    setEditingItem(item);
    setSavingTitle(item.title);
    setIsSaveModalOpen(true);
  };

  // 切换收藏状态
  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 防止触发父元素的点击事件

    const updatedHistory = historyItems.map(item => {
      if (item.id === id) {
        return { ...item, isFavorite: !item.isFavorite };
      }
      return item;
    });

    setHistoryItems(updatedHistory);
    saveHistoryToLocalStorage(updatedHistory);
  };

  // 渲染单个历史记录条目（收藏区与全部区共用）
  const renderHistoryItem = (item: JsonHistoryItem) => (
    <div key={item.id} className={historyItemClass} onClick={() => loadFromHistory(item)}>
      <div className="flex-1 truncate">
        <div className="font-medium truncate">{item.title}</div>
        <div className="text-xs" style={{ color: 'rgb(var(--color-text-tertiary))' }}>
          {new Date(item.timestamp).toLocaleString()}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={(e) => toggleFavorite(item.id, e)}
          title={item.isFavorite ? t('tools.json_formatter.remove_favorite') : t('tools.json_formatter.add_favorite')}
        >
          <FontAwesomeIcon
            icon={faStar}
            className={`favorite-icon ${item.isFavorite ? 'active' : ''}`}
          />
        </button>
        <button onClick={(e) => startEditingTitle(item, e)} title={t('tools.json_formatter.edit_title')}>
          <FontAwesomeIcon
            icon={faEdit}
            style={{ color: 'rgb(var(--color-text-tertiary))' }}
          />
        </button>
        <button onClick={(e) => deleteHistoryItem(item.id, e)} title={t('tools.json_formatter.delete')}>
          <FontAwesomeIcon
            icon={faTrashAlt}
            style={{ color: 'rgb(var(--color-text-tertiary))' }}
          />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col max-w-[1440px] mx-auto p-4 md:p-6">
      {/* 使用自定义样式 */}
      <style jsx global>{`
        .json-viewer-theme {
          --w-rjv-border-left-color: rgba(var(--color-primary), 0.5);
          --w-rjv-border-left-width: 1px;
          --w-rjv-color: rgb(var(--color-text-primary));
          --w-rjv-key-string: rgb(var(--color-primary-light));
          --w-rjv-type-string-color: rgb(var(--color-success));
          --w-rjv-type-int-color: rgb(var(--color-warning));
          --w-rjv-type-float-color: rgb(var(--color-warning));
          --w-rjv-type-boolean-color: rgb(var(--color-primary-hover));
          --w-rjv-arrow-color: rgb(var(--color-text-secondary));
          --w-rjv-background-color: transparent;
        }
        
        /* 增强JSON展示区域样式 */
        .json-output-area {
          font-size: 0.95rem !important;
          letter-spacing: 0.01em;
          background-color: rgb(var(--color-bg-secondary)) !important;
        }
        
        .json-output-area pre {
          font-size: 0.95rem !important;
          color: rgb(var(--color-text-primary)) !important;
        }
        
        /* 增强JSON视图组件中的文本样式 */
        .json-viewer-theme > div {
          font-size: 0.95rem !important;
          letter-spacing: 0.01em;
        }
        
        /* 优化字符串、数字和布尔值显示 */
        .json-viewer-theme [data-type="string"] {
          color: rgb(var(--color-success)) !important;
          opacity: 0.95;
        }
        
        .json-viewer-theme [data-type="number"],
        .json-viewer-theme [data-type="int"] {
          color: rgb(var(--color-warning)) !important;
          opacity: 0.95;
        }
        
        .json-viewer-theme [data-type="boolean"] {
          color: rgb(var(--color-primary-hover)) !important;
          opacity: 0.95;
        }
        
        /* 优化键名显示 */
        .json-viewer-theme [data-key] {
          color: rgb(var(--color-primary-light)) !important;
          font-weight: 500;
          opacity: 0.9;
        }
        
        /* 优化项目计数显示 */
        .json-viewer-theme .w-rjv-objects {
          color: rgb(var(--color-text-secondary)) !important;
          opacity: 0.9;
          font-size: 0.9em;
        }
        
        /* 优化同级元素对齐 */
        .json-viewer-theme .w-rjv-object-key,
        .json-viewer-theme .w-rjv-array-key {
          position: relative;
          display: inline-flex;
          min-width: 1em;
        }
        
        /* 使展开/折叠按钮更加合理 */
        .json-viewer-theme .w-rjv-item {
          position: relative;
        }
        
        .json-viewer-theme .w-rjv-arrow {
          position: absolute;
          left: -15px;
          top: 3px;
        }
        
        /* 减弱引号的显示 */
        .json-viewer-theme .w-rjv-qoute {
          opacity: 0.5;
          color: rgb(var(--color-text-tertiary)) !important;
        }

        /* 增强非折叠模式下的JSON显示 */
        .json-output-area pre.text-base {
          padding: 0.5rem;
        }
        
        /* 增强JSONPath查询结果区域 */
        .card pre {
          font-size: 0.95rem !important;
          color: rgb(var(--color-text-primary)) !important;
        }

        /* 暗色主题特定样式 */
        [data-theme="dark"] .json-output-area pre {
          text-shadow: none;
        }
        
        [data-theme="dark"] .json-viewer-theme [data-type="string"] {
          text-shadow: none;
        }
        
        [data-theme="dark"] .json-viewer-theme [data-type="number"],
        [data-theme="dark"] .json-viewer-theme [data-type="int"] {
          text-shadow: none;
        }
        
        [data-theme="dark"] .json-viewer-theme [data-type="boolean"] {
          text-shadow: none;
        }

        /* 历史记录面板样式 */
        .history-panel {
          position: fixed;
          top: 0;
          right: 0;
          height: 100vh;
          width: 350px;
          background-color: rgb(var(--color-bg-primary));
          border-left: 1px solid rgba(var(--color-primary), 0.2);
          z-index: 50;
          transform: translateX(100%);
          transition: transform 0.3s ease-in-out;
          box-shadow: -5px 0 15px rgba(0, 0, 0, 0.1);
          padding: 1rem;
          overflow-y: auto;
        }
        
        .history-panel.open {
          transform: translateX(0);
        }
        
        .history-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 40;
          backdrop-filter: blur(2px);
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s ease-in-out;
        }
        
        .history-overlay.open {
          opacity: 1;
          pointer-events: auto;
        }
        
        /* 模态框样式 */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 60;
          display: flex;
          justify-content: center;
          align-items: center;
          backdrop-filter: blur(3px);
        }
        
        .modal-container {
          background-color: rgb(var(--color-bg-primary));
          border-radius: 0.5rem;
          padding: 1.5rem;
          width: 90%;
          max-width: 500px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(var(--color-primary), 0.2);
        }
        
        /* 收藏图标样式 */
        .favorite-icon {
          color: rgba(var(--color-text-tertiary));
          transition: color 0.2s ease-in-out;
        }
        
        .favorite-icon.active {
          color: rgb(var(--color-warning));
        }
      `}</style>

      {/* 使用 ToolHeader 组件 */}
      <ToolHeader
        toolCode="json_formatter"
        icon={faCode}
        title={t('tools.json_formatter.title')}
        description={t('tools.json_formatter.description')}
      />

      {/* 验证状态显示 */}
      <div className="text-center mb-4">
        {validationResult.message && !isLoading && (
          <span className={validationResult.isValid ? 'text-[rgb(var(--color-success))]' : 'text-[rgb(var(--color-error))]'}>
            {validationResult.message}
          </span>
        )}
        {isLoading && (
          <span className="flex items-center justify-center" style={{ color: 'rgb(var(--color-text-tertiary))' }}>
            <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-1" />
            <span>{isLargeJson ? t('tools.json_formatter.processing_large_json') : t('tools.json_formatter.parsing_json')}</span>
          </span>
        )}
      </div>

      {/* 工具栏 */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          className={actionButtonClass}
          onClick={toggleCompression}
        >
          <FontAwesomeIcon icon={isCompressed ? faExpand : faCompress} />
          <span>{isCompressed ? t('tools.json_formatter.beautify') : t('tools.json_formatter.compress')}</span>
        </button>
        <button
          className={actionButtonClass}
          onClick={toggleFoldable}
          disabled={!jsonOutput}
        >
          <FontAwesomeIcon icon={isFoldable ? faFolder : faFolderOpen} />
          <span>{isFoldable ? t('tools.json_formatter.normal_mode') : t('tools.json_formatter.fold_mode')}</span>
        </button>
        <button
          className={actionButtonClass}
          onClick={copyToClipboard}
          disabled={!jsonOutput}
        >
          <FontAwesomeIcon icon={copied ? faCheck : faCopy} />
          <span>{copied ? t('common.copySuccess') : t('tools.json_formatter.copy')}</span>
        </button>
        <button
          className={actionButtonClass}
          onClick={clearInput}
        >
          <FontAwesomeIcon icon={faTrash} />
          <span>{t('tools.json_formatter.clear')}</span>
        </button>
        <button
          className={actionButtonClass}
          onClick={loadExample}
        >
          <FontAwesomeIcon icon={faCode} />
          <span>{t('tools.json_formatter.load_example')}</span>
        </button>
        <button
          className={actionButtonClass}
          onClick={reformat}
          disabled={!jsonInput}
        >
          <FontAwesomeIcon icon={faSync} className={isLoading ? 'animate-spin' : ''} />
          <span>{isLoading ? t('tools.json_formatter.processing') : t('tools.json_formatter.reformat')}</span>
        </button>

        {/* 保存和历史记录按钮 */}
        <button
          className={actionButtonClass}
          onClick={() => setIsSaveModalOpen(true)}
          disabled={!jsonOutput}
        >
          <FontAwesomeIcon icon={faSave} />
          <span>{t('tools.json_formatter.save')}</span>
        </button>
        <button
          className={actionButtonClass}
          onClick={() => setIsHistoryOpen(true)}
        >
          <FontAwesomeIcon icon={faHistory} />
          <span>{t('tools.json_formatter.history')}</span>
        </button>

        {/* 移除斜杠按钮 */}
        <button
          className={actionButtonClass}
          onClick={removeSlashes}
          disabled={!jsonInput}
        >
          <FontAwesomeIcon icon={faEraser} />
          <span>{t('tools.json_formatter.remove_slash')}</span>
        </button>

        {/* 字符串转义按钮 */}
        <button
          className={actionButtonClass}
          onClick={escapeString}
          disabled={!jsonInput}
        >
          <FontAwesomeIcon icon={faCode} />
          <span>{t('tools.json_formatter.escape_string')}</span>
        </button>

        {/* 字符串反转义按钮 */}
        <button
          className={actionButtonClass}
          onClick={unescapeString}
          disabled={!jsonInput}
        >
          <FontAwesomeIcon icon={faSync} />
          <span>{t('tools.json_formatter.unescape_string')}</span>
        </button>
      </div>

      {/* 主内容区 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 flex-grow">
        {/* 输入区域 */}
        <div className="flex flex-col h-full">
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium" style={{ color: 'rgb(var(--color-text-secondary))' }}>{t('tools.json_formatter.input_json')}</label>
            <div className="text-xs" style={{ color: 'rgb(var(--color-text-tertiary))' }}>{t('tools.json_formatter.paste_json_here')}</div>
          </div>
          <div className="flex-grow flex flex-col">
            <textarea
              ref={jsonInputRef}
              className={getTextareaClasses(!!errorMessage) + " flex-grow"}
              value={jsonInput}
              onChange={handleInputChange}
              placeholder={t('tools.json_formatter.paste_json_placeholder')}
            />
            {errorMessage && (
              <pre className="mt-2 text-sm text-[rgb(var(--color-error))] whitespace-pre-wrap font-mono">{errorMessage}</pre>
            )}
            {notice && (
              <div className="mt-2 text-sm" style={{ color: 'rgb(var(--color-text-tertiary))' }}>{notice}</div>
            )}
          </div>
        </div>

        {/* 输出区域 */}
        <div className="flex flex-col h-full">
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium" style={{ color: 'rgb(var(--color-text-secondary))' }}>{t('tools.json_formatter.output')}</label>
            <div className="text-xs" style={{ color: 'rgb(var(--color-text-tertiary))' }}>
              {jsonOutput && !isLoading && `${jsonOutput.length.toLocaleString()} ${t('tools.json_formatter.characters')}`}
              {isLoading && (
                <span className="flex items-center">
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-1" />
                  <span>{isLargeJson ? t('tools.json_formatter.processing_large_json') : t('tools.json_formatter.processing')}</span>
                </span>
              )}
            </div>
          </div>
          <div className={outputAreaClasses}>
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center backdrop-blur-sm"
                style={{ backgroundColor: 'rgba(var(--color-bg-secondary), 0.7)' }}>
                <div className="flex flex-col items-center space-y-2">
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin text-2xl" style={{ color: 'rgb(var(--color-primary))' }} />
                  <span style={{ color: 'rgb(var(--color-text-secondary))' }} className="text-center">
                    {isLargeJson ?
                      t('tools.json_formatter.processing_large_json_message') :
                      t('tools.json_formatter.parsing_json')}
                  </span>
                </div>
              </div>
            ) : isFoldable ? (
              renderFoldableJson()
            ) : (
              <pre className="whitespace-pre-wrap m-0 text-base leading-7" style={{ color: 'rgb(var(--color-text-primary))' }}>{jsonOutput}</pre>
            )}
          </div>
        </div>
      </div>

      {/* JSONPath查询 */}
      <div className="mt-4 card p-4">
        <div className="mb-2">
          <label className="text-sm font-medium" style={{ color: 'rgb(var(--color-text-secondary))' }}>{t('tools.json_formatter.jsonpath_query')}</label>
          <div className="text-xs mt-1" style={{ color: 'rgb(var(--color-text-tertiary))' }}>
            {t('tools.json_formatter.enter_jsonpath')}
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <FontAwesomeIcon
                icon={faSearch}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: 'rgb(var(--color-text-tertiary))' }}
              />
              <input
                ref={jsonPathInputRef}
                type="text"
                value={jsonPath}
                onChange={handlePathChange}
                placeholder={t('tools.json_formatter.jsonpath_placeholder')}
                className="search-input pl-10"
                disabled={parsedJson === undefined}
              />
            </div>
          </div>
          <div className="flex-1">
            <div className="p-3 rounded-md min-h-[40px] text-sm"
              style={{
                backgroundColor: 'rgb(var(--color-bg-secondary))',
                color: 'rgb(var(--color-text-secondary))'
              }}>
              <pre className="whitespace-pre-wrap">{pathResult || t('tools.json_formatter.query_result_placeholder')}</pre>
            </div>
          </div>
        </div>
      </div>

      {/* 历史记录侧边栏 */}
      <div className={`history-overlay ${isHistoryOpen ? 'open' : ''}`} onClick={() => setIsHistoryOpen(false)}></div>
      <div className={`history-panel ${isHistoryOpen ? 'open' : ''}`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium" style={{ color: 'rgb(var(--color-text-primary))' }}>{t('tools.json_formatter.history')}</h3>
          <button
            className="p-2 rounded-full hover:bg-[rgba(var(--color-primary),0.1)]"
            onClick={() => setIsHistoryOpen(false)}
          >
            <FontAwesomeIcon icon={faTimes} style={{ color: 'rgb(var(--color-text-secondary))' }} />
          </button>
        </div>

        {historyItems.length === 0 ? (
          <div className="text-center py-8" style={{ color: 'rgb(var(--color-text-tertiary))' }}>
            <p>{t('tools.json_formatter.no_saved_records')}</p>
            <p className="text-sm mt-2">{t('tools.json_formatter.save_first_record')}</p>
          </div>
        ) : (
          <div>
            {/* 收藏的项目 */}
            {historyItems.some(item => item.isFavorite) && (
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2" style={{ color: 'rgb(var(--color-text-secondary))' }}>{t('tools.json_formatter.favorites')}</h4>
                {historyItems
                  .filter(item => item.isFavorite)
                  .map(renderHistoryItem)}
              </div>
            )}

            {/* 全部历史记录 */}
            <h4 className="text-sm font-medium mb-2" style={{ color: 'rgb(var(--color-text-secondary))' }}>{t('tools.json_formatter.all_history')}</h4>
            {historyItems.map(renderHistoryItem)}
          </div>
        )}
      </div>

      {/* 保存模态框 */}
      {isSaveModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container">
            <h3 className="text-lg font-medium mb-4" style={{ color: 'rgb(var(--color-text-primary))' }}>
              {editingItem ? t('tools.json_formatter.edit_saved_json') : t('tools.json_formatter.save_to_history')}
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                {t('tools.json_formatter.title')}
              </label>
              <input
                type="text"
                value={savingTitle}
                onChange={(e) => setSavingTitle(e.target.value)}
                placeholder={t('tools.json_formatter.enter_title')}
                className="search-input w-full"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded-md text-sm"
                style={{
                  backgroundColor: 'rgb(var(--color-bg-secondary))',
                  color: 'rgb(var(--color-text-secondary))'
                }}
                onClick={() => {
                  setIsSaveModalOpen(false);
                  setEditingItem(null);
                  setSavingTitle('');
                }}
              >
                {t('tools.json_formatter.cancel')}
              </button>
              <button
                className="px-4 py-2 rounded-md text-sm"
                style={{
                  backgroundColor: 'rgb(var(--color-primary))',
                  color: 'white'
                }}
                onClick={saveToHistory}
              >
                {editingItem ? t('tools.json_formatter.update') : t('tools.json_formatter.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 说明信息 */}
      <div className="mt-8 text-sm" style={{ color: 'rgb(var(--color-text-tertiary))' }}>
        <h3 className="mb-2 font-medium" style={{ color: 'rgb(var(--color-text-secondary))' }}>{t('tools.json_formatter.usage_guide')}</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>{t('tools.json_formatter.guide_1')}</li>
          <li>{t('tools.json_formatter.guide_2')}</li>
          <li>{t('tools.json_formatter.guide_3')}</li>
          <li>{t('tools.json_formatter.guide_4')}</li>
          <li>{t('tools.json_formatter.guide_5')}</li>
          <li>{t('tools.json_formatter.guide_6')}</li>
          <li>{t('tools.json_formatter.guide_7')}</li>
          <li>{t('tools.json_formatter.guide_8')}</li>
        </ul>
      </div>

      {/* 回到顶部按钮 */}
      <BackToTop position="bottom-right" offset={30} size="medium" />
    </div>
  );
} 