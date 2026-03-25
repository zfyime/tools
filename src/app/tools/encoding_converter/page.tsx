'use client';

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExchangeAlt, faCopy, faCheck, faSyncAlt, faEraser } from '@fortawesome/free-solid-svg-icons';
import ToolHeader from '@/components/ToolHeader';
import BackToTop from '@/components/BackToTop';
import tools from '@/config/tools';
import { useLanguage } from '@/context/LanguageContext';

// 添加CSS变量样式
const styles = {
  card: "card p-6",
  container: "min-h-screen flex flex-col max-w-[1440px] mx-auto p-4 md:p-6",
  typeBtnActive: "px-4 py-2 rounded-md transition-all bg-[rgb(var(--color-primary))] text-[rgb(var(--color-bg-main))] shadow-sm border border-[var(--color-border)]",
  typeBtnInactive: "px-4 py-2 rounded-md transition-all btn-secondary",
  toggleContainer: "flex items-center bg-block-strong rounded-md p-1",
  toggleBtnActive: "px-4 py-2 rounded-md transition-all bg-block text-primary shadow-sm",
  toggleBtnInactive: "px-4 py-2 rounded-md transition-all text-tertiary",
  description: "text-sm text-tertiary",
  textArea: "w-full h-48 p-3 bg-block border border-purple-glow rounded-lg text-primary focus:border-purple focus:outline-none focus:ring-1 focus:ring-purple resize-y font-mono",
  errorMsg: "py-2 px-3 bg-red-900/20 border border-red-700/30 text-error rounded-md",
  flexRow: "flex flex-col sm:flex-row gap-4 justify-between items-center",
  copyBtn: "flex items-center gap-1 px-3 py-1 text-sm rounded-md bg-block-strong hover:bg-block-hover text-secondary transition-colors",
  swapBtn: "bg-purple-glow/10 text-purple p-2 rounded-full hover:bg-purple-glow/20 transition-colors"
};

