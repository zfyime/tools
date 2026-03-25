'use client';

import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy, faCheck, faTrash, faEraser, faPlay } from '@fortawesome/free-solid-svg-icons';
import ToolHeader from '@/components/ToolHeader';
import { useLanguage } from '@/context/LanguageContext';

// 添加CSS变量样式
const styles = {
  card: "card p-6",
  input: "search-input w-full",
  textarea: "w-full p-3 bg-block border border-purple-glow rounded-lg text-primary focus:border-[#6366F1] focus:outline-none focus:ring-1 focus:ring-[#6366F1] transition-all resize-none",
  label: "text-sm text-secondary font-medium mb-1", 
  secondaryText: "text-sm text-tertiary",
  button: "text-left w-full px-3 py-2 rounded-md text-sm text-secondary hover:bg-block-hover transition-colors",
  radioGroup: "flex flex-col sm:flex-row gap-3",
  radioItem: "relative flex-1",
  radioInput: "absolute opacity-0 w-full h-full cursor-pointer",
  radioLabel: "block w-full px-4 py-2 text-center text-sm rounded-md border border-purple-glow/30 cursor-pointer hover:bg-block-hover transition-all",
  radioActive: "bg-[rgb(var(--color-primary))] text-[rgb(var(--color-bg-main))] border border-[var(--color-border)] shadow-sm",
  iconButton: "text-tertiary hover:text-purple transition-colors",
}

// 去空格模式类型
type StripMode = 'both' | 'start' | 'end' | 'all' | 'newlines' | 'all_and_newlines';

