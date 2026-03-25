'use client';

import React, { useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCube, faDownload, faStar
} from '@fortawesome/free-solid-svg-icons';
import ToolHeader from '@/components/ToolHeader';
import { useLanguage } from '@/context/LanguageContext';
import IconSelector from './components/IconSelector';
import EnhancedIconPreview, { ShapeType, BackgroundType, IconType } from './components/EnhancedIconPreview';
import EnhancedIconCanvas, { EnhancedIconCanvasRef } from './components/EnhancedIconCanvas';

// 样式定义
const styles = {
  container: "min-h-screen flex flex-col max-w-[1440px] mx-auto p-4 md:p-6",
  card: "card p-6 mb-6",
  section: "mb-6",
  sectionTitle: "text-lg font-semibold mb-3 text-primary",
  grid: "grid grid-cols-1 lg:grid-cols-3 gap-6",
  leftPanel: "lg:col-span-2 space-y-6",
  rightPanel: "lg:col-span-1",
  iconGrid: "grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2",
  iconButton: "btn-option p-3 flex items-center justify-center text-lg hover:scale-110 transition-transform",
  iconButtonActive: "btn-option-active p-3 flex items-center justify-center text-lg scale-110",
  shapeGrid: "grid grid-cols-2 sm:grid-cols-4 gap-2",
  shapeButton: "btn-option p-4 flex flex-col items-center justify-center",
  shapeButtonActive: "btn-option-active p-4 flex flex-col items-center justify-center",
  colorGrid: "grid grid-cols-4 sm:grid-cols-6 gap-2",
  colorButton: "w-12 h-12 rounded-lg border-2 border-white/20 hover:border-white/60 transition-all cursor-pointer",
  colorButtonActive: "w-12 h-12 rounded-lg border-2 border-purple-500 scale-110 shadow-lg shadow-purple-500/30",
  slider: "w-full accent-[rgb(var(--color-primary))]",
  previewArea: "card p-8 flex flex-col items-center justify-center min-h-80",
  previewIcon: "mb-4 transition-all duration-300",
  templateGrid: "grid grid-cols-1 sm:grid-cols-2 gap-3",
  templateButton: "btn-option p-4 text-left",
  exportGrid: "grid grid-cols-2 gap-3",
  searchInput: "search-input w-full mb-4",
  iconCategory: "mb-4",
  categoryTitle: "text-sm font-medium mb-2 text-secondary",
  label: "block text-sm font-medium mb-2 text-secondary",
  input: "w-full px-3 py-2 bg-card border border-gray-600 rounded-lg text-primary placeholder-tertiary focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all",
  select: "w-full px-3 py-2 bg-card border border-gray-600 rounded-lg text-primary focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all",
  colorInput: "w-12 h-10 border-0 rounded-lg cursor-pointer",
};

// 移除原有的图标数据，现在由IconSelector组件管理

// 颜色预设
const colorPresets = [
  '#000000', '#FFFFFF', '#6B7280', '#3B82F6', '#10B981', 
  '#EF4444', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6'
];

// ShapeType现在从IconCanvas组件导入

// 预设模板
interface Template {
  name: string;
  backgroundType: BackgroundType;
  backgroundColor: string;
  gradientStartColor?: string;
  gradientEndColor?: string;
  gradientDirection?: number;
  iconColor: string;
  shape: ShapeType;
  iconSize: number;
  iconRotation?: number;
}

