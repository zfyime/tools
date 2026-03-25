'use client';

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalculator, faCopy, faCheck, faSyncAlt, faEraser, faCog } from '@fortawesome/free-solid-svg-icons';
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
  inputGroup: "flex flex-col gap-2 w-full",
  inputLabel: "text-sm font-medium text-secondary",
  textArea: "w-full p-3 bg-block border border-purple-glow rounded-lg text-primary focus:border-purple focus:outline-none focus:ring-1 focus:ring-purple resize-y font-mono h-32",
  errorMsg: "py-2 px-3 bg-red-900/20 border border-red-700/30 text-error rounded-md",
  flexRow: "flex flex-col sm:flex-row gap-4 justify-between items-center",
  copyBtn: "flex items-center gap-1 px-3 py-1 text-sm rounded-md bg-block-strong hover:bg-block-hover text-secondary transition-colors",
  actionBtn: "flex items-center gap-1 px-4 py-2 rounded-md",
  advancedOptionsBtn: "flex items-center gap-1 px-3 py-1 text-sm rounded-md bg-block-strong hover:bg-block-hover text-secondary transition-colors",
  checkbox: "w-4 h-4 text-purple bg-block rounded border-purple-glow focus:ring-purple focus:ring-opacity-25",
  checkboxLabel: "ml-2 text-sm font-medium text-secondary",
  inputField: "w-full p-3 bg-block border border-purple-glow rounded-lg text-primary focus:border-purple focus:outline-none focus:ring-1 focus:ring-purple",
  numberInput: "w-20 p-1 bg-block border border-purple-glow rounded-md text-primary text-center focus:border-purple focus:outline-none focus:ring-1 focus:ring-purple"
};

