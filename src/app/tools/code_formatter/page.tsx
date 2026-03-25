'use client';

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileCode, faCopy, faCheck, faRedo, faDownload, faExclamationTriangle, faInfoCircle, faCode } from '@fortawesome/free-solid-svg-icons';
import ToolHeader from '@/components/ToolHeader';
import { useLanguage } from '@/context/LanguageContext';
// 删除未使用的导入
// import BackToTop from '@/components/BackToTop';
// import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
// import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
// import tools from '@/config/tools';

// 添加CSS变量样式
const _styles = {
  container: "min-h-screen flex flex-col max-w-[1440px] mx-auto p-4 md:p-6",
  card: "card p-6",
  textarea: "w-full h-64 p-3 bg-block border border-purple-glow rounded-lg text-primary focus:border-purple focus:outline-none focus:ring-1 focus:ring-purple transition-all font-mono resize-y",
  label: "text-sm text-secondary font-medium",
  error: "p-3 bg-red-900/20 border border-red-700/30 rounded-lg text-error",
  info: "text-sm text-tertiary",
  success: "p-3 bg-green-900/20 border border-green-700/30 rounded-lg text-success",
  actionBtn: "btn-secondary flex items-center gap-2",
  actionBtnPrimary: "btn-primary flex items-center gap-2",
  loading: "text-purple animate-pulse",
  tabButton: "px-3 py-2 text-sm font-medium rounded-md transition-all",
  tabButtonActive: "bg-[rgb(var(--color-primary))] text-[rgb(var(--color-bg-main))] shadow-sm border border-[var(--color-border)]",
  tabButtonInactive: "btn-secondary",
  tabContainer: "flex items-center rounded-md p-1 bg-block-strong",
  flexBetween: "flex flex-col sm:flex-row gap-4 justify-between items-center",
  highlighter: "rounded-lg overflow-hidden text-sm font-mono border border-purple-glow/10",
};

// 代码语言类型
type CodeLanguage = 
  | 'javascript'
  | 'typescript'
  | 'jsx'
  | 'tsx'
  | 'html'
  | 'css'
  | 'json'
  | 'markdown'
  | 'yaml'
  | 'graphql'
  | 'sql';

// 语言配置
const languages: { [key in CodeLanguage]: { name: string; parser: string; tabWidth: number } } = {
  javascript: { name: 'JavaScript', parser: 'babel', tabWidth: 2 },
  typescript: { name: 'TypeScript', parser: 'typescript', tabWidth: 2 },
  jsx: { name: 'JSX', parser: 'babel', tabWidth: 2 },
  tsx: { name: 'TSX', parser: 'typescript', tabWidth: 2 },
  html: { name: 'HTML', parser: 'html', tabWidth: 2 },
  css: { name: 'CSS', parser: 'css', tabWidth: 2 },
  json: { name: 'JSON', parser: 'json', tabWidth: 2 },
  markdown: { name: 'Markdown', parser: 'markdown', tabWidth: 2 },
  yaml: { name: 'YAML', parser: 'yaml', tabWidth: 2 },
  graphql: { name: 'GraphQL', parser: 'graphql', tabWidth: 2 },
  sql: { name: 'SQL', parser: 'sql', tabWidth: 2 },
};

// 格式化选项
interface FormatOptions {
  printWidth: number;
  tabWidth: number;
  useTabs: boolean;
  semi: boolean;
  singleQuote: boolean;
  trailingComma: 'none' | 'es5' | 'all';
  bracketSpacing: boolean;
  arrowParens: 'avoid' | 'always';
  proseWrap: 'always' | 'never' | 'preserve';
}

// 添加全局接口，使prettier可以在window上使用
declare global {
  interface Window {
    prettier: {
      format: (source: string, options: Record<string, unknown>) => string;
      [key: string]: unknown;
    };
    prettierPlugins: {
      [key: string]: unknown;
    };
  }
}

