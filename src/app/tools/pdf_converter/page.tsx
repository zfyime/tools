'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import ToolHeader from '@/components/ToolHeader';
import FileUpload from '@/components/FileUpload';
import ActionButton from '@/components/ActionButton';
import ProgressBar from '@/components/ProgressBar';
import { faDownload, faExchangeAlt } from '@fortawesome/free-solid-svg-icons';

interface ConversionResult {
  url: string;
  filename: string;
  size: number;
  type: 'image' | 'text';
}

const styles = {
  page: 'min-h-screen bg-main text-primary',
  shell: 'mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6 md:px-6',
  content: 'mx-auto w-full max-w-5xl space-y-6',
  card: 'card p-6',
  sectionTitle: 'text-lg font-semibold tracking-tight text-primary',
  sectionDescription: 'mt-1 text-sm text-secondary',
  fieldLabel: 'mb-2 block text-sm font-medium text-primary',
  select: 'search-input w-full appearance-none px-3 py-2.5 pl-3',
  optionGrid: 'grid grid-cols-1 gap-3 md:grid-cols-2',
  optionButton: (active: boolean) =>
    `rounded-xl border px-4 py-4 text-left transition-all ${
      active
        ? 'border-[rgba(var(--color-text-primary),0.35)] bg-[rgb(var(--color-bg-secondary))] text-primary shadow-sm'
        : 'border-[var(--color-border)] bg-transparent text-secondary hover:border-[rgba(var(--color-text-secondary),0.35)] hover:bg-[rgba(var(--color-bg-secondary),0.35)]'
    }`,
  hintBox: 'rounded-xl border border-[var(--color-border)] bg-block p-4',
  alert: 'rounded-xl border border-[rgba(var(--color-error),0.24)] bg-[rgba(var(--color-error),0.08)] px-4 py-3 text-sm text-[rgb(var(--color-error))]',
  resultItem: 'flex flex-col gap-3 rounded-xl border border-[var(--color-border)] bg-block p-4 sm:flex-row sm:items-center sm:justify-between',
};

