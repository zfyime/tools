'use client';

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFileCode, 
  faCopy, 
  faCheck, 
  faRedo, 
  faExchangeAlt,
  faInfoCircle,
  faEraser
} from '@fortawesome/free-solid-svg-icons';
import ToolHeader from '@/components/ToolHeader';
import BackToTop from '@/components/BackToTop';
import { useLanguage } from '@/context/LanguageContext';

// 添加CSS变量样式
const styles = {
  container: "min-h-screen flex flex-col max-w-[1440px] mx-auto p-4 md:p-6",
  card: "card p-6",
  textarea: "w-full h-64 p-3 bg-block border border-purple-glow rounded-lg text-primary focus:border-purple focus:outline-none focus:ring-1 focus:ring-purple transition-all font-mono resize-y",
  label: "text-sm text-secondary font-medium",
  error: "p-3 bg-red-900/20 border border-red-700/30 rounded-lg text-error",
  info: "text-sm text-tertiary",
  actionBtn: "btn-secondary flex items-center gap-2",
  actionBtnPrimary: "btn-primary flex items-center gap-2",
  loading: "text-purple animate-pulse",
  moduleLoading: "p-3 bg-purple-glow/10 border border-purple-glow/30 rounded-lg text-secondary",
  toggleBtn: "px-3 py-2 text-sm font-medium rounded-md transition-all",
  toggleBtnActive: "bg-[rgb(var(--color-primary))] text-[rgb(var(--color-bg-main))] shadow-sm border border-[var(--color-border)]",
  toggleBtnInactive: "btn-secondary",
  toggleContainer: "flex items-center rounded-md p-1 bg-block-strong",
  flexBetween: "flex flex-col sm:flex-row gap-4 justify-between items-center",
  exchangeBtn: "bg-purple-glow/10 text-purple p-2 rounded-full hover:bg-purple-glow/20 transition-colors",
};

// 添加全局接口，使marked和turndown可以在window上使用
declare global {
  interface Window {
    marked: {
      parse: (markdown: string, options?: Record<string, unknown>) => string;
      [key: string]: unknown;
    };
    TurndownService: {
      new (options?: Record<string, unknown>): {
        turndown: (html: string) => string;
        [key: string]: unknown;
      };
    };
  }
}