const templates: Template[] = [
  {
    name: 'iOS Style',
    backgroundType: 'solid',
    backgroundColor: '#000000',
    iconColor: '#FFFFFF',
    shape: 'rounded-square',
    iconSize: 60
  },
  {
    name: 'Material',
    backgroundType: 'solid',
    backgroundColor: '#4CAF50',
    iconColor: '#FFFFFF',
    shape: 'circle',
    iconSize: 55
  },
  {
    name: 'Minimal',
    backgroundType: 'solid',
    backgroundColor: '#FFFFFF',
    iconColor: '#000000',
    shape: 'square',
    iconSize: 50
  },
  {
    name: 'Gradient',
    backgroundType: 'linear-gradient',
    backgroundColor: '#8B5CF6',
    gradientStartColor: '#6366F1',
    gradientEndColor: '#8B5CF6',
    gradientDirection: 45,
    iconColor: '#FFFFFF',
    shape: 'rounded-square',
    iconSize: 65
  },
  {
    name: 'Neon',
    backgroundType: 'radial-gradient',
    backgroundColor: '#000000',
    gradientStartColor: '#FF006E',
    gradientEndColor: '#8338EC',
    iconColor: '#FFFFFF',
    shape: 'circle',
    iconSize: 70,
    iconRotation: 15
  },
  {
    name: 'Retro',
    backgroundType: 'linear-gradient',
    backgroundColor: '#F72585',
    gradientStartColor: '#F72585',
    gradientEndColor: '#B5179E',
    gradientDirection: 135,
    iconColor: '#FFE66D',
    shape: 'square',
    iconSize: 65
  },
  {
    name: 'Glassmorphism',
    backgroundType: 'linear-gradient',
    backgroundColor: 'rgba(255,255,255,0.1)',
    gradientStartColor: 'rgba(255,255,255,0.2)',
    gradientEndColor: 'rgba(255,255,255,0.05)',
    iconColor: '#FFFFFF',
    shape: 'rounded-square',
    iconSize: 60
  },
  {
    name: 'Neumorphism',
    backgroundType: 'solid',
    backgroundColor: '#E0E5EC',
    iconColor: '#9BAACF',
    shape: 'rounded-square',
    iconSize: 55
  }
];

