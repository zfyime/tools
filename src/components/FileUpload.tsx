'use client';

import React, { useCallback, useId, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudUploadAlt, faFile, faTimes } from '@fortawesome/free-solid-svg-icons';

interface FileUploadProps {
  accept?: string;
  maxSize?: number; // 以字节为单位
  multiple?: boolean;
  onFileSelect: (files: File[]) => void;
  onError?: (error: string) => void;
  title?: string;
  subtitle?: string;
  buttonText?: string;
  className?: string;
}

export default function FileUpload({
  accept = '*',
  maxSize = 100 * 1024 * 1024, // 默认100MB
  multiple = false,
  onFileSelect,
  onError,
  title = '拖拽文件到此处或点击上传',
  subtitle = '支持多种格式',
  buttonText = '选择文件',
  className = ''
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const inputId = useId();

  const validateFiles = useCallback((files: FileList): File[] => {
    const validFiles: File[] = [];
    const errors: string[] = [];

    Array.from(files).forEach((file) => {
      // 检查文件大小
      if (file.size > maxSize) {
        errors.push(`文件 ${file.name} 过大，最大支持 ${Math.round(maxSize / 1024 / 1024)}MB`);
        return;
      }

      // 检查文件类型
      if (accept !== '*' && !file.type.match(new RegExp(accept.replace(/\*/g, '.*')))) {
        errors.push(`文件 ${file.name} 格式不支持`);
        return;
      }

      validFiles.push(file);
    });

    if (errors.length > 0) {
      onError?.(errors.join('\n'));
      return [];
    }

    return validFiles;
  }, [accept, maxSize, onError]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const validFiles = validateFiles(files);
    if (validFiles.length > 0) {
      setSelectedFiles(validFiles);
      onFileSelect(validFiles);
    }
  }, [validateFiles, onFileSelect]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);

    const files = event.dataTransfer.files;
    if (!files) return;

    const validFiles = validateFiles(files);
    if (validFiles.length > 0) {
      setSelectedFiles(validFiles);
      onFileSelect(validFiles);
    }
  }, [validateFiles, onFileSelect]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
  }, []);

  const removeFile = useCallback((index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    onFileSelect(newFiles);
  }, [selectedFiles, onFileSelect]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 文件上传区域 */}
      <div
        className={`
          rounded-xl border border-dashed p-8 text-center transition-all cursor-pointer
          ${isDragOver 
            ? 'border-[rgba(var(--color-text-primary),0.4)] bg-[rgba(var(--color-bg-secondary),0.75)]'
            : 'border-[rgba(var(--color-text-secondary),0.25)] bg-[rgba(var(--color-block),0.45)] hover:border-[rgba(var(--color-text-secondary),0.45)] hover:bg-[rgba(var(--color-bg-secondary),0.35)]'
          }
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => document.getElementById(inputId)?.click()}
      >
        <FontAwesomeIcon 
          icon={faCloudUploadAlt} 
          className="mb-4 text-3xl text-[rgb(var(--color-text-secondary))]" 
        />
        <h3 className="mb-2 text-xl font-semibold tracking-tight text-primary">
          {title}
        </h3>
        <p className="mb-4 text-sm text-secondary">
          {subtitle}
        </p>
        <button type="button" className="btn-secondary px-6 py-2">
          {buttonText}
        </button>
        <input
          id={inputId}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* 已选择的文件列表 */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-secondary">已选择的文件</h4>
          {selectedFiles.map((file, index) => (
            <div 
              key={`${file.name}-${index}`}
              className="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-block px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[rgba(var(--color-bg-main),0.5)] text-secondary">
                  <FontAwesomeIcon icon={faFile} />
                </div>
                <div>
                  <p className="text-sm font-medium text-primary">{file.name}</p>
                  <p className="text-xs text-secondary">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="rounded-md border border-transparent px-2 py-1 text-secondary transition-colors hover:border-[rgba(var(--color-error),0.2)] hover:bg-[rgba(var(--color-error),0.08)] hover:text-[rgb(var(--color-error))]"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 
