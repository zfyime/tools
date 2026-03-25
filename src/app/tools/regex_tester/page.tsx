'use client';

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faKey, faCopy, faCheck, faExclamationTriangle, faInfoCircle, faTrash } from '@fortawesome/free-solid-svg-icons';
import ToolHeader from '@/components/ToolHeader';
import { useLanguage } from '@/context/LanguageContext';

// 添加CSS变量样式
const styles = {
  card: "card p-4",
  input: "search-input w-full",
  secondaryBtn: "btn-secondary",
  primaryText: "text-primary",
  secondaryText: "text-secondary",
  tertiaryText: "text-tertiary",
  block: "bg-block",
  codeBlock: "bg-block px-1 rounded",
  iconButton: "text-tertiary hover:text-purple transition-colors",
  selectedFlag: "bg-purple-glow/20 text-purple",
  buttonActive: "px-3 py-1 text-xs rounded-md transition-all bg-[rgb(var(--color-primary))] text-[rgb(var(--color-bg-main))] shadow-sm border border-[var(--color-border)]",
  buttonInactive: "px-3 py-1 text-xs rounded-md transition-all btn-secondary",
  error: "text-error",
  highlightBg: "bg-purple-500/30 text-white font-medium",
}

// 定义匹配项类型
type MatchResult = RegExpExecArray;
type MatchResultArray = MatchResult[];