export default function IconDesigner() {
  const { t } = useLanguage();
  const canvasRef = useRef<EnhancedIconCanvasRef>(null);
  
  // 图标相关状态
  const [iconType, setIconType] = useState<IconType>('fontawesome');
  const [selectedIcon, setSelectedIcon] = useState(faStar);
  const [customText, setCustomText] = useState('ABC');
  const [iconColor, setIconColor] = useState('#FFFFFF');
  const [iconSize, setIconSize] = useState(60);
  const [iconRotation, setIconRotation] = useState(0);
  const [fontFamily, setFontFamily] = useState('Arial, sans-serif');
  const [fontWeight, setFontWeight] = useState('bold');
  const [fontSize, setFontSize] = useState(40); // 独立的字体大小，用于文字模式
  
  // 背景相关状态
  const [backgroundType, setBackgroundType] = useState<BackgroundType>('solid');
  const [backgroundColor, setBackgroundColor] = useState('#000000');
  const [gradientStartColor, setGradientStartColor] = useState('#6366F1');
  const [gradientEndColor, setGradientEndColor] = useState('#8B5CF6');
  const [gradientDirection, setGradientDirection] = useState(45);
  const [shape, setShape] = useState<ShapeType>('rounded-square');
  
  // 导出相关状态
  const [exportSize, setExportSize] = useState(256);
  const [exportFormat, setExportFormat] = useState('png');
  const [isGenerating, setIsGenerating] = useState(false);

  // 应用模板
  const applyTemplate = (template: Template) => {
    setBackgroundType(template.backgroundType);
    setBackgroundColor(template.backgroundColor);
    if (template.gradientStartColor) setGradientStartColor(template.gradientStartColor);
    if (template.gradientEndColor) setGradientEndColor(template.gradientEndColor);
    if (template.gradientDirection) setGradientDirection(template.gradientDirection);
    setIconColor(template.iconColor);
    setShape(template.shape);
    setIconSize(template.iconSize);
    if (template.iconRotation) setIconRotation(template.iconRotation);
  };



  // 下载图标
  const downloadIcon = async () => {
    if (!canvasRef.current) return;
    
    setIsGenerating(true);
    
    try {
      const dataUrl = await canvasRef.current.generateIcon(exportSize);
      
      // 下载
      const link = document.createElement('a');
      link.download = `icon-${Date.now()}.${exportFormat}`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('下载失败:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={styles.container}>
      <ToolHeader 
        icon={faCube}
        toolCode="icon_designer"
        title=""
        description=""
      />
      
      <div className={styles.grid}>
        {/* 左侧控制面板 */}
        <div className={styles.leftPanel}>
                      {/* 图标选择 */}
            <div className={styles.card}>
              <h3 className={styles.sectionTitle}>{t('tools.icon_designer.icon_selection')}</h3>
              
              {/* 图标类型选择 */}
              <div className="mb-4">
                <label className={styles.label}>{t('tools.icon_designer.icon_type')}</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIconType('fontawesome')}
                    className={`px-4 py-2 rounded-lg border transition-all ${
                      iconType === 'fontawesome'
                        ? 'bg-[rgb(var(--color-primary))] text-[rgb(var(--color-bg-main))] border-[var(--color-border)] shadow-sm'
                        : 'bg-card border-gray-600 text-secondary hover:border-purple-500/50'
                    }`}
                  >
                    {t('tools.icon_designer.icon_type_fontawesome')}
                  </button>
                  <button
                    onClick={() => setIconType('text')}
                    className={`px-4 py-2 rounded-lg border transition-all ${
                      iconType === 'text'
                        ? 'bg-[rgb(var(--color-primary))] text-[rgb(var(--color-bg-main))] border-[var(--color-border)] shadow-sm'
                        : 'bg-card border-gray-600 text-secondary hover:border-purple-500/50'
                    }`}
                  >
                    {t('tools.icon_designer.icon_type_text')}
                  </button>
                </div>
              </div>

              {/* FontAwesome图标选择器 */}
              {iconType === 'fontawesome' && (
                <IconSelector
                  selectedIcon={selectedIcon}
                  onIconSelect={setSelectedIcon}
                />
              )}

              {/* 自定义文字输入 */}
              {iconType === 'text' && (
                <div className="space-y-4">
                  <div>
                    <label className={styles.label}>{t('tools.icon_designer.text_input')}</label>
                    <input
                      type="text"
                      value={customText}
                      onChange={(e) => setCustomText(e.target.value)}
                      placeholder={t('tools.icon_designer.text_input_placeholder')}
                      className={styles.input}
                      maxLength={10}
                    />
                  </div>
                  <div>
                    <label className={styles.label}>{t('tools.icon_designer.font_family')}</label>
                    <select
                      value={fontFamily}
                      onChange={(e) => setFontFamily(e.target.value)}
                      className={styles.select}
                    >
                      <option value="Arial, sans-serif">Arial</option>
                      <option value="Helvetica, sans-serif">Helvetica</option>
                      <option value="Times, serif">Times</option>
                      <option value="Courier, monospace">Courier</option>
                      <option value="Georgia, serif">Georgia</option>
                      <option value="Verdana, sans-serif">Verdana</option>
                    </select>
                  </div>
                  <div>
                    <label className={styles.label}>{t('tools.icon_designer.font_weight')}</label>
                    <select
                      value={fontWeight}
                      onChange={(e) => setFontWeight(e.target.value)}
                      className={styles.select}
                    >
                      <option value="normal">Normal</option>
                      <option value="bold">Bold</option>
                      <option value="100">Thin</option>
                      <option value="300">Light</option>
                      <option value="500">Medium</option>
                      <option value="700">Bold</option>
                                           <option value="900">Black</option>
                     </select>
                   </div>
                   <div>
                     <label className={styles.label}>{t('tools.icon_designer.font_size')}: {fontSize}%</label>
                     <input
                       type="range"
                       min="20"
                       max="90"
                       value={fontSize}
                       onChange={(e) => setFontSize(Number(e.target.value))}
                       className={styles.slider}
                     />
                   </div>
                 </div>
               )}
            </div>

            {/* 图标设置 */}
            <div className={styles.card}>
              <h3 className={styles.sectionTitle}>{t('tools.icon_designer.icon_settings')}</h3>
            
            <div className="mb-4">
              <label className="block text-secondary text-sm font-bold mb-2">
                {t('tools.icon_designer.icon_color')}
              </label>
              <div className={styles.colorGrid}>
                {colorPresets.map((color) => (
                  <button
                    key={color}
                    className={iconColor === color ? styles.colorButtonActive : styles.colorButton}
                    style={{ backgroundColor: color }}
                    onClick={() => setIconColor(color)}
                  />
                ))}
              </div>
              <input
                type="color"
                value={iconColor}
                onChange={(e) => setIconColor(e.target.value)}
                className="mt-2 w-full h-10 rounded border-0 cursor-pointer"
              />
            </div>

            {iconType === 'fontawesome' && (
              <div>
                <label className="block text-secondary text-sm font-bold mb-2">
                  {t('tools.icon_designer.icon_size')}: {iconSize}%
                </label>
                <input
                  type="range"
                  min="30"
                  max="80"
                  value={iconSize}
                  onChange={(e) => setIconSize(Number(e.target.value))}
                  className={styles.slider}
                />
              </div>
            )}

            <div>
              <label className="block text-secondary text-sm font-bold mb-2">
                {t('tools.icon_designer.icon_rotation')}: {iconRotation}°
              </label>
              <input
                type="range"
                min="0"
                max="360"
                value={iconRotation}
                onChange={(e) => setIconRotation(Number(e.target.value))}
                className={styles.slider}
              />
            </div>
          </div>

          {/* 背景设置 */}
          <div className={styles.card}>
            <h3 className={styles.sectionTitle}>{t('tools.icon_designer.background_settings')}</h3>
            
            <div className="mb-4">
              <label className="block text-secondary text-sm font-bold mb-2">
                {t('tools.icon_designer.background_shape')}
              </label>
              <div className={styles.shapeGrid}>
                {(['circle', 'square', 'rounded-square', 'hexagon'] as ShapeType[]).map((shapeType) => (
                  <button
                    key={shapeType}
                    className={shape === shapeType ? styles.shapeButtonActive : styles.shapeButton}
                    onClick={() => setShape(shapeType)}
                  >
                    <div className={`w-8 h-8 bg-current ${
                      shapeType === 'circle' ? 'rounded-full' :
                      shapeType === 'rounded-square' ? 'rounded-lg' :
                      shapeType === 'hexagon' ? 'rounded-md transform rotate-45' :
                      ''
                    }`} />
                    <span className="text-xs mt-1">{t(`tools.icon_designer.shape_${shapeType.replace('-', '_')}`)}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-secondary text-sm font-bold mb-2">
                {t('tools.icon_designer.background_color')}
              </label>
              <div className={styles.colorGrid}>
                {colorPresets.map((color) => (
                  <button
                    key={color}
                    className={backgroundColor === color ? styles.colorButtonActive : styles.colorButton}
                    style={{ backgroundColor: color }}
                    onClick={() => setBackgroundColor(color)}
                  />
                ))}
              </div>
              <input
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="mt-2 w-full h-10 rounded border-0 cursor-pointer"
              />
            </div>
          </div>

          {/* 预设模板 */}
          <div className={styles.card}>
            <h3 className={styles.sectionTitle}>{t('tools.icon_designer.preset_templates')}</h3>
            <div className={styles.templateGrid}>
              {templates.map((template, index) => (
                <button
                  key={index}
                  className={styles.templateButton}
                  onClick={() => applyTemplate(template)}
                >
                  <div className="flex items-center mb-2">
                    <div 
                      className="w-6 h-6 rounded mr-2"
                      style={{ backgroundColor: template.backgroundColor }}
                    />
                    <span className="font-medium">{t(`tools.icon_designer.template_${template.name.toLowerCase().replace(' ', '_')}`)}</span>
                  </div>
                  <span className="text-xs text-secondary">
                    {template.backgroundType === 'solid' ? '纯色' : '渐变'} • {template.shape} • {template.iconSize}%
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 右侧预览和导出 */}
        <div className={styles.rightPanel}>
          {/* 预览 */}
          <div className={styles.card}>
            <h3 className={styles.sectionTitle}>{t('tools.icon_designer.preview')}</h3>
            <div className={styles.previewArea}>
              <EnhancedIconPreview
                iconType={iconType}
                icon={selectedIcon}
                customText={customText}
                iconColor={iconColor}
                iconSize={iconType === 'text' ? fontSize : iconSize}
                iconRotation={iconRotation}
                fontFamily={fontFamily}
                fontWeight={fontWeight}
                backgroundType={backgroundType}
                backgroundColor={backgroundColor}
                gradientStartColor={gradientStartColor}
                gradientEndColor={gradientEndColor}
                gradientDirection={gradientDirection}
                shape={shape}
                previewSize={200}
              />
              
              {/* 隐藏的Canvas用于导出 */}
              <div style={{ position: 'absolute', left: '-9999px' }}>
                <EnhancedIconCanvas
                  ref={canvasRef}
                  iconType={iconType}
                  icon={selectedIcon}
                  customText={customText}
                  iconColor={iconColor}
                  iconSize={iconType === 'text' ? fontSize : iconSize}
                  iconRotation={iconRotation}
                  fontFamily={fontFamily}
                  fontWeight={fontWeight}
                  backgroundType={backgroundType}
                  backgroundColor={backgroundColor}
                  gradientStartColor={gradientStartColor}
                  gradientEndColor={gradientEndColor}
                  gradientDirection={gradientDirection}
                  shape={shape}
                  canvasSize={256}
                />
              </div>
            </div>
          </div>

          {/* 导出设置 */}
          <div className={styles.card}>
            <h3 className={styles.sectionTitle}>{t('tools.icon_designer.export_settings')}</h3>
            
            <div className="mb-4">
              <label className="block text-secondary text-sm font-bold mb-2">
                {t('tools.icon_designer.export_size')}
              </label>
              <div className={styles.exportGrid}>
                {[64, 128, 256, 512].map((size) => (
                  <button
                    key={size}
                    className={exportSize === size ? 'btn-option-active' : 'btn-option'}
                    onClick={() => setExportSize(size)}
                  >
                    {size}x{size}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-secondary text-sm font-bold mb-2">
                {t('tools.icon_designer.export_format')}
              </label>
              <div className={styles.exportGrid}>
                {['png', 'svg'].map((format) => (
                  <button
                    key={format}
                    className={exportFormat === format ? 'btn-option-active' : 'btn-option'}
                    onClick={() => setExportFormat(format)}
                  >
                    {format.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <button
              className="btn-primary w-full"
              onClick={downloadIcon}
              disabled={isGenerating}
            >
              <FontAwesomeIcon icon={faDownload} className="mr-2" />
              {isGenerating ? t('tools.icon_designer.generating_icon') : t('tools.icon_designer.download_icon')}
            </button>
          </div>

          {/* 使用说明 */}
          <div className="bg-block p-4 rounded-lg border border-purple-glow/15">
            <h3 className="text-lg font-semibold mb-2 text-primary">
              {t('tools.icon_designer.usage_guide')}
            </h3>
            <ul className="list-disc pl-5 space-y-1 text-secondary text-sm">
              <li>{t('tools.icon_designer.guide_1')}</li>
              <li>{t('tools.icon_designer.guide_2')}</li>
              <li>{t('tools.icon_designer.guide_3')}</li>
              <li>{t('tools.icon_designer.guide_4')}</li>
              <li>{t('tools.icon_designer.guide_5')}</li>
              <li>{t('tools.icon_designer.guide_6')}</li>
            </ul>
            
            <div className="mt-4">
              <h4 className="font-medium mb-2 text-primary">{t('tools.icon_designer.tips')}</h4>
              <ul className="list-disc pl-5 space-y-1 text-secondary text-sm">
                <li>{t('tools.icon_designer.tip_1')}</li>
                <li>{t('tools.icon_designer.tip_2')}</li>
                <li>{t('tools.icon_designer.tip_3')}</li>
                <li>{t('tools.icon_designer.tip_4')}</li>
                <li>{t('tools.icon_designer.tip_5')}</li>
                <li>{t('tools.icon_designer.tip_6')}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 