export default function NumberBaseConverter() {
  const { t } = useLanguage();
  
  // 从工具配置中获取当前工具图标
  const toolIcon = tools.find(tool => tool.code === 'number_base_converter')?.icon || faCalculator;
  
  // 状态管理
  const [inputValue, setInputValue] = useState('');
  const [outputValue, setOutputValue] = useState('');
  const [fromBase, setFromBase] = useState('10'); // 默认从十进制
  const [toBase, setToBase] = useState('2'); // 默认转换为二进制
  const [customFromBase, setCustomFromBase] = useState('10');
  const [customToBase, setCustomToBase] = useState('2');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [useUppercase, setUseUppercase] = useState(true);
  const [addPrefix, setAddPrefix] = useState(false);
  const [groupDigits, setGroupDigits] = useState(false);
  
  // 有效的进制列表
  const baseOptions = [
    { id: '2', name: t('tools.number_base_converter.binary') },
    { id: '8', name: t('tools.number_base_converter.octal') },
    { id: '10', name: t('tools.number_base_converter.decimal') },
    { id: '16', name: t('tools.number_base_converter.hex') },
    { id: 'custom', name: t('tools.number_base_converter.custom') }
  ];
  
  // 当输入值、进制等变化时自动转换
  useEffect(() => {
    if (inputValue.trim() === '') {
      setOutputValue('');
      setError('');
      return;
    }
    
    try {
      const result = convertBase(
        inputValue, 
        fromBase === 'custom' ? customFromBase : fromBase, 
        toBase === 'custom' ? customToBase : toBase
      );
      setOutputValue(result);
      setError('');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(t('tools.number_base_converter.general_error'));
      }
      setOutputValue('');
    }
  }, [inputValue, fromBase, toBase, customFromBase, customToBase, useUppercase, addPrefix, groupDigits, t]);
  
  // 进制转换函数
  const convertBase = (value: string, from: string, to: string): string => {
    const fromBaseInt = parseInt(from, 10);
    const toBaseInt = parseInt(to, 10);
    
    // 验证进制范围
    if (fromBaseInt < 2 || fromBaseInt > 36 || toBaseInt < 2 || toBaseInt > 36) {
      throw new Error(t('tools.number_base_converter.base_error'));
    }
    
    // 移除输入中可能存在的前缀和格式化字符
    const cleanValue = value.replace(/^0[bxo]|[\s_]/gi, '');
    
    // 尝试转换为十进制
    let decimalValue;
    try {
      decimalValue = parseInt(cleanValue, fromBaseInt);
      
      // 检查NaN，表明输入无效
      if (isNaN(decimalValue)) {
        throw new Error();
      }
    } catch {
      throw new Error(t('tools.number_base_converter.input_error'));
    }
    
    // 转换为目标进制
    let result = decimalValue.toString(toBaseInt);
    
    // 大写十六进制或更高进制字母
    if (useUppercase && toBaseInt > 10) {
      result = result.toUpperCase();
    }
    
    // 添加适当的前缀
    if (addPrefix) {
      if (toBaseInt === 2) result = '0b' + result;
      else if (toBaseInt === 8) result = '0o' + result;
      else if (toBaseInt === 16) result = '0x' + result;
    }
    
    // 分组数字以提高可读性
    if (groupDigits) {
      // 二进制每8位分组
      if (toBaseInt === 2) {
        result = result.replace(/^0[b]/i, '').match(/.{1,8}/g)?.join('_') || result;
        if (addPrefix) result = '0b' + result;
      } 
      // 十六进制每4位分组
      else if (toBaseInt === 16) {
        result = result.replace(/^0[x]/i, '').match(/.{1,4}/g)?.join('_') || result;
        if (addPrefix) result = '0x' + result;
      }
      // 其他进制每4位分组
      else if (toBaseInt !== 10) {
        result = result.replace(/^0[bo]/i, '').match(/.{1,4}/g)?.join('_') || result;
        if (addPrefix) {
          if (toBaseInt === 8) result = '0o' + result;
        }
      }
    }
    
    return result;
  };
  
  // 复制输出内容到剪贴板
  const copyToClipboard = () => {
    if (!outputValue) return;
    
    navigator.clipboard.writeText(outputValue)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error(t('tools.number_base_converter.copy_failed'), err);
        setError(t('tools.number_base_converter.clipboard_error'));
      });
  };
  
  // 清空输入和输出
  const clearAll = () => {
    setInputValue('');
    setOutputValue('');
    setError('');
  };
  
  // 加载示例
  const loadExample = () => {
    const examples: Record<string, string> = {
      '2': t('tools.number_base_converter.example_binary'),
      '8': t('tools.number_base_converter.example_octal'),
      '10': t('tools.number_base_converter.example_decimal'),
      '16': t('tools.number_base_converter.example_hex')
    };
    
    // 从当前选择的进制加载示例
    const currentFromBase = fromBase === 'custom' ? customFromBase : fromBase;
    const example = examples[currentFromBase] || examples['10'];
    setInputValue(example);
  };
  
  return (
    <div className={styles.container}>
      {/* 使用 ToolHeader 组件 */}
      <ToolHeader 
        toolCode="number_base_converter"
        title=""
        description=""
        icon={toolIcon}
      />
      
      {/* 主要内容区域 */}
      <div className={styles.card}>
        <div className="space-y-6">
          {/* 进制选择 */}
          <div className={styles.flexRow}>
            <div className="w-full sm:w-1/2 space-y-2">
              <label className={styles.inputLabel}>{t('tools.number_base_converter.from_base')}</label>
              <div className="flex flex-wrap gap-2">
                {baseOptions.map((option) => (
                  <button
                    key={option.id}
                    className={fromBase === option.id ? styles.typeBtnActive : styles.typeBtnInactive}
                    onClick={() => setFromBase(option.id)}
                  >
                    {option.name}
                  </button>
                ))}
              </div>
              
              {fromBase === 'custom' && (
                <div className="mt-2">
                  <label className={styles.inputLabel}>{t('tools.number_base_converter.custom_base_from')}</label>
                  <input
                    type="number"
                    min="2"
                    max="36"
                    value={customFromBase}
                    onChange={(e) => setCustomFromBase(e.target.value)}
                    className={styles.numberInput}
                  />
                </div>
              )}
            </div>
            
            <div className="w-full sm:w-1/2 space-y-2">
              <label className={styles.inputLabel}>{t('tools.number_base_converter.to_base')}</label>
              <div className="flex flex-wrap gap-2">
                {baseOptions.map((option) => (
                  <button
                    key={option.id}
                    className={toBase === option.id ? styles.typeBtnActive : styles.typeBtnInactive}
                    onClick={() => setToBase(option.id)}
                  >
                    {option.name}
                  </button>
                ))}
              </div>
              
              {toBase === 'custom' && (
                <div className="mt-2">
                  <label className={styles.inputLabel}>{t('tools.number_base_converter.custom_base_to')}</label>
                  <input
                    type="number"
                    min="2"
                    max="36"
                    value={customToBase}
                    onChange={(e) => setCustomToBase(e.target.value)}
                    className={styles.numberInput}
                  />
                </div>
              )}
            </div>
          </div>
          
          {/* 高级选项 */}
          <div>
            <button
              className={styles.advancedOptionsBtn}
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            >
              <FontAwesomeIcon icon={faCog} className="mr-1" />
              {t('tools.number_base_converter.advanced_options')}
            </button>
            
            {showAdvancedOptions && (
              <div className="mt-3 p-3 bg-block-strong rounded-md space-y-2">
                <div className="flex items-center">
                  <input
                    id="uppercase"
                    type="checkbox"
                    checked={useUppercase}
                    onChange={(e) => setUseUppercase(e.target.checked)}
                    className={styles.checkbox}
                  />
                  <label htmlFor="uppercase" className={styles.checkboxLabel}>
                    {t('tools.number_base_converter.use_uppercase')}
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    id="prefix"
                    type="checkbox"
                    checked={addPrefix}
                    onChange={(e) => setAddPrefix(e.target.checked)}
                    className={styles.checkbox}
                  />
                  <label htmlFor="prefix" className={styles.checkboxLabel}>
                    {t('tools.number_base_converter.add_prefix')}
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    id="group"
                    type="checkbox"
                    checked={groupDigits}
                    onChange={(e) => setGroupDigits(e.target.checked)}
                    className={styles.checkbox}
                  />
                  <label htmlFor="group" className={styles.checkboxLabel}>
                    {t('tools.number_base_converter.group_digits')}
                  </label>
                </div>
              </div>
            )}
          </div>
          
          {/* 输入区域 */}
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>{t('tools.number_base_converter.input_label')}</label>
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={t('tools.number_base_converter.input_placeholder')}
              className={styles.textArea}
            />
          </div>
          
          {/* 操作按钮 */}
          <div className="flex justify-between flex-wrap gap-2">
            <div className="flex gap-2">
              <button
                className="btn-primary"
                onClick={loadExample}
              >
                <FontAwesomeIcon icon={faSyncAlt} className="mr-2" />
                {t('tools.number_base_converter.load_example')}
              </button>
              
              <button
                className="btn-secondary"
                onClick={clearAll}
              >
                <FontAwesomeIcon icon={faEraser} className="mr-2" />
                {t('tools.number_base_converter.clear')}
              </button>
            </div>
          </div>
          
          {/* 错误消息 */}
          {error && (
            <div className={styles.errorMsg}>
              {error}
            </div>
          )}
          
          {/* 输出区域 */}
          <div className={styles.inputGroup}>
            <div className="flex justify-between items-center">
              <label className={styles.inputLabel}>{t('tools.number_base_converter.result_label')}</label>
              
              {outputValue && (
                <button 
                  className={styles.copyBtn}
                  onClick={copyToClipboard}
                >
                  <FontAwesomeIcon icon={copied ? faCheck : faCopy} />
                  {copied 
                    ? t('tools.number_base_converter.copy_success') 
                    : t('tools.number_base_converter.copy')}
                </button>
              )}
            </div>
            
            <textarea
              value={outputValue}
              readOnly
              placeholder={t('tools.number_base_converter.output_placeholder')}
              className={styles.textArea}
            />
          </div>
        </div>
      </div>
      
      {/* 返回顶部按钮 */}
      <BackToTop />
    </div>
  );
} 