export default function EncodingConverter() {
  const { t } = useLanguage();
  
  // 从工具配置中获取当前工具图标
  const toolIcon = tools.find(tool => tool.code === 'encoding_converter')?.icon || faExchangeAlt;
  
  // 编码类型选项
  const encodingTypes = [
    { id: 'base64', name: 'Base64', description: t('tools.encoding_converter.base64_desc') },
    { id: 'url', name: 'URL', description: t('tools.encoding_converter.url_desc') },
    { id: 'unicode', name: 'Unicode', description: t('tools.encoding_converter.unicode_desc') },
    { id: 'html_entity', name: 'HTML实体编码', description: t('tools.encoding_converter.html_entity_desc') },
    { id: 'html_escape', name: 'HTML转义', description: t('tools.encoding_converter.html_escape_desc') }
  ];
  
  // 状态管理
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [encodingType, setEncodingType] = useState('base64');
  const [operation, setOperation] = useState('encode'); // 'encode' 或 'decode'
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  
  // 当输入文本、编码类型或操作变化时，自动执行转换
  useEffect(() => {
    if (inputText.trim() === '') {
      setOutputText('');
      setError('');
      return;
    }
    
    try {
      const result = processConversion(inputText, encodingType, operation);
      setOutputText(result);
      setError('');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(t('tools.encoding_converter.general_error'));
      }
      setOutputText('');
    }
  }, [inputText, encodingType, operation, t]);
  
  // 执行编码或解码操作
  const processConversion = (text: string, type: string, op: string): string => {
    if (text.trim() === '') return '';
    
    try {
      if (type === 'base64') {
        return op === 'encode' 
          ? btoa(encodeURIComponent(text).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode(parseInt(p1, 16))))
          : decodeURIComponent(Array.from(atob(text.replace(/\s/g, '')))
              .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join(''));
      } 
      else if (type === 'url') {
        return op === 'encode' 
          ? encodeURIComponent(text)
          : decodeURIComponent(text);
      }
      else if (type === 'unicode') {
        if (op === 'encode') {
          return Array.from(text)
            .map(char => '\\u' + char.charCodeAt(0).toString(16).padStart(4, '0'))
            .join('');
        } else {
          return text.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => 
            String.fromCharCode(parseInt(hex, 16))
          );
        }
      }
      else if (type === 'html_entity') {
        if (op === 'encode') {
          // 将文本转换为HTML十六进制实体格式 (&#x6C49;)
          return Array.from(text)
            .map(char => {
              const codePoint = char.codePointAt(0) as number;
              return '&#x' + codePoint.toString(16).toLowerCase() + ';';
            })
            .join('');
        } else {
          // 将HTML十六进制实体格式转换回文本
          // 正则表达式匹配 &#xXXXX; 格式的十六进制值
          return text.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => 
            String.fromCodePoint(parseInt(hex, 16))
          );
        }
      }
      else if (type === 'html_escape') {
        if (op === 'encode') {
          const el = document.createElement('div');
          el.textContent = text;
          return el.innerHTML;
        } else {
          const el = document.createElement('div');
          el.innerHTML = text;
          return el.textContent || '';
        }
      }
      
      throw new Error(t('tools.encoding_converter.unsupported_type'));
    } catch (err) {
      if (type === 'base64' && op === 'decode') {
        throw new Error(t('tools.encoding_converter.invalid_base64'));
      } else if (type === 'url' && op === 'decode') {
        throw new Error(t('tools.encoding_converter.invalid_url'));
      } else if (type === 'unicode' && op === 'decode') {
        throw new Error(t('tools.encoding_converter.invalid_unicode'));
      } else if (type === 'html_entity' && op === 'decode') {
        throw new Error(t('tools.encoding_converter.invalid_html_entity'));
      } else if (type === 'html_escape' && op === 'decode') {
        throw new Error(t('tools.encoding_converter.invalid_html_escape'));
      }
      throw err;
    }
  };
  
  // 复制输出内容到剪贴板
  const copyToClipboard = () => {
    if (!outputText) return;
    
    navigator.clipboard.writeText(outputText)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error(t('tools.encoding_converter.copy_failed'), err);
        setError(t('tools.encoding_converter.clipboard_error'));
      });
  };
  
  // 清空输入和输出
  const clearAll = () => {
    setInputText('');
    setOutputText('');
    setError('');
  };
  
  // 切换操作类型（编码/解码）
  const _toggleOperation = () => {
    // 添加动画过渡效果
    const container = document.getElementById('converter-container');
    if (container) {
      container.classList.add('animate-pulse');
      setTimeout(() => {
        container.classList.remove('animate-pulse');
      }, 300);
    }
    
    // 交换输入和输出文本
    const newOperation = operation === 'encode' ? 'decode' : 'encode';
    // 使用输出文本替换输入文本
    setInputText(outputText);
    setOperation(newOperation);
    setError('');
  };
  
  // 加载示例文本
  const loadExample = () => {
    const examples = {
      base64: {
        encode: t('tools.encoding_converter.example_text'), 
        decode: '5L2g5aW977yM5LiW55WM77yB'
      },
      url: {
        encode: 'https://jisuxiang.com?query=' + t('tools.encoding_converter.hello') + '&lang=zh-CN',
        decode: 'https%3A%2F%2Fjisuxiang.com%3Fquery%3D%E4%BD%A0%E5%A5%BD%26lang%3Dzh-CN'
      },
      unicode: {
        encode: t('tools.encoding_converter.example_text'),
        decode: '\\u4f60\\u597d\\uff0c\\u4e16\\u754c\\uff01'
      },
      html_entity: {
        encode: t('tools.encoding_converter.example_text'),
        decode: '&#x4f60;&#x597d;&#xff0c;&#x4e16;&#x754c;&#xff01;'
      },
      html_escape: {
        encode: '<div class="example">' + t('tools.encoding_converter.html_example') + '</div>',
        decode: '&lt;div class=&quot;example&quot;&gt;HTML示例 &amp; 特殊字符&lt;/div&gt;'
      }
    };
    
    // 根据当前编码类型和操作选择示例
    const exampleText = examples[encodingType as keyof typeof examples][operation as keyof typeof examples[keyof typeof examples]];
    setInputText(exampleText);
  };
  
  return (
    <div className={styles.container}>
      {/* 使用 ToolHeader 组件 */}
      <ToolHeader 
        toolCode="encoding_converter"
        title=""
        description=""
        icon={toolIcon}
      />
      
      {/* 主要内容区域 */}
      <div className={styles.card} id="converter-container">
        <div className="space-y-6">
          {/* 编码类型选择 */}
          <div className="flex flex-wrap gap-2">
            {encodingTypes.map((type) => (
              <button
                key={type.id}
                className={encodingType === type.id ? styles.typeBtnActive : styles.typeBtnInactive}
                onClick={() => setEncodingType(type.id)}
              >
                {type.name}
              </button>
            ))}
          </div>
          
          {/* 操作类型切换 */}
          <div className={styles.flexRow}>
            <div className="flex items-center gap-4">
              <div className={styles.toggleContainer}>
                <button
                  className={operation === 'encode' ? styles.toggleBtnActive : styles.toggleBtnInactive}
                  onClick={() => setOperation('encode')}
                >
                  {t('tools.encoding_converter.encode')}
                </button>
                <button
                  className={operation === 'decode' ? styles.toggleBtnActive : styles.toggleBtnInactive}
                  onClick={() => setOperation('decode')}
                >
                  {t('tools.encoding_converter.decode')}
                </button>
              </div>
              
              <div className={styles.description}>
                {encodingTypes.find(type => type.id === encodingType)?.description}
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                className="btn-secondary"
                onClick={loadExample}
              >
                <FontAwesomeIcon icon={faSyncAlt} className="mr-2" />
                {t('tools.encoding_converter.load_example')}
              </button>
              <button
                className="btn-secondary"
                onClick={clearAll}
              >
                <FontAwesomeIcon icon={faEraser} className="mr-2" />
                {t('tools.encoding_converter.clear_all')}
              </button>
            </div>
          </div>
          
          {/* 输入输出区域 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 输入框 */}
            <div className="space-y-2">
              <label className="block text-sm text-secondary font-medium">
                {operation === 'encode' ? t('tools.encoding_converter.text_to_encode') : t('tools.encoding_converter.text_to_decode')}
              </label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={t('tools.encoding_converter.input_placeholder')}
                className={styles.textArea}
              />
            </div>
            
            {/* 输出框 */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-sm text-secondary font-medium">
                  {operation === 'encode' ? t('tools.encoding_converter.encoded_result') : t('tools.encoding_converter.decoded_result')}
                </label>
              </div>
              
              <div className="relative">
                <textarea
                  value={outputText}
                  readOnly
                  placeholder={t('tools.encoding_converter.output_placeholder')}
                  className={styles.textArea}
                />
                
                {outputText && (
                  <button
                    onClick={copyToClipboard}
                    className="absolute top-3 right-3 opacity-70 hover:opacity-100 transition-opacity"
                  >
                    <FontAwesomeIcon icon={copied ? faCheck : faCopy} />
                  </button>
                )}
              </div>
              
              {/* 错误信息 */}
              {error && (
                <div className={styles.errorMsg}>
                  {error}
                </div>
              )}
              
              {/* 复制按钮 */}
              {outputText && (
                <div className="flex justify-end">
                  <button
                    onClick={copyToClipboard}
                    className={styles.copyBtn}
                  >
                    <FontAwesomeIcon icon={copied ? faCheck : faCopy} />
                    <span>{copied ? t('common.copySuccess') : t('tools.encoding_converter.copy')}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* 说明部分 */}
          <div className="mt-6 p-4 bg-block rounded-lg">
            <h3 className="text-md font-medium text-primary mb-2">编码说明</h3>
            <p className="text-sm text-tertiary">
              {encodingType === 'base64' && (
                "Base64是一种基于64个可打印字符来表示二进制数据的表示方法，常用于在HTTP环境下传输二进制数据，如图片或其他媒体文件。"
              )}
              {encodingType === 'url' && (
                "URL编码将字符转换为可在URL中安全传输的格式，例如将空格转换为%20，中文和特殊字符也会被转换为%后跟十六进制值。"
              )}
              {encodingType === 'unicode' && (
                "Unicode编码使用\\u前缀后跟四位十六进制数字表示字符，可以表示几乎所有语言的字符，如中文、日文等。"
              )}
              {encodingType === 'html_entity' && (
                "HTML实体编码使用十六进制实体格式（如&#x6C49;）表示Unicode字符，每个字符转换为对应的码点十六进制值。"
              )}
              {encodingType === 'html_escape' && (
                "HTML转义将特殊字符（如<、>、&等）转换为HTML实体，以防止它们被浏览器解释为HTML标签或特殊结构。"
              )}
            </p>
          </div>
        </div>
      </div>
      
      {/* 回到顶部按钮 */}
      <BackToTop />
    </div>
  );
} 