export default function RegexTester() {
  const { t } = useLanguage();
  
  // 正则表达式输入
  const [regexString, setRegexString] = useState('');
  const [flags, setFlags] = useState('g');
  const [testString, setTestString] = useState('');
  
  // 测试结果
  const [matches, setMatches] = useState<MatchResultArray>([]);
  const [matchCount, setMatchCount] = useState(0);
  
  // 高级选项
  const [showGroups, setShowGroups] = useState(true);
  const [regexError, setRegexError] = useState<string | null>(null);
  
  // 复制状态
  const [copiedRegex, setCopiedRegex] = useState(false);
  
  // 安全处理HTML转义
  const escapeHtml = (text: string) => {
    if (text === undefined || text === null) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };
  
  // 常用正则表达式示例
  const examples = [
    { name: t('tools.regex_tester.examples.email'), pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}', flags: 'g', testText: 'test@example.com, invalid-email, another.email@domain.co.uk' },
    { name: t('tools.regex_tester.examples.phone'), pattern: '1[3-9]\\d{9}', flags: 'g', testText: t('tools.regex_tester.example_texts.phone') },
    { name: t('tools.regex_tester.examples.url'), pattern: 'https?://[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b(?:[-a-zA-Z0-9()@:%_\\+.~#?&//=]*)', flags: 'g', testText: t('tools.regex_tester.example_texts.url') },
    { name: t('tools.regex_tester.examples.ip'), pattern: '\\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b', flags: 'g', testText: t('tools.regex_tester.example_texts.ip') },
    { name: t('tools.regex_tester.examples.chinese'), pattern: '[\\u4e00-\\u9fa5]', flags: 'g', testText: t('tools.regex_tester.example_texts.chinese') },
  ];
  
  // 当输入改变时更新测试结果
  useEffect(() => {
    testRegex();
  }, [regexString, flags, testString, showGroups]);
  
  // 测试正则表达式
  const testRegex = () => {
    if (!regexString || !testString) {
      setMatches([]);
      setMatchCount(0);
      setRegexError(null);
      return;
    }
    
    try {
      // 验证正则表达式是否有效
      new RegExp(regexString, flags);
      setRegexError(null);
      
      if (flags.includes('g')) {
        // 获取所有匹配
        const allMatches: MatchResultArray = [];
        let match: RegExpExecArray | null;
        const regexWithGroups = new RegExp(regexString, flags);
        
        // 收集所有匹配和捕获组
        while ((match = regexWithGroups.exec(testString)) !== null) {
          allMatches.push(match);
          
          // 防止无限循环，如果匹配长度为0，手动增加索引
          if (match.index === regexWithGroups.lastIndex) {
            regexWithGroups.lastIndex++;
          }
        }
        
        setMatches(allMatches);
        setMatchCount(allMatches.length);
      } else {
        // 单次匹配模式
        const regexWithoutG = new RegExp(regexString, flags.replace('g', ''));
        const execMatch = regexWithoutG.exec(testString);
        
        if (execMatch) {
          setMatches([execMatch]);
          setMatchCount(1);
        } else {
          setMatches([]);
          setMatchCount(0);
        }
      }
    } catch (error) {
      console.error(t('tools.regex_tester.regex_error'), error);
      setRegexError((error as Error).message);
      setMatches([]);
      setMatchCount(0);
    }
  };
  
  // 复制正则表达式
  const copyRegex = () => {
    const regexText = `/${regexString}/${flags}`;
    navigator.clipboard.writeText(regexText)
      .then(() => {
        setCopiedRegex(true);
        setTimeout(() => setCopiedRegex(false), 2000);
      })
      .catch(err => console.error(t('tools.regex_tester.copy_failed'), err));
  };
  
  // 应用示例
  const applyExample = (example: { pattern: string; flags: string; testText: string }) => {
    setRegexString(example.pattern);
    setFlags(example.flags);
    setTestString(example.testText);
  };
  
  // 清空所有内容
  const clearAll = () => {
    setRegexString('');
    setFlags('g');
    setTestString('');
    setMatches([]);
    setMatchCount(0);
    setRegexError(null);
  };
  
  // 切换标志位
  const toggleFlag = (flag: string) => {
    if (flags.includes(flag)) {
      setFlags(flags.replace(flag, ''));
    } else {
      setFlags(flags + flag);
    }
  };

  return (
    <div className="min-h-screen flex flex-col max-w-[1440px] mx-auto p-4 md:p-6">
      <ToolHeader 
        toolCode="regex_tester"
        title=""
        description=""
        icon={faKey}
      />
      
      {/* 主内容区 */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 左侧面板 - 正则表达式输入和选项 */}
        <div className="lg:col-span-1 space-y-6">
          {/* 常用示例 */}
          <div className={styles.card}>
            <h2 className="text-md font-medium text-primary mb-4">{t('tools.regex_tester.examples.title')}</h2>
            <div className="space-y-2">
              {examples.map((example, index) => (
                <button
                  key={index}
                  className="text-left w-full px-3 py-2 rounded-md text-sm text-secondary hover:bg-block-hover transition-colors"
                  onClick={() => applyExample(example)}
                >
                  {example.name}
                </button>
              ))}
            </div>
          </div>
          
          {/* 正则选项 */}
          <div className={styles.card}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-md font-medium text-primary">{t('tools.regex_tester.options')}</h2>
              <button
                className="text-tertiary hover:text-error transition-colors"
                onClick={clearAll}
              >
                <FontAwesomeIcon icon={faTrash} className="mr-1" />
                {t('tools.regex_tester.clear')}
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-secondary mb-2">{t('tools.regex_tester.flags')}</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    className={flags.includes('g') ? styles.buttonActive : styles.buttonInactive}
                    onClick={() => toggleFlag('g')}
                  >
                    g ({t('tools.regex_tester.flag_descriptions.global')})
                  </button>
                  <button
                    className={flags.includes('i') ? styles.buttonActive : styles.buttonInactive}
                    onClick={() => toggleFlag('i')}
                  >
                    i ({t('tools.regex_tester.flag_descriptions.case_insensitive')})
                  </button>
                  <button
                    className={flags.includes('m') ? styles.buttonActive : styles.buttonInactive}
                    onClick={() => toggleFlag('m')}
                  >
                    m ({t('tools.regex_tester.flag_descriptions.multiline')})
                  </button>
                  <button
                    className={flags.includes('s') ? styles.buttonActive : styles.buttonInactive}
                    onClick={() => toggleFlag('s')}
                  >
                    s ({t('tools.regex_tester.flag_descriptions.dotall')})
                  </button>
                </div>
              </div>
              
              <div>
                <label className="flex items-center text-sm text-secondary">
                  <input
                    type="checkbox"
                    checked={showGroups}
                    onChange={() => setShowGroups(!showGroups)}
                    className="mr-2"
                  />
                  {t('tools.regex_tester.show_capture_groups')}
                </label>
              </div>
            </div>
          </div>
        </div>
        
        {/* 右侧面板 - 测试区域 */}
        <div className="lg:col-span-3 space-y-6">
          {/* 正则表达式输入 */}
          <div className={styles.card}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-md font-medium text-primary">{t('tools.regex_tester.regex_expression')}</h2>
              <button 
                className={styles.iconButton}
                onClick={copyRegex}
                disabled={!regexString}
              >
                <FontAwesomeIcon icon={copiedRegex ? faCheck : faCopy} className="mr-1" />
                {copiedRegex ? t('common.copySuccess') : t('tools.regex_tester.copy')}
              </button>
            </div>
            
            <div className="relative">
              <div className="absolute left-3 top-[13px] text-tertiary">/</div>
              <input
                type="text"
                value={regexString}
                onChange={(e) => setRegexString(e.target.value)}
                placeholder={t('tools.regex_tester.enter_regex')}
                className="search-input pl-7 pr-14"
              />
              <div className="absolute right-14 top-[13px] text-tertiary">/</div>
              <input
                type="text"
                value={flags}
                onChange={(e) => setFlags(e.target.value)}
                placeholder="flags"
                className="absolute right-3 top-[13px] w-8 bg-transparent border-none outline-none text-tertiary"
              />
            </div>
            
            {regexError && (
              <div className="mt-2 text-sm text-error flex items-center gap-2">
                <FontAwesomeIcon icon={faExclamationTriangle} />
                <span>{regexError}</span>
              </div>
            )}
          </div>
          
          {/* 测试输入 */}
          <div className={styles.card}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-md font-medium text-primary">{t('tools.regex_tester.test_text')}</h2>
              <div className="text-sm text-secondary">
                {t('tools.regex_tester.character_count')}: <span className="text-purple">{testString.length}</span>
              </div>
            </div>
            
            <textarea
              value={testString}
              onChange={(e) => setTestString(e.target.value)}
              placeholder={t('tools.regex_tester.enter_test_text')}
              className="search-input min-h-[150px] w-full resize-y"
            />
          </div>
          
          {/* 匹配结果 */}
          <div className={styles.card}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-md font-medium text-primary">{t('tools.regex_tester.match_results')}</h2>
              <div className="text-sm text-secondary">
                {t('tools.regex_tester.match_count')}: <span className="text-purple">{matchCount}</span>
              </div>
            </div>
            
            {testString && (
              <div className="space-y-4">
                {/* 高亮显示的匹配文本 */}
                <div className="bg-block-strong rounded-md p-4 whitespace-pre-wrap font-mono text-sm">
                  {testString && (
                    <div className="match-results">
                      {matchCount > 0 ? (
                        <>
                          <div className="mb-3 text-tertiary text-xs flex items-center justify-between">
                            <span>
                              {t('tools.regex_tester.found')} <span className="text-purple font-medium">{matchCount}</span> {t('tools.regex_tester.matches')}
                            </span>
                            <span className="text-tertiary text-xs">
                              {t('tools.regex_tester.original_text_length')}: {testString.length} {t('tools.regex_tester.result_characters')}
                            </span>
                          </div>
                          
                          {(() => {
                            // 创建包含高亮的全文显示
                            let result = '';
                            let lastIndex = 0;
                            
                            // 按索引顺序排序匹配项
                            const sortedMatches = [...matches].sort((a, b) => a.index - b.index);
                            
                            // 遍历每个匹配项
                            sortedMatches.forEach(match => {
                              // 添加匹配前的文本
                              result += escapeHtml(testString.substring(lastIndex, match.index));
                              
                              // 添加高亮的匹配内容
                              result += `<span style="background-color:rgba(139, 92, 246, 0.5); color:white; font-weight:bold; padding:0 4px; border-radius:3px;">${escapeHtml(match[0])}</span>`;
                              
                              // 更新lastIndex
                              lastIndex = match.index + match[0].length;
                            });
                            
                            // 添加最后一个匹配后的文本
                            if (lastIndex < testString.length) {
                              result += escapeHtml(testString.substring(lastIndex));
                            }
                            
                            return <div dangerouslySetInnerHTML={{ __html: result }} />;
                          })()}
                        </>
                      ) : (
                        <span className="text-tertiary">{t('tools.regex_tester.no_matches')}</span>
                      )}
                    </div>
                  )}
                  {!testString && (
                    <span className="text-tertiary">{t('tools.regex_tester.no_matches')}</span>
                  )}
                </div>
                
                {/* 捕获组详情 */}
                {showGroups && matchCount > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-primary mb-2">{t('tools.regex_tester.capture_groups')}</h3>
                    <div className="space-y-2">
                      {Array.isArray(matches) && matches.map((match, index) => (
                        <div key={index} className="bg-block-strong rounded-md p-3">
                          <div className="text-xs text-tertiary mb-2">
                            {t('tools.regex_tester.match')} #{index + 1} ({t('tools.regex_tester.position')}: {match.index})
                          </div>
                          
                          <div className="space-y-1">
                            {match.length > 0 && (
                              <div className="flex items-start gap-2">
                                <span className="text-xs text-tertiary min-w-[40px]">{t('tools.regex_tester.full')}:</span>
                                <code className="text-sm text-primary bg-purple-glow/10 px-1 rounded break-all">
                                  {escapeHtml(match[0] || '')}
                                </code>
                              </div>
                            )}
                            
                            {match.length > 1 && Array.from({ length: match.length - 1 }, (_, i) => i + 1).map(group => (
                              <div key={group} className="flex items-start gap-2">
                                <span className="text-xs text-tertiary min-w-[40px]">{t('tools.regex_tester.group')} {group}:</span>
                                <code className="text-sm text-primary bg-purple-glow/10 px-1 rounded break-all">
                                  {match[group] ? escapeHtml(match[group]) : t('tools.regex_tester.empty')}
                                </code>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {!testString && (
              <div className="flex items-center justify-center p-4 text-tertiary">
                <FontAwesomeIcon icon={faInfoCircle} className="mr-2" />
                {t('tools.regex_tester.enter_text_prompt')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 