export default function HtmlMarkdownConverter() {
  const { t } = useLanguage();
  
  // 输入与输出
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'html2md' | 'md2html'>('md2html');
  
  // 其他状态
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [loadingModules, setLoadingModules] = useState(false);
  const [modulesLoaded, setModulesLoaded] = useState(false);

  // 动态加载marked和turndown库
  useEffect(() => {
    if (typeof window !== 'undefined' && !modulesLoaded) {
      setLoadingModules(true);
      
      const loadScripts = async () => {
        try {
          // 加载Marked库
          const markedScript = document.createElement('script');
          markedScript.src = '/lib/markdown/marked.min.js';
          markedScript.async = true;
          
          const markedPromise = new Promise<void>((resolve, reject) => {
            markedScript.onload = () => {
              console.log('Marked库加载成功');
              resolve();
            };
            markedScript.onerror = (error) => {
              console.error('加载本地Marked库失败，尝试从CDN加载:', error);
              // 从CDN加载失败时的备用方案
              const cdnMarkedScript = document.createElement('script');
              cdnMarkedScript.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
              cdnMarkedScript.async = true;
              
              cdnMarkedScript.onload = () => {
                console.log('从CDN加载Marked库成功');
                resolve();
              };
              
              cdnMarkedScript.onerror = (cdnError) => {
                console.error('从CDN加载Marked库失败:', cdnError);
                reject(new Error('加载Marked库失败'));
              };
              
              document.body.appendChild(cdnMarkedScript);
            };
          });
          
          document.body.appendChild(markedScript);
          
          // 加载Turndown库
          const turndownScript = document.createElement('script');
          turndownScript.src = '/lib/markdown/turndown.js';
          turndownScript.async = true;
          
          const turndownPromise = new Promise<void>((resolve, reject) => {
            turndownScript.onload = () => {
              console.log('Turndown库加载成功');
              resolve();
            };
            turndownScript.onerror = (error) => {
              console.error('加载本地Turndown库失败，尝试从CDN加载:', error);
              // 从CDN加载失败时的备用方案
              const cdnTurndownScript = document.createElement('script');
              cdnTurndownScript.src = 'https://cdn.jsdelivr.net/npm/turndown/dist/turndown.js';
              cdnTurndownScript.async = true;
              
              cdnTurndownScript.onload = () => {
                console.log('从CDN加载Turndown库成功');
                resolve();
              };
              
              cdnTurndownScript.onerror = (cdnError) => {
                console.error('从CDN加载Turndown库失败:', cdnError);
                reject(new Error('加载Turndown库失败'));
              };
              
              document.body.appendChild(cdnTurndownScript);
            };
          });
          
          document.body.appendChild(turndownScript);
          
          // 等待两个脚本都加载完成
          await Promise.all([markedPromise, turndownPromise]);
          console.log('所有模块加载完成!');
          setModulesLoaded(true);
          setLoadingModules(false);
        } catch (error) {
          console.error('加载库失败:', error);
          setError(t('tools.html_markdown_converter.error_load'));
          setLoadingModules(false);
        }
      };
      
      loadScripts();
    }
    
    return () => {
      // 清理函数不需要移除脚本，因为它们会一直被缓存和重用
    };
  }, [modulesLoaded, t]);

  // 转换函数
  const convertContent = () => {
    if (!input.trim()) {
      setError(t('tools.html_markdown_converter.error_empty'));
      setOutput('');
      return;
    }

    setIsConverting(true);
    setError(null);

    try {
      if (mode === 'md2html') {
        // Markdown 转 HTML
        const html = window.marked.parse(input);
        setOutput(html);
      } else {
        // HTML 转 Markdown
        const turndownService = new window.TurndownService({
          headingStyle: 'atx',
          codeBlockStyle: 'fenced'
        });
        const markdown = turndownService.turndown(input);
        setOutput(markdown);
      }
      setError(null);
    } catch (err) {
      console.error('转换错误:', err);
      const errorMsg = t('tools.html_markdown_converter.error_convert').replace(
        '{error}', 
        err instanceof Error ? err.message : t('tools.html_markdown_converter.error_unknown')
      );
      setError(errorMsg);
      setOutput('');
    } finally {
      setIsConverting(false);
    }
  };

  // 复制结果
  const copyResult = () => {
    if (!output) return;
    
    navigator.clipboard.writeText(output)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error(t('tools.html_markdown_converter.error_copy'), err);
        setError(t('tools.html_markdown_converter.error_copy'));
      });
  };

  // 切换转换模式
  const toggleMode = () => {
    // 切换模式时交换输入和输出
    setMode(prevMode => prevMode === 'md2html' ? 'html2md' : 'md2html');
    setInput(output);
    setOutput(input);
    setError(null);
  };

  // 清空所有内容
  const clearAll = () => {
    setInput('');
    setOutput('');
    setError(null);
  };

  // 加载示例
  const loadExample = () => {
    if (mode === 'md2html') {
      setInput(`# 示例标题

这是一段**粗体**文字和*斜体*文字。

## 子标题

- 列表项1
- 列表项2
- 列表项3

[这是一个链接](https://example.com)

\`\`\`javascript
// 这是一段代码
function hello() {
  console.log("Hello, world!");
}
\`\`\`

> 这是一段引用文字

---

| 表头1 | 表头2 |
|-------|-------|
| 单元格1 | 单元格2 |
| 单元格3 | 单元格4 |
`);
    } else {
      setInput(`<h1>示例标题</h1>
<p>这是一段<strong>粗体</strong>文字和<em>斜体</em>文字。</p>

<h2>子标题</h2>

<ul>
  <li>列表项1</li>
  <li>列表项2</li>
  <li>列表项3</li>
</ul>

<p><a href="https://example.com">这是一个链接</a></p>

<pre><code class="language-javascript">// 这是一段代码
function hello() {
  console.log("Hello, world!");
}
</code></pre>

<blockquote>
  <p>这是一段引用文字</p>
</blockquote>

<hr />

<table>
  <thead>
    <tr>
      <th>表头1</th>
      <th>表头2</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>单元格1</td>
      <td>单元格2</td>
    </tr>
    <tr>
      <td>单元格3</td>
      <td>单元格4</td>
    </tr>
  </tbody>
</table>`);
    }
    setOutput('');
    setError(null);
  };

  return (
    <div className={styles.container}>
      {/* 工具头部 */}
      <ToolHeader 
        toolCode="html_markdown_converter"
        icon={faFileCode}
        title=""
        description=""
      />
      
      {/* 主内容区域 */}
      <div className={styles.card}>
        <div className="space-y-6">
          {/* 转换模式切换 */}
          <div className={styles.flexBetween}>
            <div className={styles.toggleContainer}>
              <button
                className={`${styles.toggleBtn} ${mode === 'md2html' ? styles.toggleBtnActive : styles.toggleBtnInactive}`}
                onClick={() => setMode('md2html')}
              >
                {t('tools.html_markdown_converter.md2html')}
              </button>
              <button
                className={`${styles.toggleBtn} ${mode === 'html2md' ? styles.toggleBtnActive : styles.toggleBtnInactive}`}
                onClick={() => setMode('html2md')}
              >
                {t('tools.html_markdown_converter.html2md')}
              </button>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={loadExample}
                className={styles.actionBtn}
                disabled={loadingModules}
              >
                <FontAwesomeIcon icon={faRedo} />
                {t('tools.html_markdown_converter.load_example')}
              </button>
              
              <button
                onClick={clearAll}
                className={styles.actionBtn}
                disabled={!input && !output}
              >
                <FontAwesomeIcon icon={faEraser} />
                {t('tools.html_markdown_converter.clear')}
              </button>
            </div>
          </div>
          
          {/* 加载状态提示 */}
          {loadingModules && (
            <div className={styles.moduleLoading}>
              <FontAwesomeIcon icon={faInfoCircle} className="mr-2" />
              {t('tools.html_markdown_converter.loading_modules')}
            </div>
          )}
          
          {/* 输入输出区域 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 输入区域 */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className={styles.label}>
                  {mode === 'md2html' 
                    ? t('tools.html_markdown_converter.md_input')
                    : t('tools.html_markdown_converter.html_input')}
                </label>
              </div>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={mode === 'md2html' 
                  ? t('tools.html_markdown_converter.md_placeholder')
                  : t('tools.html_markdown_converter.html_placeholder')}
                className={styles.textarea}
                disabled={loadingModules}
              />
            </div>
            
            {/* 输出区域 */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <label className={styles.label}>
                    {mode === 'md2html' 
                      ? t('tools.html_markdown_converter.html_output')
                      : t('tools.html_markdown_converter.md_output')}
                  </label>
                  <button
                    onClick={toggleMode}
                    className={styles.exchangeBtn}
                    title={t('tools.html_markdown_converter.exchange')}
                    disabled={loadingModules}
                  >
                    <FontAwesomeIcon icon={faExchangeAlt} />
                  </button>
                </div>
                <div>
                  <button
                    onClick={convertContent}
                    className={styles.actionBtnPrimary}
                    disabled={!input || loadingModules || isConverting}
                  >
                    {isConverting 
                      ? t('tools.html_markdown_converter.converting')
                      : t('tools.html_markdown_converter.convert')}
                  </button>
                </div>
              </div>
              <textarea
                value={output}
                readOnly
                placeholder={mode === 'md2html' 
                  ? t('tools.html_markdown_converter.html_result_placeholder')
                  : t('tools.html_markdown_converter.md_result_placeholder')}
                className={styles.textarea}
              />
              
              {/* 复制按钮 */}
              {output && (
                <div className="flex justify-end">
                  <button
                    onClick={copyResult}
                    className={styles.actionBtn}
                  >
                    <FontAwesomeIcon icon={copied ? faCheck : faCopy} />
                    {copied 
                      ? t('tools.html_markdown_converter.copied')
                      : t('tools.html_markdown_converter.copy_result')}
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* 错误提示 */}
          {error && (
            <div className={styles.error}>
              <FontAwesomeIcon icon={faInfoCircle} className="mr-2" />
              {error}
            </div>
          )}
          
          {/* 说明部分 */}
          <div className="p-4 bg-block rounded-lg">
            <h3 className="text-primary font-medium mb-2">{t('tools.html_markdown_converter.feature_title')}</h3>
            <div className={styles.info}>
              <p className="mb-2">
                {t('tools.html_markdown_converter.feature_intro')}
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>{t('tools.html_markdown_converter.feature_1')}</li>
                <li>{t('tools.html_markdown_converter.feature_2')}</li>
                <li>{t('tools.html_markdown_converter.feature_3')}</li>
                <li>{t('tools.html_markdown_converter.feature_4')}</li>
              </ul>
              <p className="mt-2">
                {mode === 'md2html' 
                  ? t('tools.html_markdown_converter.md2html_description')
                  : t('tools.html_markdown_converter.html2md_description')}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* 回到顶部按钮 */}
      <BackToTop />
    </div>
  );
}
