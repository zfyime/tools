'use client';

import React, { useState, useRef, useEffect, ChangeEvent } from 'react';
import { Canvas, Image as FabricImage, Text, Object as FabricObject, Shadow } from 'fabric';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUpload, faDownload, faTrash, 
  faImage, faFont, faLayerGroup, faShield 
} from '@fortawesome/free-solid-svg-icons';
import ToolHeader from '@/components/ToolHeader';
import { useLanguage } from '@/context/LanguageContext';

// 页面样式
const styles = {
  container: "min-h-screen flex flex-col max-w-[1440px] mx-auto p-4 md:p-6",
  card: "card p-6 mb-6",
  inputLabel: "block text-secondary text-sm font-bold mb-2",
  fileUploadBtn: "btn-primary flex items-center justify-center cursor-pointer",
  fileName: "ml-3 text-secondary text-sm",
  heading: "text-lg font-semibold mb-2 text-primary",
  settingsContainer: "space-y-4",
  rangeInput: "w-full accent-[rgb(var(--color-primary))]",
  textInput: "search-input w-full",
  infoPanel: "bg-block p-4 rounded-lg border border-purple-glow/15",
  infoPanelRow: "flex justify-between mb-2",
  infoLabel: "text-secondary",
  infoValue: "font-medium text-primary",
  successValue: "font-medium text-success",
  actionBtn: "w-full",
  actionBtnDisabled: "btn-secondary opacity-50 cursor-not-allowed w-full",
  imageContainer: "bg-block rounded-lg p-4 min-h-64 flex items-center justify-center border border-purple-glow/15",
  image: "max-w-full max-h-96 object-contain",
  placeholder: "text-tertiary",
  radioGroup: "flex flex-wrap gap-2 mb-4",
  radioItem: "flex items-center",
  radioLabel: "ml-2 text-secondary",
  tabButton: "px-4 py-2 rounded-t-lg",
  tabButtonActive: "bg-block border-b-2 border-primary text-primary",
  tabButtonInactive: "text-secondary hover:text-primary"
};

// 位置选项
type WatermarkPosition = 
  'top-left' | 'top-center' | 'top-right' | 
  'middle-left' | 'middle-center' | 'middle-right' | 
  'bottom-left' | 'bottom-center' | 'bottom-right' | 'tile';

// 保护级别
type ProtectionLevel = 'standard' | 'enhanced' | 'professional';

// 水印类型
type WatermarkType = 'text' | 'image';

