'use client';

import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLightbulb } from '@fortawesome/free-solid-svg-icons';
import { faLightbulb as farLightbulb } from '@fortawesome/free-regular-svg-icons';
import { useLanguage } from '@/context/LanguageContext';

export default function ThemeToggle() {
  const [theme, setTheme] = useState('light');
  const [mounted, setMounted] = useState(false);
  const { t } = useLanguage();

  // 组件挂载后执行
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  // 切换主题
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    
    // 保存到本地存储并设置 data-theme 属性
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  // 如果组件尚未挂载，返回空白以避免服务器/客户端不匹配
  if (!mounted) return null;

  return (
    <button
      className="btn-secondary w-10 h-10 rounded-full flex items-center justify-center group relative overflow-hidden"
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? t('common.theme.light') : t('common.theme.dark')}
      title={theme === 'dark' ? t('common.theme.light') : t('common.theme.dark')}
    >
      {theme === 'dark' ? (
        // 灯泡图标 - 深色模式下显示(实心灯泡表示可以"点亮")
        <FontAwesomeIcon 
          icon={faLightbulb}
          className="text-[rgb(var(--color-warning))] text-xl"
        />
      ) : (
        // 灯泡轮廓图标 - 浅色模式下显示(空心灯泡表示可以"关闭")
        <FontAwesomeIcon 
          icon={farLightbulb}
          className="text-[rgb(var(--color-primary-light))] text-xl"
        />
      )}
      <span className="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-2 py-1 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 text-sm z-10"
        style={{
          backgroundColor: 'rgb(var(--color-bg-secondary))',
          color: 'rgb(var(--color-text-primary))'
        }}>
        {theme === 'dark' ? t('common.theme.light') : t('common.theme.dark')}
      </span>
    </button>
  );
} 
