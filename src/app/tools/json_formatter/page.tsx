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
  const [isCompressed, setIsCompressed] = useState<boolean>(false);
  const [isFoldable, setIsFoldable] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLargeJson, setIsLargeJson] = useState<boolean>(false);
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

  // 参考值，确保能在格式化过程中保持加载状态
  const processingRef = useRef<boolean>(false);

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
  }, [t]);

  // 保存历史记录到本地存储
  const saveHistoryToLocalStorage = (items: JsonHistoryItem[]) => {
    localStorage.setItem('json_formatter_history', JSON.stringify(items));
  };

  // 格式化JSON
  const formatJson = (json: string, compress = false) => {
    if (!json.trim()) {
      setJsonOutput('');
      setValidationResult({ isValid: false, message: '' });
      return;
    }

    // 检查JSON大小
    const isLarge = json.length > 100000;
    setIsLargeJson(isLarge);

    // 设置加载状态和处理参考值
    setIsLoading(true);
    processingRef.current = true;

    // 使用setTimeout确保UI先更新，但不添加不必要的延迟
    setTimeout(() => {
      try {
        // 处理可能的JS对象文本 (将单引号转为双引号)
        const processedJson = json
          .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":') // 键名标准化
          .replace(/'/g, '"'); // 单引号转双引号

        try {
          let parsed;
          try {
            parsed = JSON.parse(processedJson);
          } catch (e) {
            // 尝试使用eval处理JS对象（不安全，但为了更好的兼容性）
            try {
              // eslint-disable-next-line no-eval
              parsed = eval('(' + json + ')');
            } catch (/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
            _) {
              throw e; // 如果eval也失败了，抛出原始错误
            }
          }

          // 根据模式输出不同格式
          let formattedJson;
          if (compress) {
            formattedJson = JSON.stringify(parsed);
          } else {
            formattedJson = JSON.stringify(parsed, null, 2);
          }

          // 设置输出
          setJsonOutput(formattedJson);

          // 计算大小
          const sizeKB = (formattedJson.length / 1024).toFixed(1);
          const largeJsonMessage = t('tools.json_formatter.large_json_processed').replace('{size}', sizeKB);

          setValidationResult({
            isValid: true,
            message: isLarge ? largeJsonMessage : t('tools.json_formatter.json_valid')
          });
          setErrorMessage('');

          // 如果有JSONPath查询，执行查询
          if (jsonPath) {
            queryJsonPath(parsed, jsonPath);
          }

          // 完成后取消加载状态和处理参考值
          setIsLoading(false);
          processingRef.current = false;
        } catch (error) {
          if (error instanceof Error) {
            setErrorMessage(error.message);
            setValidationResult({ isValid: false, message: t('tools.json_formatter.json_invalid') });
            setIsLoading(false);
            processingRef.current = false;
          }
        }
      } catch (error) {
        if (error instanceof Error) {
          setErrorMessage(error.message);
          setValidationResult({ isValid: false, message: t('tools.json_formatter.json_invalid') });
          setIsLoading(false);
          processingRef.current = false;
        }
      }
    }, 0);
  };

  // 取消正在进行的格式化操作
  const cancelFormatting = () => {
    processingRef.current = false;
    setIsLoading(false);
  };

  // 清除组件卸载时可能的处理操作
  useEffect(() => {
    return () => {
      processingRef.current = false;
    };
  }, []);

  // 压缩/美化切换
  const toggleCompression = () => {
    setIsCompressed(!isCompressed);
    formatJson(jsonInput, !isCompressed);
  };

  // 切换折叠功能
  const toggleFoldable = () => {
    setIsFoldable(!isFoldable);
  };

  // 移除JSON中的转义斜杠
  const removeSlashes = () => {
    if (!jsonInput) return;

    try {
      // 直接在原始输入字符串上移除转义斜杠
      const processed = jsonInput.replace(/\\\/+/g, '/');

      // 检查是否有变化
      if (processed === jsonInput) {
        console.log('没有检测到需要替换的内容，JSON未改变');
        return;
      }

      console.log('移除斜杠前:', jsonInput);
      console.log('移除斜杠后:', processed);

      // 更新输入框而不是直接格式化
      setJsonInput(processed);

      // 手动触发格式化
      setTimeout(() => formatJson(processed, isCompressed), 100);
    } catch (error) {
      console.error('移除斜杠处理失败:', error);
    }
  };

  // 字符串转义
  const escapeString = () => {
    if (!jsonInput) return;

    try {
      // 将常见字符转义为JSON字符串中的格式
      const processed = jsonInput
        .replace(/\\/g, '\\\\')    // 先转义反斜杠
        .replace(/"/g, '\\"')      // 转义双引号
        .replace(/\n/g, '\\n')     // 转义换行符
        .replace(/\r/g, '\\r')     // 转义回车符
        .replace(/\t/g, '\\t')     // 转义制表符
        .replace(/\f/g, '\\f')     // 转义换页符
        .replace(/\b/g, '\\b');    // 转义退格符

      // 检查是否有变化
      if (processed === jsonInput) {
        console.log('没有检测到需要转义的内容');
        return;
      }

      // 更新输入框
      setJsonInput(processed);

      // 不需要立即格式化，因为用户可能还需要进一步编辑
    } catch (error) {
      console.error('字符串转义处理失败:', error);
    }
  };

  // 字符串反转义
  const unescapeString = () => {
    if (!jsonInput) return;

    try {
      // 将JSON字符串中的转义字符还原为原始字符
      const processed = jsonInput
        .replace(/\\"/g, '"')      // 反转义双引号
        .replace(/\\n/g, '\n')     // 反转义换行符
        .replace(/\\r/g, '\r')     // 反转义回车符
        .replace(/\\t/g, '\t')     // 反转义制表符
        .replace(/\\f/g, '\f')     // 反转义换页符
        .replace(/\\b/g, '\b')     // 反转义退格符
        .replace(/\\\\/g, '\\');   // 最后反转义反斜杠

      // 检查是否有变化
      if (processed === jsonInput) {
        console.log('没有检测到需要反转义的内容');
        return;
      }

      // 更新输入框
      setJsonInput(processed);

      // 不需要立即格式化，因为用户可能还需要进一步编辑
    } catch (error) {
      console.error('字符串反转义处理失败:', error);
    }
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
    // 如果正在处理，先取消
    if (isLoading) {
      cancelFormatting();
    }

    setJsonInput('');
    setJsonOutput('');
    setErrorMessage('');
    setValidationResult({ isValid: false, message: '' });
    setPathResult('');
    if (jsonInputRef.current) {
      jsonInputRef.current.focus();
    }
  };

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setJsonInput(value);
  };

  // 处理粘贴事件
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    // 获取粘贴的内容
    const pastedText = e.clipboardData.getData('text');
    if (pastedText && pastedText.trim().length > 0) {
      // 如果正在处理，先取消
      if (isLoading) {
        cancelFormatting();
      }

      // 更新输入内容
      setJsonInput(pastedText);
      // 立即设置加载状态但延迟执行格式化，确保UI更新
      setIsLoading(true);
      processingRef.current = true;
      setTimeout(() => formatJson(pastedText, isCompressed), 100);
    }
  };

  // 路径查询变化
  const handlePathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setJsonPath(value);

    // 如果有有效的JSON和路径，执行查询
    if (value && jsonOutput) {
      try {
        const parsed = JSON.parse(jsonOutput);
        queryJsonPath(parsed, value);
      } catch (/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
      _error) {
        // JSON解析错误，忽略
      }
    } else {
      setPathResult('');
    }
  };

  // 执行JSONPath查询
  const queryJsonPath = (json: Record<string, unknown>, path: string) => {
    if (!path) {
      setPathResult('');
      return;
    }

    try {
      // 简单的路径解析，支持点符号和方括号
      const segments = path
        .replace(/\[(\w+)\]/g, '.$1') // 将[abc]转换为.abc
        .replace(/^\./, '') // 移除开头的点
        .split('.');

      let result: unknown = json;

      for (const segment of segments) {
        if (typeof result === 'object' && result !== null && segment in result) {
          result = (result as Record<string, unknown>)[segment];
        } else {
          throw new Error(`路径 '${path}' 不存在`);
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
        setPathResult(`查询错误: ${error.message}`);
      }
    }
  };

  // 加载示例JSON
  const loadExample = () => {
    // 如果正在处理，先取消
    if (isLoading) {
      cancelFormatting();
    }

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
    setJsonInput(exampleJson);
    formatJson(exampleJson, isCompressed);
  };

  // 重新格式化
  const reformat = () => {
    // 如果正在处理，先取消
    if (isLoading) {
      cancelFormatting();
    }

    formatJson(jsonInput, isCompressed);
  };

  // 渲染可折叠的JSON
  const renderFoldableJson = (jsonStr: string) => {
    if (!jsonStr) return null;

    try {
      const jsonObj = JSON.parse(jsonStr);
      return (
        <div className="json-viewer-theme">
          <ReactJson
            value={jsonObj}
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
          />
        </div>
      );
    } catch (/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    _error) {
      // 如果解析失败，回退到普通模式
      return <pre className="whitespace-pre-wrap m-0">{jsonStr}</pre>;
    }
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

  // 历史记录项目样式
  const historyItemClass = "p-3 rounded-md border border-[rgba(var(--color-primary),0.15)] hover:border-[rgba(var(--color-primary),0.4)] transition-all cursor-pointer bg-[rgb(var(--color-bg-secondary))] flex justify-between items-center mb-2";

  // 自动格式化（仅在首次输入更改后）
  useEffect(() => {
    if (jsonInput) {
      formatJson(jsonInput, isCompressed);
    }
  }, []);

  // 保存当前JSON到历史记录
  const saveToHistory = () => {
    if (!jsonOutput || !jsonOutput.trim()) return;

    if (editingItem) {
      // 更新现有项目
      const updatedItem = {
        ...editingItem,
        title: savingTitle || `未命名 ${new Date().toLocaleString()}`,
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
        title: savingTitle || `未命名 ${new Date().toLocaleString()}`,
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
    setJsonInput(item.json);
    formatJson(item.json, isCompressed);
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
          className={`${toolbarButtonClass} bg-[rgb(var(--color-bg-secondary))] text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-text-primary))]`}
          onClick={toggleCompression}
          disabled={isLoading}
        >
          <FontAwesomeIcon icon={isCompressed ? faExpand : faCompress} />
          <span>{isCompressed ? t('tools.json_formatter.beautify') : t('tools.json_formatter.compress')}</span>
        </button>
        <button
          className={`${toolbarButtonClass} bg-[rgb(var(--color-bg-secondary))] text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-text-primary))]`}
          onClick={toggleFoldable}
          disabled={isLoading || !jsonOutput}
        >
          <FontAwesomeIcon icon={isFoldable ? faFolder : faFolderOpen} />
          <span>{isFoldable ? t('tools.json_formatter.normal_mode') : t('tools.json_formatter.fold_mode')}</span>
        </button>
        <button
          className={`${toolbarButtonClass} bg-[rgb(var(--color-bg-secondary))] text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-text-primary))]`}
          onClick={copyToClipboard}
          disabled={!jsonOutput || isLoading}
        >
          <FontAwesomeIcon icon={copied ? faCheck : faCopy} />
          <span>{copied ? t('common.copySuccess') : t('tools.json_formatter.copy')}</span>
        </button>
        <button
          className={`${toolbarButtonClass} bg-[rgb(var(--color-bg-secondary))] text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-text-primary))]`}
          onClick={clearInput}
          disabled={isLoading}
        >
          <FontAwesomeIcon icon={faTrash} />
          <span>{t('tools.json_formatter.clear')}</span>
        </button>
        <button
          className={`${toolbarButtonClass} bg-[rgb(var(--color-bg-secondary))] text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-text-primary))]`}
          onClick={loadExample}
          disabled={isLoading}
        >
          <FontAwesomeIcon icon={faCode} />
          <span>{t('tools.json_formatter.load_example')}</span>
        </button>
        <button
          className={`${toolbarButtonClass} bg-[rgb(var(--color-bg-secondary))] text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-text-primary))]`}
          onClick={reformat}
          disabled={!jsonInput || isLoading}
        >
          <FontAwesomeIcon icon={faSync} className={isLoading ? 'animate-spin' : ''} />
          <span>{isLoading ? t('tools.json_formatter.processing') : t('tools.json_formatter.reformat')}</span>
        </button>

        {/* 新增的保存和历史记录按钮 */}
        <button
          className={`${toolbarButtonClass} bg-[rgb(var(--color-bg-secondary))] text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-text-primary))]`}
          onClick={() => setIsSaveModalOpen(true)}
          disabled={!jsonOutput || isLoading}
        >
          <FontAwesomeIcon icon={faSave} />
          <span>{t('tools.json_formatter.save')}</span>
        </button>
        <button
          className={`${toolbarButtonClass} bg-[rgb(var(--color-bg-secondary))] text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-text-primary))]`}
          onClick={() => setIsHistoryOpen(true)}
        >
          <FontAwesomeIcon icon={faHistory} />
          <span>{t('tools.json_formatter.history')}</span>
        </button>

        {/* 移除斜杠按钮 */}
        <button
          className={`${toolbarButtonClass} bg-[rgb(var(--color-bg-secondary))] text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-text-primary))]`}
          onClick={removeSlashes}
          disabled={!jsonInput || isLoading}
        >
          <FontAwesomeIcon icon={faEraser} />
          <span>{t('tools.json_formatter.remove_slash')}</span>
        </button>

        {/* 字符串转义按钮 */}
        <button
          className={`${toolbarButtonClass} bg-[rgb(var(--color-bg-secondary))] text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-text-primary))]`}
          onClick={escapeString}
          disabled={!jsonInput || isLoading}
        >
          <FontAwesomeIcon icon={faCode} />
          <span>{t('tools.json_formatter.escape_string')}</span>
        </button>

        {/* 字符串反转义按钮 */}
        <button
          className={`${toolbarButtonClass} bg-[rgb(var(--color-bg-secondary))] text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-text-primary))]`}
          onClick={unescapeString}
          disabled={!jsonInput || isLoading}
        >
          <FontAwesomeIcon icon={faSync} />
          <span>{t('tools.json_formatter.unescape_string')}</span>
        </button>

        {isLoading && (
          <button
            className="px-3 py-1.5 rounded text-sm flex items-center gap-1 transition-all border"
            style={{
              backgroundColor: 'rgb(var(--color-bg-secondary))',
              color: 'rgb(var(--color-text-secondary))',
              borderColor: 'rgb(var(--color-primary))',
              opacity: 0.8
            }}
            onClick={cancelFormatting}
          >
            <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
            <span>{t('tools.json_formatter.cancel')}</span>
          </button>
        )}
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
              onBlur={() => jsonInput && !isLoading && formatJson(jsonInput, isCompressed)}
              onPaste={handlePaste}
              placeholder={t('tools.json_formatter.paste_json_placeholder')}
              disabled={isLoading}
            />
            {errorMessage && (
              <div className="mt-2 text-sm text-[rgb(var(--color-error))]">
                {errorMessage}
              </div>
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
                  <button
                    className="mt-3 px-3 py-1.5 text-xs rounded transition-all border"
                    style={{
                      backgroundColor: 'rgb(var(--color-bg-secondary))',
                      color: 'rgb(var(--color-text-secondary))',
                      borderColor: 'rgba(var(--color-primary), 0.5)'
                    }}
                    onClick={cancelFormatting}
                  >
                    {t('tools.json_formatter.cancel_processing')}
                  </button>
                </div>
              </div>
            ) : isFoldable ? (
              renderFoldableJson(jsonOutput)
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
                disabled={isLoading || !jsonOutput}
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
                  .map(item => (
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
                  ))}
              </div>
            )}

            {/* 全部历史记录 */}
            <h4 className="text-sm font-medium mb-2" style={{ color: 'rgb(var(--color-text-secondary))' }}>{t('tools.json_formatter.all_history')}</h4>
            {historyItems.map(item => (
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
            ))}
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