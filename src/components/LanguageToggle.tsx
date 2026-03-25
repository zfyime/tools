'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLanguage } from '@fortawesome/free-solid-svg-icons';
import { useLanguage } from '@/context/LanguageContext';
import { Language } from '@/config/i18n';

export default function LanguageToggle() {
  const { language, changeLanguage, t } = useLanguage();
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    if (!showDropdown) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showDropdown]);
  
  // 切换下拉菜单显示状态
  const toggleDropdown = () => {
    setShowDropdown(prev => !prev);
  };
  
  // 选择语言
  const selectLanguage = (lang: Language) => {
    changeLanguage(lang);
    setShowDropdown(false);
  };
  
  return (
    <div className="relative" ref={containerRef}>
      <button
        className="btn-secondary w-10 h-10 rounded-full flex items-center justify-center group relative"
        onClick={toggleDropdown}
        aria-label={t('common.language.title')}
        title={t('common.language.title')}
      >
        <FontAwesomeIcon 
          icon={faLanguage}
          className="text-[rgb(var(--color-primary))] text-xl"
        />
        <span className="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-2 py-1 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 text-sm z-10"
          style={{
            backgroundColor: 'rgb(var(--color-bg-secondary))',
            color: 'rgb(var(--color-text-primary))'
          }}>
          {t('common.language.title')}
        </span>
      </button>
      
      {/* 语言选择下拉菜单 */}
      {showDropdown && (
        <div 
          className="absolute right-0 top-full mt-2 py-2 w-32 bg-[rgb(var(--color-bg-card))] shadow-sm rounded-lg border border-[rgba(var(--color-primary),0.2)] z-50"
          style={{
            backgroundColor: 'rgb(var(--color-bg-card))',
            border: '1px solid rgba(var(--color-primary), 0.2)'
          }}
        >
          <button
            className={`w-full text-left px-4 py-2 hover:bg-[rgba(var(--color-primary),0.1)] transition-colors duration-200 ${language === 'zh' ? 'text-[rgb(var(--color-primary))] font-medium' : ''}`}
            onClick={() => selectLanguage('zh')}
          >
            {t('common.language.zh')}
          </button>
          <button
            className={`w-full text-left px-4 py-2 hover:bg-[rgba(var(--color-primary),0.1)] transition-colors duration-200 ${language === 'en' ? 'text-[rgb(var(--color-primary))] font-medium' : ''}`}
            onClick={() => selectLanguage('en')}
          >
            {t('common.language.en')}
          </button>
        </div>
      )}
    </div>
  );
} 