// prettier解析器映射 (这是实际会用到的映射)
const _parserMapping: Record<string, string> = {
  javascript: 'babel',
  typescript: 'typescript',
  html: 'html',
  css: 'css',
  json: 'json',
  xml: 'xml',
  sql: 'sql',
  java: 'java',
  python: 'python',
  cpp: 'cpp',
  csharp: 'csharp',
  php: 'php',
  yaml: 'yaml',
  markdown: 'markdown',
  jsx: 'babel',
  golang: 'go',
  bash: 'bash',
  rust: 'rust'
};

// 加载prettier和对应插件的脚本映射
const _scriptMapping: Record<string, string[]> = {
  javascript: ['/lib/prettier/standalone.js', '/lib/prettier/parser-babel.js'],
  typescript: ['/lib/prettier/standalone.js', '/lib/prettier/parser-typescript.js'],
  html: ['/lib/prettier/standalone.js', '/lib/prettier/parser-html.js'],
  css: ['/lib/prettier/standalone.js', '/lib/prettier/parser-postcss.js'],
  json: ['/lib/prettier/standalone.js', '/lib/prettier/parser-babel.js'],
  xml: ['/lib/prettier/standalone.js', '/lib/prettier/parser-xml.js'],
  sql: ['/lib/prettier/standalone.js', '/lib/prettier/parser-sql.js'],
  java: ['/lib/prettier/standalone.js', '/lib/prettier/parser-java.js'],
  python: ['/lib/prettier/standalone.js', '/lib/prettier/parser-python.js'],
  cpp: ['/lib/prettier/standalone.js', '/lib/prettier/parser-cpp.js'],
  csharp: ['/lib/prettier/standalone.js', '/lib/prettier/parser-csharp.js'],
  php: ['/lib/prettier/standalone.js', '/lib/prettier/parser-php.js'],
  yaml: ['/lib/prettier/standalone.js', '/lib/prettier/parser-yaml.js'],
  markdown: ['/lib/prettier/standalone.js', '/lib/prettier/parser-markdown.js'],
  jsx: ['/lib/prettier/standalone.js', '/lib/prettier/parser-babel.js'],
  golang: ['/lib/prettier/standalone.js', '/lib/prettier/parser-go.js'],
  bash: ['/lib/prettier/standalone.js', '/lib/prettier/parser-bash.js'],
  rust: ['/lib/prettier/standalone.js', '/lib/prettier/parser-rust.js']
};

// CDN备选地址 (保留，以便后续按需加载)
const _cdnScriptMapping: Record<string, string[]> = {
  javascript: [
    'https://cdn.jsdelivr.net/npm/prettier@2.8.8/standalone.js',
    'https://cdn.jsdelivr.net/npm/prettier@2.8.8/parser-babel.js'
  ],
  typescript: [
    'https://cdn.jsdelivr.net/npm/prettier@2.8.8/standalone.js',
    'https://cdn.jsdelivr.net/npm/prettier@2.8.8/parser-typescript.js'
  ],
  html: [
    'https://cdn.jsdelivr.net/npm/prettier@2.8.8/standalone.js',
    'https://cdn.jsdelivr.net/npm/prettier@2.8.8/parser-html.js'
  ],
  css: [
    'https://cdn.jsdelivr.net/npm/prettier@2.8.8/standalone.js',
    'https://cdn.jsdelivr.net/npm/prettier@2.8.8/parser-postcss.js'
  ],
  json: [
    'https://cdn.jsdelivr.net/npm/prettier@2.8.8/standalone.js',
    'https://cdn.jsdelivr.net/npm/prettier@2.8.8/parser-babel.js'
  ],
  yaml: [
    'https://cdn.jsdelivr.net/npm/prettier@2.8.8/standalone.js',
    'https://cdn.jsdelivr.net/npm/prettier@2.8.8/parser-yaml.js'
  ],
  markdown: [
    'https://cdn.jsdelivr.net/npm/prettier@2.8.8/standalone.js',
    'https://cdn.jsdelivr.net/npm/prettier@2.8.8/parser-markdown.js'
  ],
  jsx: [
    'https://cdn.jsdelivr.net/npm/prettier@2.8.8/standalone.js',
    'https://cdn.jsdelivr.net/npm/prettier@2.8.8/parser-babel.js'
  ],
  tsx: [
    'https://cdn.jsdelivr.net/npm/prettier@2.8.8/standalone.js',
    'https://cdn.jsdelivr.net/npm/prettier@2.8.8/parser-typescript.js'
  ],
  graphql: [
    'https://cdn.jsdelivr.net/npm/prettier@2.8.8/standalone.js',
    'https://cdn.jsdelivr.net/npm/prettier@2.8.8/parser-graphql.js'
  ]
};

