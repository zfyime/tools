'use client';

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

interface ActionButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: IconDefinition;
  className?: string;
}

export default function ActionButton({
  onClick,
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  className = ''
}: ActionButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all focus:outline-none disabled:cursor-not-allowed disabled:opacity-50';
  
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'rounded-md border border-[rgba(var(--color-error),0.32)] bg-[rgba(var(--color-error),0.12)] text-[rgb(var(--color-error))] shadow-sm transition-all hover:bg-[rgba(var(--color-error),0.18)] focus:ring-2 focus:ring-[rgba(var(--color-error),0.2)] focus:ring-offset-2 focus:ring-offset-[rgb(var(--color-bg-main))]'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base'
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={classes}
    >
      {loading && (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
      )}
      {icon && !loading && (
        <FontAwesomeIcon icon={icon} className="text-[0.9em]" />
      )}
      {children}
    </button>
  );
}