export default function ImageWatermark() {
  const { t } = useLanguage();
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [watermarkedImage, setWatermarkedImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [processing, setProcessing] = useState<boolean>(false);
  
  // 水印设置
  const [watermarkType, setWatermarkType] = useState<WatermarkType>('text');
  const [watermarkText, setWatermarkText] = useState<string>('我是水印文本');
  const [fontFamily, setFontFamily] = useState<string>('system-ui, -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, sans-serif');
  const [fontSize, setFontSize] = useState<number>(24);
  const [fontColor, setFontColor] = useState<string>('#ffffff');
  const [fontOpacity, setFontOpacity] = useState<number>(60);
  const [fontWeight, setFontWeight] = useState<string>('normal');
  
  // 图片水印设置
  const [watermarkImageSrc, setWatermarkImageSrc] = useState<string | null>(null);
  const [imageOpacity, setImageOpacity] = useState<number>(50);
  const [imageScale, setImageScale] = useState<number>(50);
  
  // 位置设置
  const [position, setPosition] = useState<WatermarkPosition>('bottom-right');
  const [offsetX, setOffsetX] = useState<number>(10);
  const [offsetY, setOffsetY] = useState<number>(10);
  const [rotation, setRotation] = useState<number>(0);
  
  // 高级设置
  const [protectionLevel, setProtectionLevel] = useState<ProtectionLevel>('standard');
  
  // DOM引用
  const fileInputRef = useRef<HTMLInputElement>(null);
  const watermarkImageInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<Canvas | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // 处理图片上传
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setWatermarkedImage(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      setOriginalImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // 处理水印图片上传
  const handleWatermarkImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setWatermarkImageSrc(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // 根据位置计算水印坐标
  const getPositionCoordinates = (
    canvasWidth: number, 
    canvasHeight: number, 
    watermarkWidth: number, 
    watermarkHeight: number
  ): { x: number, y: number } => {
    const padding = { x: offsetX, y: offsetY };
    
    switch(position) {
      case 'top-left':
        return { x: padding.x, y: padding.y };
      case 'top-center':
        return { x: canvasWidth / 2 - watermarkWidth / 2, y: padding.y };
      case 'top-right':
        return { x: canvasWidth - watermarkWidth - padding.x, y: padding.y };
      case 'middle-left':
        return { x: padding.x, y: canvasHeight / 2 - watermarkHeight / 2 };
      case 'middle-center':
        return { x: canvasWidth / 2 - watermarkWidth / 2, y: canvasHeight / 2 - watermarkHeight / 2 };
      case 'middle-right':
        return { x: canvasWidth - watermarkWidth - padding.x, y: canvasHeight / 2 - watermarkHeight / 2 };
      case 'bottom-left':
        return { x: padding.x, y: canvasHeight - watermarkHeight - padding.y };
      case 'bottom-center':
        return { x: canvasWidth / 2 - watermarkWidth / 2, y: canvasHeight - watermarkHeight - padding.y };
      case 'bottom-right':
        return { x: canvasWidth - watermarkWidth - padding.x, y: canvasHeight - watermarkHeight - padding.y };
      default:
        return { x: padding.x, y: padding.y };
    }
  };

  // 初始化Canvas
  useEffect(() => {
    if (!originalImage || !canvasContainerRef.current) return;
    
    // 清理之前的Canvas
    if (canvasRef.current) {
      canvasRef.current.dispose();
    }
    
    const img = new window.Image();
    img.src = originalImage;
    img.onload = () => {
      if (!canvasContainerRef.current) return;
      
      // 创建新的Canvas实例
      const canvas = new Canvas('watermark-canvas', {
        width: img.width,
        height: img.height
      });
      
      canvasRef.current = canvas;
      
      // 添加原始图片到Canvas - 修复类型问题
      FabricImage.fromURL(originalImage).then(imgObj => {
        canvas.add(imgObj);
        canvas.renderAll();
      });
    };
    
    return () => {
      if (canvasRef.current) {
        canvasRef.current.dispose();
      }
    };
  }, [originalImage]);

  // 应用水印
  const applyWatermark = () => {
    if (!canvasRef.current || !originalImage) return;
    
    setProcessing(true);
    
    const canvas = canvasRef.current;
    
    // 移除之前的水印
    const objects = canvas.getObjects();
    if (objects.length > 1) {
      for (let i = 1; i < objects.length; i++) {
        canvas.remove(objects[i]);
      }
    }
    
    // 根据保护级别添加额外处理
    const applyProtectionEffects = (watermarkObj: FabricObject) => {
      if (protectionLevel === 'standard') {
        // 标准级别不做额外处理
        return watermarkObj;
      } else if (protectionLevel === 'enhanced') {
        // 增强级别: 增加阴影和轻微变形
        watermarkObj.set({
          shadow: new Shadow({
            color: 'rgba(0,0,0,0.3)',
            blur: 3,
            offsetX: 2,
            offsetY: 2
          }),
          skewX: Math.random() * 5 - 2.5,
        });
        return watermarkObj;
      } else {
        // 专业级别: 更多随机效果和扭曲
        watermarkObj.set({
          shadow: new Shadow({
            color: 'rgba(0,0,0,0.4)',
            blur: 5,
            offsetX: 3,
            offsetY: 3
          }),
          skewX: Math.random() * 8 - 4,
          skewY: Math.random() * 3 - 1.5,
          opacity: fontOpacity / 100 * (0.9 + Math.random() * 0.2)
        });
        return watermarkObj;
      }
    };
    
    const addWatermark = () => {
      if (!canvas) return;
      
      if (position === 'tile') {
        // 实现平铺水印
        addTiledWatermark();
      } else {
        // 添加单个水印
        addSingleWatermark();
      }
      
      // 完成渲染
      setTimeout(() => {
        const dataUrl = canvas.toDataURL({
          format: 'png',
          quality: 1,
          multiplier: 1
        });
        setWatermarkedImage(dataUrl);
        setProcessing(false);
      }, 300);
    };
    
    const addSingleWatermark = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      if (watermarkType === 'text') {
        // 添加文字水印
        const text = new Text(watermarkText, {
          fontFamily,
          fontSize,
          fill: fontColor,
          opacity: fontOpacity / 100,
          fontWeight,
          angle: rotation,
        });
        
        const { x, y } = getPositionCoordinates(
          canvas.getWidth(), 
          canvas.getHeight(), 
          text.width || 0, 
          text.height || 0
        );
        
        text.set({ left: x, top: y });
        applyProtectionEffects(text);
        canvas.add(text);
      } else if (watermarkType === 'image' && watermarkImageSrc) {
        // 添加图片水印 - 修复类型问题
        FabricImage.fromURL(watermarkImageSrc).then(imgObj => {
          const scale = imageScale / 100;
          imgObj.scale(scale);
          imgObj.set({
            opacity: imageOpacity / 100,
            angle: rotation
          });
          
          const { x, y } = getPositionCoordinates(
            canvas.getWidth(), 
            canvas.getHeight(), 
            (imgObj.width || 0) * scale, 
            (imgObj.height || 0) * scale
          );
          
          imgObj.set({ left: x, top: y });
          applyProtectionEffects(imgObj);
          canvas.add(imgObj);
          canvas.renderAll();
        });
      }
    };
    
    const addTiledWatermark = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      // 平铺水印实现...
      if (watermarkType === 'text') {
        // 文字水印平铺
        // 根据文字长度和字体大小计算合理的平铺间距
        const textObj = new Text(watermarkText, {
          fontFamily,
          fontSize,
          fontWeight
        });
        
        // 计算实际文字宽度和高度
        const textWidth = textObj.width || fontSize * watermarkText.length;
        const textHeight = textObj.height || fontSize * 1.2;
        
        // 设置合理的间距，基于文字大小和内容
        const spacingX = Math.max(textWidth * 1.5, fontSize * 8);
        const spacingY = Math.max(textHeight * 2.5, fontSize * 6);
        
        // 创建平铺模式
        const canvasWidth = canvas.getWidth();
        const canvasHeight = canvas.getHeight();
        
        // 添加随机性，使平铺更自然
        for (let x = 0; x < canvasWidth; x += spacingX) {
          for (let y = 0; y < canvasHeight; y += spacingY) {
            // 添加轻微的随机偏移，使水印不完全对齐
            const randomOffsetX = Math.random() * fontSize - fontSize/2;
            const randomOffsetY = Math.random() * fontSize - fontSize/2;
            
            const textClone = new Text(watermarkText, {
              fontFamily,
              fontSize,
              fill: fontColor,
              opacity: fontOpacity / 100,
              fontWeight,
              angle: rotation,
              left: x + offsetX + randomOffsetX, 
              top: y + offsetY + randomOffsetY
            });
            applyProtectionEffects(textClone);
            canvas.add(textClone);
          }
        }
      } else if (watermarkType === 'image' && watermarkImageSrc) {
        // 为避免嵌套过深，先获取一次图片信息
        FabricImage.fromURL(watermarkImageSrc).then(imgObj => {
          const scale = imageScale / 100;
          // 增加图片之间的间距，防止重叠
          const imgWidth = (imgObj.width || 0) * scale;
          const imgHeight = (imgObj.height || 0) * scale;
          
          // 设置间距为图片尺寸的两倍
          const spacingX = imgWidth * 2.5;
          const spacingY = imgHeight * 2.5;
          
          const canvasWidth = canvas.getWidth();
          const canvasHeight = canvas.getHeight();
          
          let tilesAdded = 0;
          const totalTiles = Math.ceil(canvasWidth / spacingX) * Math.ceil(canvasHeight / spacingY);
          
          // 创建平铺模式，添加轻微随机性
          for (let x = 0; x < canvasWidth; x += spacingX) {
            for (let y = 0; y < canvasHeight; y += spacingY) {
              // 为每个位置创建新的图片实例
              const currentX = x;
              const currentY = y;
              
              // 添加轻微的随机偏移
              const randomOffsetX = Math.random() * imgWidth * 0.4 - imgWidth * 0.2;
              const randomOffsetY = Math.random() * imgHeight * 0.4 - imgHeight * 0.2;
              
              FabricImage.fromURL(watermarkImageSrc).then(tileImgObj => {
                tileImgObj.scale(scale);
                tileImgObj.set({
                  left: currentX + offsetX + randomOffsetX,
                  top: currentY + offsetY + randomOffsetY,
                  opacity: imageOpacity / 100,
                  angle: rotation
                });
                applyProtectionEffects(tileImgObj);
                canvas.add(tileImgObj);
                
                tilesAdded++;
                // 只在最后一个水印添加后再渲染
                if (tilesAdded >= totalTiles) {
                  canvas.renderAll();
                }
              });
            }
          }
        });
      }
    };
    
    // 执行水印添加
    addWatermark();
  };

  // 下载处理后的图片
  const downloadImage = () => {
    if (!watermarkedImage) return;
    
    const link = document.createElement('a');
    const ext = fileName.split('.').pop() || 'png';
    const newFileName = fileName.replace(/\.[^/.]+$/, '') + '.watermarked.' + ext;
    
    link.href = watermarkedImage;
    link.download = newFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 重置所有
  const resetAll = () => {
    setOriginalImage(null);
    setWatermarkedImage(null);
    setFileName('');
    setWatermarkImageSrc(null);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    if (watermarkImageInputRef.current) {
      watermarkImageInputRef.current.value = '';
    }
  };

  // 渲染UI
  return (
    <div className={styles.container}>
      {/* 工具头部 */}
      <ToolHeader 
        icon={faImage}
        toolCode="image_watermark"
        title={t('tools.image_watermark.title')}
        description={t('tools.image_watermark.description')}
      />
      
      {/* 主要内容区 */}
      <div className={styles.card}>
        <div className="mb-6">
          <label className={styles.inputLabel}>
            {t('tools.image_watermark.select_image')}
          </label>
          <div className="flex items-center">
            <label className={styles.fileUploadBtn}>
              <FontAwesomeIcon icon={faUpload} className="mr-2 icon" />
              {t('tools.image_watermark.choose_file')}
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
                ref={fileInputRef}
              />
            </label>
            {fileName && (
              <span className={styles.fileName}>{fileName}</span>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 左侧设置区域 */}
          <div>
            {originalImage && (
              <>
                <h3 className={styles.heading}>{t('tools.image_watermark.watermark_settings')}</h3>
                
                {/* 水印类型选择 */}
                <div className="mb-4">
                  <label className={styles.inputLabel}>
                    {t('tools.image_watermark.watermark_type')}
                  </label>
                  <div className={styles.radioGroup}>
                    <div className={styles.radioItem}>
                      <input 
                        type="radio" 
                        id="text-watermark" 
                        name="watermark-type" 
                        checked={watermarkType === 'text'}
                        onChange={() => setWatermarkType('text')}
                      />
                      <label htmlFor="text-watermark" className={styles.radioLabel}>
                        <FontAwesomeIcon icon={faFont} className="mr-1" />
                        {t('tools.image_watermark.text_watermark')}
                      </label>
                    </div>
                    <div className={styles.radioItem}>
                      <input 
                        type="radio" 
                        id="image-watermark" 
                        name="watermark-type" 
                        checked={watermarkType === 'image'}
                        onChange={() => setWatermarkType('image')}
                      />
                      <label htmlFor="image-watermark" className={styles.radioLabel}>
                        <FontAwesomeIcon icon={faImage} className="mr-1" />
                        {t('tools.image_watermark.image_watermark')}
                      </label>
                    </div>
                  </div>
                </div>
                
                {/* 文字水印设置 */}
                {watermarkType === 'text' && (
                  <div className="mb-4 space-y-4">
                    <h4 className="text-secondary font-medium">
                      {t('tools.image_watermark.text_settings')}
                    </h4>
                    
                    <div>
                      <label className={styles.inputLabel}>
                        {t('tools.image_watermark.watermark_text')}
                      </label>
                      <input
                        type="text"
                        className={styles.textInput}
                        value={watermarkText}
                        onChange={(e) => setWatermarkText(e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <label className={styles.inputLabel}>
                        {t('tools.image_watermark.font_family')}
                      </label>
                      <select
                        className={styles.textInput}
                        value={fontFamily}
                        onChange={(e) => setFontFamily(e.target.value)}
                      >
                        <option value="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif">系统默认字体</option>
                        <option value="Arial, Helvetica, sans-serif">Arial</option>
                        <option value="'Segoe UI', Tahoma, Geneva, Verdana, sans-serif">Segoe UI</option>
                        <option value="'PingFang SC', 'Microsoft YaHei', 'Heiti SC', sans-serif">中文黑体</option>
                        <option value="'SimSun', 'STSong', serif">中文宋体</option>
                        <option value="'Times New Roman', Times, serif">Times New Roman</option>
                        <option value="Georgia, Cambria, 'Times New Roman', Times, serif">Georgia</option>
                        <option value="'Courier New', Courier, monospace">Courier New</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className={styles.inputLabel}>
                        {t('tools.image_watermark.font_size')} ({fontSize}px)
                      </label>
                      <input
                        type="range"
                        min="8"
                        max="72"
                        value={fontSize}
                        onChange={(e) => setFontSize(parseInt(e.target.value))}
                        className={styles.rangeInput}
                      />
                    </div>
                    
                    <div>
                      <label className={styles.inputLabel}>
                        {t('tools.image_watermark.font_color')}
                      </label>
                      <input
                        type="color"
                        className="w-full h-8 rounded cursor-pointer"
                        value={fontColor}
                        onChange={(e) => setFontColor(e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <label className={styles.inputLabel}>
                        {t('tools.image_watermark.font_opacity')} ({fontOpacity}%)
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="100"
                        value={fontOpacity}
                        onChange={(e) => setFontOpacity(parseInt(e.target.value))}
                        className={styles.rangeInput}
                      />
                    </div>
                    
                    <div>
                      <label className={styles.inputLabel}>
                        {t('tools.image_watermark.font_weight')}
                      </label>
                      <select
                        className={styles.textInput}
                        value={fontWeight}
                        onChange={(e) => setFontWeight(e.target.value)}
                      >
                        <option value="normal">Normal</option>
                        <option value="bold">Bold</option>
                      </select>
                    </div>
                  </div>
                )}
                
                {/* 图片水印设置 */}
                {watermarkType === 'image' && (
                  <div className="mb-4 space-y-4">
                    <h4 className="text-secondary font-medium">
                      {t('tools.image_watermark.image_settings')}
                    </h4>
                    
                    <div>
                      <label className={styles.inputLabel}>
                        {t('tools.image_watermark.select_watermark_image')}
                      </label>
                      <label className={styles.fileUploadBtn}>
                        <FontAwesomeIcon icon={faUpload} className="mr-2 icon" />
                        {t('tools.image_watermark.choose_file')}
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleWatermarkImageChange}
                          ref={watermarkImageInputRef}
                        />
                      </label>
                      {watermarkImageSrc && (
                        <div className="mt-2 max-w-[150px] max-h-[100px] overflow-hidden rounded border border-purple-glow/20">
                          <img src={watermarkImageSrc} alt="Watermark" className="max-w-full object-contain" />
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <label className={styles.inputLabel}>
                        {t('tools.image_watermark.image_opacity')} ({imageOpacity}%)
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="100"
                        value={imageOpacity}
                        onChange={(e) => setImageOpacity(parseInt(e.target.value))}
                        className={styles.rangeInput}
                      />
                    </div>
                    
                    <div>
                      <label className={styles.inputLabel}>
                        {t('tools.image_watermark.image_scale')} ({imageScale}%)
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="100"
                        value={imageScale}
                        onChange={(e) => setImageScale(parseInt(e.target.value))}
                        className={styles.rangeInput}
                      />
                    </div>
                  </div>
                )}
                
                {/* 位置设置 */}
                <div className="mb-4 space-y-4">
                  <h4 className="text-secondary font-medium">
                    {t('tools.image_watermark.position_settings')}
                  </h4>
                  
                  <div>
                    <label className={styles.inputLabel}>
                      {t('tools.image_watermark.position')}
                    </label>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      {[
                        'top-left', 'top-center', 'top-right',
                        'middle-left', 'middle-center', 'middle-right',
                        'bottom-left', 'bottom-center', 'bottom-right'
                      ].map((pos) => (
                        <button
                          key={pos}
                          type="button"
                          className={`p-2 rounded text-sm cursor-pointer transition-all duration-200 ${
                            position === pos 
                              ? 'bg-[rgb(var(--color-primary))] text-[rgb(var(--color-bg-main))] shadow-sm border border-[var(--color-border)]' 
                              : 'bg-block border border-purple-glow/20 hover:border-primary/50 hover:bg-primary/10'
                          }`}
                          onClick={() => setPosition(pos as WatermarkPosition)}
                        >
                          {t(`tools.image_watermark.${pos.replace('-', '_')}`)}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center mt-2">
                      <button
                        type="button"
                        className={`p-2 w-full rounded text-sm cursor-pointer transition-all duration-200 ${
                          position === 'tile' 
                            ? 'bg-[rgb(var(--color-primary))] text-[rgb(var(--color-bg-main))] shadow-sm border border-[var(--color-border)]' 
                            : 'bg-block border border-purple-glow/20 hover:border-primary/50 hover:bg-primary/10'
                        }`}
                        onClick={() => setPosition(position === 'tile' ? 'bottom-right' : 'tile')}
                      >
                        {t('tools.image_watermark.tile')}
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className={styles.inputLabel}>
                      {t('tools.image_watermark.offset_x')} ({offsetX}px)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={offsetX}
                      onChange={(e) => setOffsetX(parseInt(e.target.value))}
                      className={styles.rangeInput}
                    />
                  </div>
                  
                  <div>
                    <label className={styles.inputLabel}>
                      {t('tools.image_watermark.offset_y')} ({offsetY}px)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={offsetY}
                      onChange={(e) => setOffsetY(parseInt(e.target.value))}
                      className={styles.rangeInput}
                    />
                  </div>
                  
                  <div>
                    <label className={styles.inputLabel}>
                      {t('tools.image_watermark.rotation')} ({rotation}°)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={rotation}
                      onChange={(e) => setRotation(parseInt(e.target.value))}
                      className={styles.rangeInput}
                    />
                  </div>
                </div>
                
                {/* 高级设置 */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-secondary font-medium">
                      {t('tools.image_watermark.advanced_settings')}
                    </h4>
                    <FontAwesomeIcon icon={faShield} className="text-primary/70" />
                  </div>
                  
                  <div>
                    <label className={styles.inputLabel}>
                      {t('tools.image_watermark.protection_level')}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['standard', 'enhanced', 'professional'].map((level) => (
                        <button
                          key={level}
                          type="button"
                          className={`p-2 rounded text-sm cursor-pointer transition-all duration-200 ${
                            protectionLevel === level 
                              ? 'bg-[rgb(var(--color-primary))] text-[rgb(var(--color-bg-main))] shadow-sm border border-[var(--color-border)]' 
                              : 'bg-block border border-purple-glow/20 hover:border-primary/50 hover:bg-primary/10'
                          }`}
                          onClick={() => {
                            setProtectionLevel(level as ProtectionLevel);
                            console.log('防护级别已设置为:', level);
                          }}
                        >
                          {t(`tools.image_watermark.${level}`)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* 操作按钮 */}
                <div className="grid grid-cols-2 gap-4">
                  <button
                    className="btn-primary"
                    onClick={applyWatermark}
                    disabled={processing}
                  >
                    {processing ? (
                      <span>{t('tools.image_watermark.applying')}</span>
                    ) : (
                      <span>
                        <FontAwesomeIcon icon={faLayerGroup} className="mr-2" />
                        {t('tools.image_watermark.apply_watermark')}
                      </span>
                    )}
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={resetAll}
                  >
                    <FontAwesomeIcon icon={faTrash} className="mr-2" />
                    {t('tools.image_watermark.reset')}
                  </button>
                </div>
              </>
            )}
          </div>
          
          {/* 右侧预览区域 */}
          <div>
            {/* 原始图片预览 */}
            <div className="mb-4">
              <h3 className={styles.heading}>
                {t('tools.image_watermark.original_image')}
              </h3>
              <div className={styles.imageContainer}>
                {originalImage ? (
                  <img src={originalImage} alt="Original" className={styles.image} />
                ) : (
                  <div className={styles.placeholder}>
                    {t('tools.image_watermark.no_image_selected')}
                  </div>
                )}
              </div>
            </div>
            
            {/* 水印处理图片预览 */}
            <div className="mb-4">
              <h3 className={styles.heading}>
                {t('tools.image_watermark.watermarked_image')}
              </h3>
              <div className={styles.imageContainer}>
                {watermarkedImage ? (
                  <img src={watermarkedImage} alt="Watermarked" className={styles.image} />
                ) : (
                  <div className={styles.placeholder}>
                    {t('tools.image_watermark.no_watermarked_image')}
                  </div>
                )}
              </div>
            </div>
            
            {/* 下载按钮 */}
            {watermarkedImage && (
              <button
                className="btn-primary w-full"
                onClick={downloadImage}
              >
                <FontAwesomeIcon icon={faDownload} className="mr-2" />
                {t('tools.image_watermark.download_image')}
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Canvas容器 - 隐藏，仅用于处理 */}
      <div ref={canvasContainerRef} className="hidden">
        <canvas id="watermark-canvas"></canvas>
      </div>
    </div>
  );
} 