export default function CodeFormatter() {
  const { t } = useLanguage();
  // 输入与输出
  const [inputCode, setInputCode] = useState('');
  const [outputCode, setOutputCode] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<CodeLanguage>('javascript');
  
  // 格式化选项 - 使用默认值，不再提供UI界面修改
  const [formatOptions, setFormatOptions] = useState<FormatOptions>({
    printWidth: 80,
    tabWidth: 2,
    useTabs: false,
    semi: true,
    singleQuote: false,
    trailingComma: 'es5',
    bracketSpacing: true,
    arrowParens: 'always',
    proseWrap: 'preserve',
  });
  
  // 其他状态
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);
  const [loadingModules, setLoadingModules] = useState(false);
  const [prettierLoaded, setPrettierLoaded] = useState(false);
  const [fileMissingWarning, setFileMissingWarning] = useState<string | null>(null);

  // 检查Prettier所需的文件是否存在
  useEffect(() => {
    // 检查核心库
    fetch('/lib/prettier/standalone.js')
      .then(res => {
        if (!res.ok) {
          setFileMissingWarning(t('tools.code_formatter.warning_missing_files'));
        }
      })
      .catch(() => {
        setFileMissingWarning(t('tools.code_formatter.warning_missing_files'));
      });
  }, [t]);

  // 动态加载Prettier库
  useEffect(() => {
    if (typeof window === 'undefined' || prettierLoaded) return;
    
    setLoadingModules(true);
    
    // 检查Prettier全局对象是否已存在
    if (window.prettier && window.prettierPlugins) {
      console.log('Prettier已加载，使用已有实例');
      setPrettierLoaded(true);
      setLoadingModules(false);
      return;
    }
    
    // 动态创建脚本标签加载prettier库
    const loadPrettier = () => {
      // 创建prettier核心脚本
      const prettierScript = document.createElement('script');
      prettierScript.src = '/lib/prettier/standalone.js';
      prettierScript.async = true;
      prettierScript.onload = () => {
        console.log(t('tools.code_formatter.prettier_core_loaded'));
        
        // 创建babel解析器脚本（也包含estree插件）
        const babelScript = document.createElement('script');
        babelScript.src = '/lib/prettier/parser-babel.js';
        babelScript.async = true;
        babelScript.onload = () => {
          console.log(t('tools.code_formatter.babel_parser_loaded'));
          
          // 创建html解析器脚本
          const htmlScript = document.createElement('script');
          htmlScript.src = '/lib/prettier/parser-html.js';
          htmlScript.async = true;
          htmlScript.onload = () => {
            console.log(t('tools.code_formatter.html_parser_loaded'));
            
            // 创建postcss解析器脚本
            const cssScript = document.createElement('script');
            cssScript.src = '/lib/prettier/parser-postcss.js';
            cssScript.async = true;
            cssScript.onload = () => {
              console.log(t('tools.code_formatter.css_parser_loaded'));
              
              // 创建typescript解析器脚本
              const tsScript = document.createElement('script');
              tsScript.src = '/lib/prettier/parser-typescript.js';
              tsScript.async = true;
              tsScript.onload = () => {
                console.log(t('tools.code_formatter.typescript_parser_loaded'));
                
                // 创建markdown解析器脚本
                const mdScript = document.createElement('script');
                mdScript.src = '/lib/prettier/parser-markdown.js';
                mdScript.async = true;
                mdScript.onload = () => {
                  console.log(t('tools.code_formatter.markdown_parser_loaded'));
                  
                  // 创建yaml解析器脚本
                  const yamlScript = document.createElement('script');
                  yamlScript.src = '/lib/prettier/parser-yaml.js';
                  yamlScript.async = true;
                  yamlScript.onload = () => {
                    console.log(t('tools.code_formatter.yaml_parser_loaded'));
                    
                    // 创建graphql解析器脚本
                    const graphqlScript = document.createElement('script');
                    graphqlScript.src = '/lib/prettier/parser-graphql.js';
                    graphqlScript.async = true;
                    graphqlScript.onload = () => {
                      console.log(t('tools.code_formatter.graphql_parser_loaded'));
                      
                      // 所有脚本加载完成
                      console.log(t('tools.code_formatter.all_modules_loaded'));
                      setPrettierLoaded(true);
                      setLoadingModules(false);
                    };
                    document.body.appendChild(graphqlScript);
                  };
                  document.body.appendChild(yamlScript);
                };
                document.body.appendChild(mdScript);
              };
              document.body.appendChild(tsScript);
            };
            document.body.appendChild(cssScript);
          };
          document.body.appendChild(htmlScript);
        };
        document.body.appendChild(babelScript);
      };
      
      prettierScript.onerror = (error) => {
        console.error(t('tools.code_formatter.load_error'), error);
        setError(t('tools.code_formatter.load_failed'));
        setLoadingModules(false);
      };
      
      document.body.appendChild(prettierScript);
    }
    
    // 调用加载函数
    loadPrettier();
    
    return () => {
      // 清理函数不需要移除脚本，因为它们会一直被缓存和重用
    };
  }, [prettierLoaded, t]);

  // 语言改变时更新 tabWidth
  useEffect(() => {
    // 根据语言自动设置tabWidth
    setFormatOptions(prev => ({
      ...prev,
      tabWidth: languages[selectedLanguage].tabWidth,
    }));
  }, [selectedLanguage]);

  // 格式化代码函数
  const formatCode = async () => {
    if (!inputCode.trim()) {
      setError(t('tools.code_formatter.error_empty_input'));
      setOutputCode('');
      return;
    }

    setIsFormatting(true);
    setError(null);

    try {
      // 确保在客户端环境
      if (typeof window === 'undefined') {
        throw new Error(t('tools.code_formatter.error_browser_only'));
      }

      // 确保prettier已加载
      if (!window.prettier || !window.prettierPlugins) {
        throw new Error(t('tools.code_formatter.error_library_loading'));
      }

      // 获取当前语言的解析器
      const parser = languages[selectedLanguage]?.parser;
      
      if (!parser) {
        throw new Error(t('tools.code_formatter.error_unsupported_language').replace('{language}', selectedLanguage));
      }
      
      // 处理特殊情况
      let actualParser = parser;
      if (parser === 'json') {
        actualParser = 'json';
      }
      
      // SQL格式化特殊处理，使用babel解析器
      if (parser === 'sql') {
        try {
          // 简单的SQL格式化处理
          const sqlFormatter = inputCode
            .replace(/\s+/g, ' ')
            .replace(/\(\s+/g, '(')
            .replace(/\s+\)/g, ')')
            .replace(/\s*,\s*/g, ', ')
            .replace(/\s*=\s*/g, ' = ')
            .replace(/\s*>\s*/g, ' > ')
            .replace(/\s*<\s*/g, ' < ')
            .replace(/\s*>\s*=\s*/g, ' >= ')
            .replace(/\s*<\s*=\s*/g, ' <= ')
            .replace(/\s*!=\s*/g, ' != ')
            .replace(/\s*<>\s*/g, ' <> ')
            .replace(/SELECT/gi, 'SELECT\n  ')
            .replace(/FROM/gi, '\nFROM\n  ')
            .replace(/WHERE/gi, '\nWHERE\n  ')
            .replace(/GROUP BY/gi, '\nGROUP BY\n  ')
            .replace(/HAVING/gi, '\nHAVING\n  ')
            .replace(/ORDER BY/gi, '\nORDER BY\n  ')
            .replace(/LIMIT/gi, '\nLIMIT ')
            .replace(/JOIN/gi, '\nJOIN\n  ')
            .replace(/UNION/gi, '\n\nUNION\n\n')
            .replace(/INSERT INTO/gi, 'INSERT INTO\n  ')
            .replace(/VALUES/gi, '\nVALUES\n  ')
            .replace(/UPDATE/gi, 'UPDATE\n  ')
            .replace(/SET/gi, '\nSET\n  ')
            .replace(/DELETE FROM/gi, 'DELETE FROM\n  ')
            .replace(/CREATE TABLE/gi, 'CREATE TABLE\n  ')
            .replace(/ALTER TABLE/gi, 'ALTER TABLE\n  ')
            .replace(/DROP TABLE/gi, 'DROP TABLE\n  ')
            .replace(/AND/gi, '\n  AND')
            .replace(/OR/gi, '\n  OR')
            .replace(/ON/gi, '\n  ON')
            .replace(/\n\s*\n/g, '\n')
            .trim();
            
          setOutputCode(sqlFormatter);
          return;
        } catch (sqlError) {
          console.error('SQL格式化错误:', sqlError);
        }
      }
      
      try {
        console.log(t('tools.code_formatter.using_parser'), actualParser);
        console.log(t('tools.code_formatter.available_plugins'), Object.keys(window.prettierPlugins));
        
        // 使用全局prettier对象格式化代码
        let formattedCode = '';
        
        // 格式化选项
        const options = {
          parser: actualParser,
          plugins: window.prettierPlugins,
          printWidth: formatOptions.printWidth,
          tabWidth: formatOptions.tabWidth,
          useTabs: formatOptions.useTabs,
          semi: formatOptions.semi,
          singleQuote: formatOptions.singleQuote,
          trailingComma: formatOptions.trailingComma,
          bracketSpacing: formatOptions.bracketSpacing,
          arrowParens: formatOptions.arrowParens,
          proseWrap: formatOptions.proseWrap
        };
        
        formattedCode = window.prettier.format(inputCode, options);
        
        // 更新输出
        setOutputCode(formattedCode);
      } catch (prettierError) {
        console.error(t('tools.code_formatter.prettier_error_log'), prettierError);
        throw new Error(t('tools.code_formatter.error_prettier').replace('{message}', (prettierError as Error)?.message || t('tools.code_formatter.error_initialization')));
      }
    } catch (err) {
      console.error(t('tools.code_formatter.error_formatting').replace('{message}', 'Error'), err);
      setError(t('tools.code_formatter.error_formatting').replace('{message}', (err as Error).message || t('tools.code_formatter.error_unknown')));
      setOutputCode('');
    } finally {
      setIsFormatting(false);
    }
  };

  // 复制格式化后的代码
  const copyFormattedCode = () => {
    if (!outputCode) return;
    
    navigator.clipboard.writeText(outputCode)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => console.error(t('tools.code_formatter.copy_failed'), err));
  };

  // 下载格式化后的代码
  const downloadFormattedCode = () => {
    if (!outputCode) return;
    
    // 确定文件扩展名
    let extension = '.txt';
    switch (selectedLanguage) {
      case 'javascript':
        extension = '.js';
        break;
      case 'typescript':
        extension = '.ts';
        break;
      case 'jsx':
        extension = '.jsx';
        break;
      case 'tsx':
        extension = '.tsx';
        break;
      case 'html':
        extension = '.html';
        break;
      case 'css':
        extension = '.css';
        break;
      case 'json':
        extension = '.json';
        break;
      case 'markdown':
        extension = '.md';
        break;
      case 'yaml':
        extension = '.yaml';
        break;
      case 'graphql':
        extension = '.graphql';
        break;
      case 'sql':
        extension = '.sql';
        break;
    }
    
    // 创建并下载文件
    const blob = new Blob([outputCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `formatted_code${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 清除所有内容
  const clearAll = () => {
    setInputCode('');
    setOutputCode('');
    setError(null);
  };

  // 示例代码
  const getExampleCode = () => {
    switch (selectedLanguage) {
      case 'javascript':
        return `function add(a,b) {return a+b;}\nconst x={foo:"bar",baz:42,qux:true};\nconsole.log(add(1,2));`;
      case 'typescript':
        return `function greet(name: string): string {return "Hello, " + name;}\ninterface User {id: number; name: string; isActive: boolean;}\nconst user: User = {id: 1,name: "John",isActive: true};`;
      case 'jsx':
        return `function App() {return (<div className="container"><header><h1>Hello World</h1></header><main><p>Welcome to my app</p></main></div>);}`;
      case 'tsx':
        return `interface Props {name: string;}\nfunction Greeting({name}: Props) {return <h1>Hello, {name}!</h1>;}\nconst App = () => (<div><Greeting name="World" /><p>Welcome to TypeScript and React</p></div>);`;
      case 'html':
        return `<!DOCTYPE html><html><head><title>Document</title></head><body><div><h1>Hello World</h1><p>This is a paragraph</p></div></body></html>`;
      case 'css':
        return `.container { width: 100%; max-width: 1200px; margin: 0 auto; }\n.header { background-color: #f0f0f0; padding: 20px; }\n.button { display: inline-block; padding: 10px 15px; background: #4285f4; color: white; border-radius: 4px; }`;
      case 'json':
        return `{"name":"John","age":30,"isStudent":false,"courses":["Math","English","Science"],"address":{"street":"123 Main St","city":"Anytown","zip":"12345"}}`;
      case 'markdown':
        return `# Heading\n## Subheading\nThis is a paragraph with **bold** and *italic* text.\n- List item 1\n- List item 2\n> This is a blockquote.\n\`\`\`\ncode block\n\`\`\``;
      case 'yaml':
        return `server:\n  port: 8080\n  host: localhost\ndatabase:\n  url: jdbc:mysql://localhost:3306/mydb\n  username: root\n  password: secret\nlogging:\n  level: INFO`;
      case 'graphql':
        return `type Query {\n  user(id: ID!): User\n  users: [User!]!\n}\n\ntype User {\n  id: ID!\n  name: String!\n  email: String\n  posts: [Post!]\n}\n\ntype Post {\n  id: ID!\n  title: String!\n  content: String\n  author: User!\n}`;
      case 'sql':
        return `SELECT u.id, u.name, u.email, COUNT(o.id) as order_count FROM users u LEFT JOIN orders o ON u.id = o.user_id WHERE u.status = 'active' AND o.created_at >= '2023-01-01' GROUP BY u.id, u.name, u.email HAVING COUNT(o.id) > 0 ORDER BY order_count DESC LIMIT 10;`;
      default:
        return `// 请输入要格式化的代码`;
    }
  };

  // 加载示例代码
  const loadExample = () => {
    setInputCode(getExampleCode());
    setOutputCode('');
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col max-w-[1440px] mx-auto p-4 md:p-6">
      <ToolHeader 
        title={t('tools.code_formatter.title')}
        description={t('tools.code_formatter.description')}
        icon={faFileCode}
        toolCode="code_formatter"
      />
      
      {/* 主内容区 */}
      <div className="space-y-6">
        {/* 控制面板 */}
        <div className="card p-4 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-4">
              <h2 className="text-md font-medium text-primary">{t('tools.code_formatter.title')}</h2>
              
              {/* 语言选择 */}
              <div className="relative">
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value as CodeLanguage)}
                  className="bg-block text-primary border border-purple-glow/30 rounded-md px-3 py-1.5 text-sm appearance-none pr-8"
                >
                  {Object.entries(languages).map(([key, { name }]) => (
                    <option key={key} value={key}>{name}</option>
                  ))}
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-tertiary">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 11l-4-4h8l-4 4z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                className="btn-secondary text-xs px-3 py-1.5"
                onClick={loadExample}
              >
                {t('tools.code_formatter.load_example')}
              </button>
              <button
                className="btn-secondary text-xs px-3 py-1.5"
                onClick={clearAll}
              >
                {t('tools.code_formatter.clear')}
              </button>
            </div>
          </div>
          
          {/* 移除格式化选项面板 */}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 输入区域 */}
          <div className="flex flex-col h-full">
            <h2 className="text-md font-medium text-primary mb-2">{t('tools.code_formatter.input_code')}</h2>
            <div className="relative flex-grow">
              <textarea
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder={t('tools.code_formatter.input_placeholder').replace('{language}', languages[selectedLanguage].name)}
                className="bg-block text-primary border border-purple-glow/30 rounded-md p-4 w-full h-[400px] font-mono text-sm resize-none"
              />
            </div>
          </div>
          
          {/* 输出区域 */}
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-md font-medium text-primary">{t('tools.code_formatter.formatted_result')}</h2>
              <div className="flex items-center gap-2">
                <button 
                  className="text-tertiary hover:text-purple transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={copyFormattedCode}
                  disabled={!outputCode}
                >
                  <FontAwesomeIcon icon={copied ? faCheck : faCopy} className="mr-1" />
                  {copied ? t('tools.code_formatter.copied') : t('tools.code_formatter.copy')}
                </button>
                <button 
                  className="text-tertiary hover:text-purple transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={downloadFormattedCode}
                  disabled={!outputCode}
                >
                  <FontAwesomeIcon icon={faDownload} className="mr-1" />
                  {t('tools.code_formatter.download')}
                </button>
              </div>
            </div>
            <div className="relative flex-grow">
              {error ? (
                <div className="bg-red-900/20 border border-red-700/30 rounded-md p-4 text-sm text-error flex items-start gap-2">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="mt-0.5" />
                  <div>
                    <p className="font-medium mb-1">{t('tools.code_formatter.formatting_error_title')}</p>
                    <p>{error}</p>
                  </div>
                </div>
              ) : outputCode ? (
                <pre className="bg-block text-primary border border-purple-glow/30 rounded-md p-4 w-full h-[400px] font-mono text-sm overflow-auto whitespace-pre">{outputCode}</pre>
              ) : (
                <div className="bg-block text-tertiary border border-purple-glow/30 rounded-md p-4 w-full h-[400px] flex flex-col items-center justify-center text-center">
                  <FontAwesomeIcon icon={faCode} className="text-3xl mb-2" />
                  <p>{t('tools.code_formatter.result_placeholder')}</p>
                  <p className="text-xs mt-2">{t('tools.code_formatter.click_format')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* 操作按钮 */}
        <div className="flex justify-center mt-6">
          <button 
            className="btn-primary px-6 py-2 flex items-center"
            onClick={formatCode}
            disabled={isFormatting || !inputCode || !prettierLoaded}
          >
            {isFormatting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('tools.code_formatter.processing')}
              </>
            ) : loadingModules ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('tools.code_formatter.loading_library')}
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faRedo} className="mr-2" />
                {t('tools.code_formatter.format')}
              </>
            )}
          </button>
        </div>
        
        {loadingModules && !error && (
          <div className="mt-4 text-center">
            <p className="text-sm text-tertiary">{t('tools.code_formatter.first_time_loading')}</p>
          </div>
        )}
        
        {fileMissingWarning && (
          <div className="mt-4 bg-yellow-900/10 border border-yellow-700/30 rounded-md p-3 text-sm text-warning">
            <p className="flex items-start gap-2">
              <FontAwesomeIcon icon={faExclamationTriangle} className="mt-0.5" />
              <span>{fileMissingWarning}</span>
            </p>
          </div>
        )}
        
        {/* 帮助信息 */}
        <div className="bg-block-strong bg-opacity-60 rounded-md p-4 border border-purple-glow/15">
          <h3 className="text-sm font-medium text-primary flex items-center gap-2 mb-2">
            <FontAwesomeIcon icon={faInfoCircle} />
            {t('tools.code_formatter.usage_guide')}
          </h3>
          <ul className="text-xs text-secondary space-y-1">
            <li>• {t('tools.code_formatter.usage_step1')}</li>
            <li>• {t('tools.code_formatter.usage_step2')}</li>
            <li>• {t('tools.code_formatter.usage_step3')}</li>
            <li>• {t('tools.code_formatter.usage_step4')}</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 