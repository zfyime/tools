'use client';

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

interface ProgressBarProps {
  progress: number; // 0-100
  status: string;
  onCancel?: () => void;
  showCancel?: boolean;
  className?: string;
}

export default function ProgressBar({
  progress,
  status,
  onCancel,
  showCancel = true,
  className = ''
}: ProgressBarProps) {
  return (
    <div className={`card p-4 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-primary">{status}</span>
        <span className="text-sm text-secondary">{Math.round(progress)}%</span>
      </div>
      
      <div className="mb-2 h-2 w-full rounded-full bg-block">
        <div 
          className="h-2 rounded-full bg-[rgb(var(--color-primary))] transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {showCancel && onCancel && (
        <div className="flex justify-end">
          <button
            onClick={onCancel}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm text-secondary transition-colors hover:bg-[rgba(var(--color-error),0.08)] hover:text-[rgb(var(--color-error))]"
          >
            <FontAwesomeIcon icon={faTimes} />
            取消
          </button>
        </div>
      )}
    </div>
  );
} 
