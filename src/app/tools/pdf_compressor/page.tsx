'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import ToolHeader from '@/components/ToolHeader';
import FileUpload from '@/components/FileUpload';
import ActionButton from '@/components/ActionButton';
import ProgressBar from '@/components/ProgressBar';
import { faCompress, faDownload } from '@fortawesome/free-solid-svg-icons';

interface CompressionResult {
  url: string;
  filename: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

interface CompressionSettings {
  quality: 'high' | 'medium' | 'low';
  imageCompression: boolean;
  fontSubsetting: boolean;
  metadataRemoval: boolean;
  removeBookmarks: boolean;
  removeAnnotations: boolean;
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
  checkboxRow: 'flex items-start gap-3 rounded-lg border border-[var(--color-border)] bg-block px-4 py-3',
  checkbox: 'mt-0.5 h-4 w-4 rounded border-[var(--color-border)] bg-transparent accent-[rgb(var(--color-primary))]',
  alert: 'rounded-xl border border-[rgba(var(--color-error),0.24)] bg-[rgba(var(--color-error),0.08)] px-4 py-3 text-sm text-[rgb(var(--color-error))]',
  resultItem: 'rounded-xl border border-[var(--color-border)] bg-block p-4',
  metricBox: 'rounded-lg border border-[var(--color-border)] bg-[rgba(var(--color-bg-main),0.35)] px-3 py-2',
};

export default function PDFCompressorPage() {
  const { t } = useLanguage();
  const [files, setFiles] = useState<File[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<CompressionResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pdfjsLib, setPdfjsLib] = useState<typeof import('pdfjs-dist') | null>(null);
  const [isClient, setIsClient] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const [settings, setSettings] = useState<CompressionSettings>({
    quality: 'medium',
    imageCompression: true,
    fontSubsetting: true,
    metadataRemoval: false,
    removeBookmarks: false,
    removeAnnotations: false,
  });

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
        setError(t('tools.pdf_compressor.errors.library_failed'));
      }
    };

    loadPDFJS();
  }, [isClient, t]);

  const handleFileSelect = useCallback((selectedFiles: File[]) => {
    setFiles(selectedFiles);
    setError(null);
  }, []);

  const handleFileError = useCallback((errorMessage: string) => {
    setError(errorMessage);
  }, []);

  // 压缩PDF文件
  const compressPDF = async (pdfFile: File): Promise<CompressionResult> => {
    if (!pdfjsLib) {
      throw new Error('PDF处理库未加载');
    }

    const arrayBuffer = await pdfFile.arrayBuffer();
    const originalSize = pdfFile.size;

    try {
      // 使用PDF.js加载PDF
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;

      // 创建新的PDF文档
      const { PDFDocument } = await import('pdf-lib');
      const newPdfDoc = await PDFDocument.create();

      // 根据质量设置确定压缩参数
      const qualitySettings = {
        high: { imageQuality: 0.8, imageScale: 1.0 },
        medium: { imageQuality: 0.6, imageScale: 0.8 },
        low: { imageQuality: 0.4, imageScale: 0.6 }
      };

      const currentQuality = qualitySettings[settings.quality];

      // 处理每一页
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        setProgress((pageNum / numPages) * 80); // 80%用于页面处理

        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: currentQuality.imageScale });

        // 创建canvas渲染页面
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) continue;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
          canvas: canvas,
        };

        await page.render(renderContext).promise;

        // 将canvas转换为图片
        const imageBlob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((blob) => {
            resolve(blob!);
          }, 'image/jpeg', currentQuality.imageQuality);
        });

        // 将图片嵌入到新PDF中
        const imageBytes = await imageBlob.arrayBuffer();
        const image = await newPdfDoc.embedJpg(imageBytes);
        const pageWidth = viewport.width;
        const pageHeight = viewport.height;

        const newPage = newPdfDoc.addPage([pageWidth, pageHeight]);
        newPage.drawImage(image, {
          x: 0,
          y: 0,
          width: pageWidth,
          height: pageHeight,
        });
      }

      // 生成压缩后的PDF
      const compressedPdfBytes = await newPdfDoc.save({
        useObjectStreams: true,
        addDefaultPage: false,
        objectsPerTick: 20,
        updateFieldAppearances: false,
      });

      setProgress(90);

      // 创建Blob和URL
      const compressedBlob = new Blob([compressedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(compressedBlob);
      const filename = pdfFile.name.replace('.pdf', '_compressed.pdf');
      const compressedSize = compressedBlob.size;
      const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;

      setProgress(100);

      return {
        url,
        filename,
        originalSize,
        compressedSize,
        compressionRatio,
      };
    } catch (error) {
      console.error('PDF压缩错误:', error);
      throw new Error('PDF压缩失败');
    }
  };

  const startCompression = async () => {
    if (files.length === 0) {
      setError(t('tools.pdf_compressor.errors.no_file'));
      return;
    }

    if (!pdfjsLib) {
      setError(t('tools.pdf_compressor.errors.library_failed'));
      return;
    }
    
    // 滚动到页面顶部，确保用户能看到进度
    window.scrollTo({ top: 0, behavior: 'smooth' });

    setIsCompressing(true);
    setProgress(0);
    setError(null);
    setResults([]);
    
    // 开始压缩时滚动到进度条
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
      const compressionResults: CompressionResult[] = [];

      // 只处理PDF文件
      const pdfFiles = files.filter(file => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'));
      if (pdfFiles.length === 0) {
        setError(t('tools.pdf_compressor.errors.invalid_format'));
        return;
      }

      for (let i = 0; i < pdfFiles.length; i++) {
        setProgress((i / pdfFiles.length) * 10); // 前10%用于文件准备
        const result = await compressPDF(pdfFiles[i]);
        compressionResults.push(result);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setResults(compressionResults);
      
      // 压缩完成后滚动到结果区域
      setTimeout(() => {
        if (resultsRef.current) {
          resultsRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }
      }, 100);
    } catch (err) {
      console.error('压缩错误:', err);
      setError(t('tools.pdf_compressor.errors.compression_failed'));
    } finally {
      setIsCompressing(false);
    }
  };

  const downloadResult = useCallback((result: CompressionResult) => {
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
          toolCode="pdf_compressor"
          title={t('tools.pdf_compressor.title')}
          description={t('tools.pdf_compressor.description')}
          icon={faCompress}
        />
        
        <div className={styles.content}>
          {/* 压缩设置 */}
          <section className={styles.card}>
            <div className="mb-5">
              <h3 className={styles.sectionTitle}>{t('tools.pdf_compressor.compression_settings.title')}</h3>
              <p className={styles.sectionDescription}>使用统一的输出质量和优化开关控制压缩结果。</p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,220px)_minmax(0,1fr)]">
              <div>
                <label className={styles.fieldLabel}>
                  {t('tools.pdf_compressor.compression_settings.quality')}
                </label>
                <select
                  value={settings.quality}
                  onChange={(e) => setSettings(prev => ({ ...prev, quality: e.target.value as 'high' | 'medium' | 'low' }))}
                  className={styles.select}
                >
                  <option value="high">{t('tools.pdf_compressor.compression_settings.quality_high')}</option>
                  <option value="medium">{t('tools.pdf_compressor.compression_settings.quality_medium')}</option>
                  <option value="low">{t('tools.pdf_compressor.compression_settings.quality_low')}</option>
                </select>
              </div>
              
              <div className="grid gap-3 sm:grid-cols-2">
                <div className={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    id="imageCompression"
                    checked={settings.imageCompression}
                    onChange={(e) => setSettings(prev => ({ ...prev, imageCompression: e.target.checked }))}
                    className={styles.checkbox}
                  />
                  <label htmlFor="imageCompression" className="flex-1 text-sm text-primary">
                    <span className="block font-medium">{t('tools.pdf_compressor.compression_settings.image_compression')}</span>
                    <span className="mt-1 block text-xs text-secondary">通过页面重采样降低图片体积。</span>
                  </label>
                </div>
                
                <div className={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    id="fontSubsetting"
                    checked={settings.fontSubsetting}
                    onChange={(e) => setSettings(prev => ({ ...prev, fontSubsetting: e.target.checked }))}
                    className={styles.checkbox}
                  />
                  <label htmlFor="fontSubsetting" className="flex-1 text-sm text-primary">
                    <span className="block font-medium">{t('tools.pdf_compressor.compression_settings.font_subsetting')}</span>
                    <span className="mt-1 block text-xs text-secondary">保留必要字体资源，减少冗余嵌入。</span>
                  </label>
                </div>
                
                <div className={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    id="metadataRemoval"
                    checked={settings.metadataRemoval}
                    onChange={(e) => setSettings(prev => ({ ...prev, metadataRemoval: e.target.checked }))}
                    className={styles.checkbox}
                  />
                  <label htmlFor="metadataRemoval" className="flex-1 text-sm text-primary">
                    <span className="block font-medium">{t('tools.pdf_compressor.compression_settings.metadata_removal')}</span>
                    <span className="mt-1 block text-xs text-secondary">移除文档元信息，进一步压缩输出。</span>
                  </label>
                </div>
              </div>
            </div>
          </section>

          {/* 文件上传 */}
          <section className={styles.card}>
            <div className="mb-5">
              <h3 className={styles.sectionTitle}>{t('tools.pdf_compressor.upload_area.title')}</h3>
              <p className={styles.sectionDescription}>{t('tools.pdf_compressor.upload_area.subtitle')}</p>
            </div>
            <FileUpload
              accept=".pdf"
              maxSize={100 * 1024 * 1024}
              multiple={true}
              onFileSelect={handleFileSelect}
              onError={handleFileError}
              title={t('tools.pdf_compressor.upload_area.title')}
              subtitle={t('tools.pdf_compressor.upload_area.subtitle')}
              buttonText={t('tools.pdf_compressor.upload_area.button')}
            />
          </section>

          {/* 错误提示 */}
          {error && (
            <div className={styles.alert}>
              {error}
            </div>
          )}

          {/* 压缩进度 */}
          {isCompressing && (
            <div data-progress>
              <ProgressBar
                progress={progress}
                status={t('tools.pdf_compressor.status.compressing')}
                onCancel={() => setIsCompressing(false)}
              />
            </div>
          )}

          {/* 操作按钮 */}
          {files.length > 0 && !isCompressing && (
            <div className="flex flex-wrap gap-3">
              <ActionButton
                onClick={startCompression}
                loading={isCompressing}
                disabled={files.length === 0 || !pdfjsLib}
              >
                {t('tools.pdf_compressor.actions.compress')}
              </ActionButton>
              <ActionButton
                onClick={clearAll}
                variant="secondary"
              >
                {t('tools.pdf_compressor.actions.clear')}
              </ActionButton>
            </div>
          )}

          {/* 压缩结果 */}
          {results.length > 0 && (
            <section ref={resultsRef} className={styles.card}>
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h3 className={styles.sectionTitle}>{t('tools.pdf_compressor.results.title')}</h3>
                  <p className={styles.sectionDescription}>查看每个输出文件的压缩体积和变化比例。</p>
                </div>
                <div className="rounded-full border border-[var(--color-border)] px-3 py-1 text-xs text-secondary">
                  {results.length} 个结果
                </div>
              </div>

              <div className="space-y-3">
                {results.map((result, index) => (
                  <div key={index} className={styles.resultItem}>
                    <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-primary">{result.filename}</p>
                        <p className="text-xs text-secondary">
                          {t('tools.pdf_compressor.results.original_size')}: {formatFileSize(result.originalSize)}
                        </p>
                        <p className="text-xs text-secondary">
                          {t('tools.pdf_compressor.results.compressed_size')}: {formatFileSize(result.compressedSize)}
                        </p>
                      </div>
                      <div className={`${styles.metricBox} text-left md:text-right`}>
                        <p className="mb-1 text-[11px] uppercase tracking-[0.18em] text-secondary">压缩比</p>
                        <p className={`text-sm font-semibold ${
                          result.compressionRatio > 0 ? 'text-success' : 'text-error'
                        }`}>
                          {result.compressionRatio > 0 ? '-' : '+'}{Math.abs(result.compressionRatio).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <ActionButton
                        onClick={() => downloadResult(result)}
                        variant="primary"
                        size="sm"
                        icon={faDownload}
                      >
                        {t('tools.pdf_compressor.actions.download')}
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