export default function TextSpaceStripper() {
  const { t } = useLanguage();
  
  // 输入文本
  const [inputText, setInputText] = useState('');
  // 输出文本
  const [outputText, setOutputText] = useState('');
  // 去除模式
  const [stripMode, setStripMode] = useState<StripMode>('both');
  // 复制状态
  const [copied, setCopied] = useState(false);

  // 清空输入
  const clearText = () => {
    setInputText('');
    setOutputText('');
  };

  // 处理文本
  const processText = () => {
    if (!inputText) return;

    let result = inputText;
    
    switch (stripMode) {
      case 'both':
        result = inputText.trim();
        break;
      case 'start':
        result = inputText.replace(/^\s+/, '');
        break;
      case 'end':
        result = inputText.replace(/\s+$/, '');
        break;
      case 'all':
        result = inputText.replace(/\s+/g, '');
        break;
      case 'newlines':
        result = inputText.replace(/[\r\n]+/g, '');
        break;
      case 'all_and_newlines':
        // 先去除所有换行符，再去除所有空格
        result = inputText.replace(/[\r\n]+/g, ' ').replace(/\s+/g, '');
        break;
      default:
        break;
    }

    setOutputText(result);
  };

  // 复制结果
  const copyResult = () => {
    if (!outputText) return;
    
    navigator.clipboard.writeText(outputText)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => console.error(t('tools.text_space_stripper.copy_failed'), err));
  };

  // 加载示例
  const loadExample = () => {
    setInputText('   这是一个    带有多余空格     和换行符的文本示例。\n\n这是   第二行     内容。\n   还有第三行内容。   \n');
    setOutputText('');
  };

  return (
    <div className="min-h-screen flex flex-col max-w-[1440px] mx-auto p-4 md:p-6">
      <ToolHeader 
        toolCode="text_space_stripper"
        icon={faEraser}
        title=""
        description=""
      />
      
      {/* 主内容区 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 左侧 - 输入和设置 */}
        <div className="lg:col-span-6 space-y-6">
          {/* 输入区域 */}
          <div className={styles.card}>
            <h2 className="text-md font-medium text-primary mb-4">{t('tools.text_space_stripper.input_text')}</h2>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={t('tools.text_space_stripper.input_placeholder')}
              className={styles.textarea}
              rows={10}
            />
            
            <div className="flex justify-end gap-2 mt-4">
              <button
                className="btn-secondary"
                onClick={clearText}
              >
                <FontAwesomeIcon icon={faTrash} className="mr-2" />
                {t('tools.text_space_stripper.clear')}
              </button>
              <button
                className="btn-primary"
                onClick={processText}
              >
                <FontAwesomeIcon icon={faPlay} className="mr-2" />
                {t('tools.text_space_stripper.process')}
              </button>
            </div>
          </div>
          
          {/* 工具选项 */}
          <div className={styles.card}>
            <h2 className="text-md font-medium text-primary mb-4">{t('tools.text_space_stripper.tool_options')}</h2>
            
            <div className="space-y-4">
              {/* 去除方式 */}
              <div>
                <p className={styles.label}>{t('tools.text_space_stripper.strip_mode')}</p>
                <div className={styles.radioGroup}>
                  <div className={styles.radioItem}>
                    <input
                      type="radio"
                      id="both"
                      className={styles.radioInput}
                      checked={stripMode === 'both'}
                      onChange={() => setStripMode('both')}
                    />
                    <label
                      htmlFor="both"
                      className={`${styles.radioLabel} ${stripMode === 'both' ? styles.radioActive : ''}`}
                    >
                      {t('tools.text_space_stripper.strip_mode_both')}
                    </label>
                  </div>
                  
                  <div className={styles.radioItem}>
                    <input
                      type="radio"
                      id="start"
                      className={styles.radioInput}
                      checked={stripMode === 'start'}
                      onChange={() => setStripMode('start')}
                    />
                    <label
                      htmlFor="start"
                      className={`${styles.radioLabel} ${stripMode === 'start' ? styles.radioActive : ''}`}
                    >
                      {t('tools.text_space_stripper.strip_mode_start')}
                    </label>
                  </div>
                  
                  <div className={styles.radioItem}>
                    <input
                      type="radio"
                      id="end"
                      className={styles.radioInput}
                      checked={stripMode === 'end'}
                      onChange={() => setStripMode('end')}
                    />
                    <label
                      htmlFor="end"
                      className={`${styles.radioLabel} ${stripMode === 'end' ? styles.radioActive : ''}`}
                    >
                      {t('tools.text_space_stripper.strip_mode_end')}
                    </label>
                  </div>
                </div>
                
                <div className={`${styles.radioGroup} mt-3`}>
                  <div className={styles.radioItem}>
                    <input
                      type="radio"
                      id="all"
                      className={styles.radioInput}
                      checked={stripMode === 'all'}
                      onChange={() => setStripMode('all')}
                    />
                    <label
                      htmlFor="all"
                      className={`${styles.radioLabel} ${stripMode === 'all' ? styles.radioActive : ''}`}
                    >
                      {t('tools.text_space_stripper.strip_mode_all')}
                    </label>
                  </div>
                  
                  <div className={styles.radioItem}>
                    <input
                      type="radio"
                      id="newlines"
                      className={styles.radioInput}
                      checked={stripMode === 'newlines'}
                      onChange={() => setStripMode('newlines')}
                    />
                    <label
                      htmlFor="newlines"
                      className={`${styles.radioLabel} ${stripMode === 'newlines' ? styles.radioActive : ''}`}
                    >
                      {t('tools.text_space_stripper.strip_mode_newlines')}
                    </label>
                  </div>
                  
                  <div className={styles.radioItem}>
                    <input
                      type="radio"
                      id="all_and_newlines"
                      className={styles.radioInput}
                      checked={stripMode === 'all_and_newlines'}
                      onChange={() => setStripMode('all_and_newlines')}
                    />
                    <label
                      htmlFor="all_and_newlines"
                      className={`${styles.radioLabel} ${stripMode === 'all_and_newlines' ? styles.radioActive : ''}`}
                    >
                      {t('tools.text_space_stripper.strip_mode_all_and_newlines')}
                    </label>
                  </div>
                </div>
              </div>
              
              <button
                className={styles.button}
                onClick={loadExample}
              >
                {t('tools.text_space_stripper.load_example')}
              </button>
            </div>
          </div>
        </div>
        
        {/* 右侧 - 输出结果 */}
        <div className="lg:col-span-6">
          <div className={styles.card}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-md font-medium text-primary">{t('tools.text_space_stripper.output_text')}</h2>
              <button 
                className={styles.iconButton}
                onClick={copyResult}
                disabled={!outputText}
              >
                <FontAwesomeIcon icon={copied ? faCheck : faCopy} className="mr-1" />
                {copied ? t('tools.text_space_stripper.copied') : t('tools.text_space_stripper.copy_result')}
              </button>
            </div>
            
            <textarea
              value={outputText}
              readOnly
              placeholder={t('tools.text_space_stripper.output_placeholder')}
              className={styles.textarea}
              rows={20}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 