export default function PDFConverterPage() {
  const { t } = useLanguage();
  const [files, setFiles] = useState<File[]>([]);
  const [conversionType, setConversionType] = useState<'pdf_to_image' | 'pdf_to_text'>('pdf_to_image');
  const [imageFormat, setImageFormat] = useState<'png' | 'jpeg' | 'webp'>('png');
  const [imageQuality, setImageQuality] = useState<'high' | 'medium' | 'low'>('high');
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ConversionResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pdfjsLib, setPdfjsLib] = useState<typeof import('pdfjs-dist') | null>(null);
  const [isClient, setIsClient] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  // 确保只在客户端运行
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 动态导入PDF.js
  useEffect(() => {
    if (!isClient) return;

    const loadPDFJS = async () => {
      try {
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = '/lib/pdfjs-dist/pdf.worker.min.mjs';
        setPdfjsLib(pdfjs);
      } catch (error) {
        console.error('Failed to load PDF.js:', error);
        setError('PDF处理库加载失败');
      }
    };

    loadPDFJS();
  }, [isClient]);

  const handleFileSelect = useCallback((selectedFiles: File[]) => {
    setFiles(selectedFiles);
    setError(null);
  }, []);

  const handleFileError = useCallback((errorMessage: string) => {
    setError(errorMessage);
  }, []);

  // PDF转图片功能
  const convertPDFToImages = async (pdfFile: File): Promise<ConversionResult[]> => {
    if (!pdfjsLib) {
      throw new Error('PDF处理库未加载');
    }

    const arrayBuffer = await pdfFile.arrayBuffer();
    const results: ConversionResult[] = [];

    try {
      // 使用本地PDF.js来加载和渲染PDF
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        // 获取页面
        const page = await pdf.getPage(pageNum);
        
        // 设置渲染比例
        const scale = 2.0; // 提高分辨率
        const viewport = page.getViewport({ scale });

        // 创建canvas
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) continue;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // 渲染页面到canvas
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
          canvas: canvas,
        };

        await page.render(renderContext).promise;

        // 转换canvas为图片
        const quality = imageQuality === 'high' ? 1.0 : imageQuality === 'medium' ? 0.7 : 0.5;
        const mimeType = imageFormat === 'png' ? 'image/png' : imageFormat === 'jpeg' ? 'image/jpeg' : 'image/webp';
        
        // 等待canvas转换为blob
        const blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob((blob) => {
            resolve(blob);
          }, mimeType, quality);
        });

        if (blob) {
          const url = URL.createObjectURL(blob);
          const filename = `${pdfFile.name.replace('.pdf', '')}_page_${pageNum}.${imageFormat}`;
          results.push({
            url,
            filename,
            size: blob.size,
            type: 'image'
          });
        }
      }

      return results;
    } catch (error) {
      console.error('PDF转换错误:', error);
      throw new Error('PDF转换失败');
    }
  };

  const startConversion = async () => {
    if (files.length === 0) {
      setError(t('tools.pdf_converter.errors.no_file'));
      return;
    }

    if (!pdfjsLib) {
      setError('PDF处理库未加载，请刷新页面重试');
      return;
    }

    // 滚动到页面顶部，确保用户能看到进度
    window.scrollTo({ top: 0, behavior: 'smooth' });

    setIsConverting(true);
    setProgress(0);
    setError(null);
    setResults([]);
    
    // 开始转换时滚动到进度条
    setTimeout(() => {
      const progressElement = document.querySelector('[data-progress]');
      if (progressElement) {
        progressElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
    }, 50);

    try {
      const conversionResults: ConversionResult[] = [];

      if (conversionType === 'pdf_to_image') {
        // 只处理PDF文件
        const pdfFiles = files.filter(file => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'));
        if (pdfFiles.length === 0) {
          setError('请选择PDF文件进行转换');
          return;
        }

        for (let i = 0; i < pdfFiles.length; i++) {
          setProgress((i / pdfFiles.length) * 100);
          const results = await convertPDFToImages(pdfFiles[i]);
          conversionResults.push(...results);
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } else if (conversionType === 'pdf_to_text') {
        // PDF转文本功能 - 直接跳转到文件转Markdown工具
        window.open('https://www.jisuxiang.com/tools/file_to_markdown_converter', '_blank');
        return;
      }

      setProgress(100);
      setResults(conversionResults);
      
      // 转换完成后滚动到结果区域
      setTimeout(() => {
        if (resultsRef.current) {
          resultsRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }
      }, 100);
    } catch (err) {
      console.error('转换错误:', err);
      setError(t('tools.pdf_converter.errors.conversion_failed'));
    } finally {
      setIsConverting(false);
    }
  };

  const downloadResult = useCallback((result: ConversionResult) => {
    const link = document.createElement('a');
    link.href = result.url;
    link.download = result.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const clearAll = useCallback(() => {
    // 清理之前的结果URL
    results.forEach(result => URL.revokeObjectURL(result.url));
    setFiles([]);
    setResults([]);
    setError(null);
    setProgress(0);
  }, [results]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 如果不在客户端，显示加载状态
  if (!isClient) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-main text-primary">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-[rgba(var(--color-text-secondary),0.25)] border-r-[rgb(var(--color-primary))]" />
          <p className="text-sm text-secondary">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <ToolHeader 
          toolCode="pdf_converter"
          title={t('tools.pdf_converter.title')}
          description={t('tools.pdf_converter.description')}
          icon={faExchangeAlt}
        />
        
        <div className={styles.content}>
          {/* 转换类型选择 */}
          <section className={styles.card}>
            <div className="mb-5">
              <h3 className={styles.sectionTitle}>转换类型</h3>
              <p className={styles.sectionDescription}>统一选择输出目标，再按对应参数生成文件。</p>
            </div>
            <div className={styles.optionGrid}>
              {(['pdf_to_image', 'pdf_to_text'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setConversionType(type)}
                  className={styles.optionButton(conversionType === type)}
                >
                  <span className="block font-medium text-current">
                    {type === 'pdf_to_image' ? 'PDF 转图片' : 'PDF 转文本'}
                  </span>
                  <span className="mt-1 block text-sm text-secondary">
                    {type === 'pdf_to_image' ? '按页导出 PNG、JPEG 或 WebP。' : '跳转到更适合文本提取的工具。'}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* PDF转文本提示 */}
          {conversionType === 'pdf_to_text' && (
            <div className={styles.hintBox}>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="mb-2 font-medium text-primary">推荐使用文件转 Markdown 工具</p>
                  <p className="text-sm text-secondary">
                    PDF转文本功能建议使用我们的文件转Markdown工具，支持更好的文本提取和格式转换。
                  </p>
                </div>
                <a
                  href="https://www.jisuxiang.com/tools/file_to_markdown_converter"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary inline-flex items-center justify-center px-4 py-2"
                >
                  打开工具
                </a>
              </div>
            </div>
          )}

          {/* 转换设置 */}
          <section className={styles.card}>
            <div className="mb-5">
              <h3 className={styles.sectionTitle}>转换设置</h3>
              <p className={styles.sectionDescription}>按输出格式调整图片编码和质量。</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {conversionType === 'pdf_to_image' && (
                <>
                  <div>
                    <label className={styles.fieldLabel}>
                      图片格式
                    </label>
                    <select
                      value={imageFormat}
                      onChange={(e) => setImageFormat(e.target.value as 'png' | 'jpeg' | 'webp')}
                      className={styles.select}
                    >
                      <option value="png">PNG</option>
                      <option value="jpeg">JPEG</option>
                      <option value="webp">WebP</option>
                    </select>
                  </div>
                  <div>
                    <label className={styles.fieldLabel}>
                      图片质量
                    </label>
                    <select
                      value={imageQuality}
                      onChange={(e) => setImageQuality(e.target.value as 'high' | 'medium' | 'low')}
                      className={styles.select}
                    >
                      <option value="high">高质量</option>
                      <option value="medium">中等质量</option>
                      <option value="low">低质量</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* 文件上传 - 在PDF转文本时隐藏 */}
          {conversionType !== 'pdf_to_text' && (
            <section className={styles.card}>
              <div className="mb-5">
                <h3 className={styles.sectionTitle}>上传 PDF 文件</h3>
                <p className={styles.sectionDescription}>支持批量上传，导出结果会按页拆分。</p>
              </div>
              <FileUpload
                accept=".pdf"
                maxSize={100 * 1024 * 1024}
                multiple={true}
                onFileSelect={handleFileSelect}
                onError={handleFileError}
                title="上传PDF文件"
                subtitle="支持拖拽上传，最大100MB"
                buttonText="选择文件"
              />
            </section>
          )}

          {/* 错误提示 */}
          {error && (
            <div className={styles.alert}>
              {error}
            </div>
          )}

          {/* 转换进度 */}
          {isConverting && (
            <div data-progress>
              <ProgressBar
                progress={progress}
                status="正在转换..."
                onCancel={() => setIsConverting(false)}
              />
            </div>
          )}

          {/* 操作按钮 */}
          {files.length > 0 && !isConverting && conversionType !== 'pdf_to_text' && (
            <div className="flex flex-wrap gap-3">
              <ActionButton
                onClick={startConversion}
                loading={isConverting}
                disabled={files.length === 0 || !pdfjsLib}
              >
                开始转换
              </ActionButton>
              <ActionButton
                onClick={clearAll}
                variant="secondary"
              >
                清空
              </ActionButton>
            </div>
          )}

          {/* 转换结果 */}
          {results.length > 0 && (
            <section ref={resultsRef} className={styles.card}>
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h3 className={styles.sectionTitle}>转换结果</h3>
                  <p className={styles.sectionDescription}>按页输出的文件会统一列在这里。</p>
                </div>
                <div className="rounded-full border border-[var(--color-border)] px-3 py-1 text-xs text-secondary">
                  {results.length} 个文件
                </div>
              </div>
              <div className="space-y-3">
                {results.map((result, index) => (
                  <div key={index} className={styles.resultItem}>
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-sm font-medium text-primary">{result.filename}</p>
                        <p className="text-xs text-secondary">{formatFileSize(result.size)}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <ActionButton
                        onClick={() => downloadResult(result)}
                        variant="primary"
                        size="sm"
                        icon={faDownload}
                      >
                        下载
                      </ActionButton>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
} 
