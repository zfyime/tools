'use client';

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';

interface ToolHeaderProps {
  title: string;
  description: string;
  icon: IconDefinition;
  toolCode: string;
}

export default function ToolHeader({ title, description, icon, toolCode }: ToolHeaderProps) {
  const router = useRouter();
  const { t } = useLanguage();

  // 返回上一页，如果没有历史记录则回首页
  const goBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  return (
    <header className="flex items-center gap-5 mb-10 pb-6 border-b border-[rgba(var(--color-primary),0.1)]">
      <button
        className="btn-secondary px-3 py-1.5 text-sm flex items-center gap-1.5"
        onClick={goBack}
      >
        <FontAwesomeIcon icon={faArrowLeft} className="text-xs" />
        {t('common.backToHome')}
      </button>
      <div className="w-px h-8 bg-[rgba(var(--color-primary),0.1)]"></div>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 flex items-center justify-center rounded-lg border border-[rgba(var(--color-primary),0.1)] bg-[rgba(var(--color-primary),0.02)] flex-shrink-0">
          <FontAwesomeIcon icon={icon} className="text-[rgb(var(--color-primary))] text-lg" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[rgb(var(--color-primary))]">{title || t(`tools.${toolCode}.title`)}</h1>
          <p className="text-sm mt-0.5 text-[rgb(var(--color-text-secondary))]">{description || t(`tools.${toolCode}.description`)}</p>
        </div>
      </div>
    </header>
  );
} 