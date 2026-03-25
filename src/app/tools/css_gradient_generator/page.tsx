'use client';

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCogs, faCopy, faCheck, faRandom, faTrash, faPlus, faAngleRight, faCircle } from '@fortawesome/free-solid-svg-icons';
import ToolHeader from '@/components/ToolHeader';
import BackToTop from '@/components/BackToTop';
import tools from '@/config/tools';
import { useLanguage } from '@/context/LanguageContext';

// 添加CSS变量样式
const styles = {
  card: "card p-6",
  smallCard: "card p-4",
  container: "min-h-screen flex flex-col max-w-[1440px] mx-auto p-4 md:p-6",
  heading: "text-md font-medium text-primary mb-4",
  subheading: "text-sm font-medium text-secondary mb-2",
  label: "text-sm text-secondary mb-1",
  previewBox: "relative rounded-lg h-48 overflow-hidden shadow-lg mb-4 transition-all duration-300 hover:shadow-xl border border-purple-glow/20",
  optionBtn: (active: boolean) => `flex-1 px-3 py-2 rounded-md text-sm transition-colors ${active ? 'btn-primary' : 'btn-secondary'}`,
  directionBtn: (active: boolean) => `w-8 h-8 rounded-md flex items-center justify-center ${active ? 'bg-purple-glow/30 text-purple' : 'bg-block-strong text-secondary'}`,
  colorStopItem: "flex items-center gap-2 mb-3 relative",
  colorInput: "w-8 h-8 rounded-md overflow-hidden cursor-pointer border border-purple-glow/20",
  positionInput: "bg-block border border-purple-glow/20 rounded-md px-2 py-1 max-w-[4rem] text-primary text-center",
  deleteBtn: "text-secondary hover:text-error transition-colors",
  presetBtn: "w-8 h-8 rounded-md cursor-pointer border border-purple-glow/20 transition-all hover:scale-110",
  codeBlock: "bg-block rounded-md p-4 text-sm font-mono text-primary overflow-auto",
  codeComment: "text-tertiary",
  copyBtn: "absolute top-2 right-2 bg-block-strong px-2 py-1 rounded text-xs text-secondary flex items-center gap-1 hover:bg-block-hover transition-colors",
  rangeInput: "w-full bg-block-strong h-2 rounded-full appearance-none cursor-pointer",
  inputGroup: "mb-4",
  grid: "grid grid-cols-1 lg:grid-cols-3 gap-6",
  flexRow: "flex space-x-2",
  flexCenter: "flex items-center justify-center",
  directionsGrid: "grid grid-cols-3 gap-2 mb-4",
};

// 渐变类型
type GradientType = 'linear' | 'radial';

// 渐变方向（线性）
type LinearDirection = '0deg' | '45deg' | '90deg' | '135deg' | '180deg' | '225deg' | '270deg' | '315deg' | 'custom';

// 渐变形状（径向）
type RadialShape = 'circle' | 'ellipse';

// 渐变位置（径向）
type RadialPosition = 'center' | 'top' | 'top right' | 'right' | 'bottom right' | 'bottom' | 'bottom left' | 'left' | 'top left';

// 渐变色标
interface ColorStop {
  id: string;
  color: string;
  position: number;
}

export default function CssGradientGenerator() {
  // 从工具配置中获取当前工具信息
  const toolConfig = tools.find(tool => tool.code === 'css_gradient_generator');

  // 使用多语言支持
  const { t } = useLanguage();

  // 渐变类型
  const [gradientType, setGradientType] = useState<GradientType>('linear');

  // 线性渐变方向
  const [linearDirection, setLinearDirection] = useState<LinearDirection>('90deg');
  const [customAngle, setCustomAngle] = useState<number>(90);

  // 径向渐变设置
  const [radialShape, setRadialShape] = useState<RadialShape>('circle');
  const [radialPosition, setRadialPosition] = useState<RadialPosition>('center');

  // 颜色停止点
  const [colorStops, setColorStops] = useState<ColorStop[]>([
    { id: '1', color: '#6366F1', position: 0 },
    { id: '2', color: '#8B5CF6', position: 100 }
  ]);

  // CSS 代码
  const [cssCode, setCssCode] = useState<string>('');

  // 复制状态
  const [copied, setCopied] = useState<boolean>(false);

  // 常用颜色组合
  const presetColors = [
    ['#6366F1', '#8B5CF6'], // 极速工具箱默认紫色渐变
    ['#F472B6', '#EC4899'], // 粉红
    ['#10B981', '#059669'], // 绿色
    ['#3B82F6', '#2563EB'], // 蓝色
    ['#F59E0B', '#F97316'], // 橙色
    ['#6B7280', '#374151'], // 灰色
    ['#1E293B', '#0F172A'], // 深蓝灰
  ];

  // 初始化效果
  useEffect(() => {
    generateCssCode();
  }, [gradientType, linearDirection, customAngle, radialShape, radialPosition, colorStops]);

  // 生成 CSS 代码
  const generateCssCode = () => {
    let cssText = '';

    // 构建色标字符串
    const stopsStr = colorStops
      .sort((a, b) => a.position - b.position)
      .map(stop => `${stop.color} ${stop.position}%`)
      .join(', ');

    // 根据渐变类型构建代码
    if (gradientType === 'linear') {
      const direction = linearDirection === 'custom' ? `${customAngle}deg` : linearDirection;
      cssText = `background: ${colorStops[0].color};\n`;
      cssText += `background: -webkit-linear-gradient(${direction}, ${stopsStr});\n`;
      cssText += `background: linear-gradient(${direction}, ${stopsStr});`;
    } else {
      cssText = `background: ${colorStops[0].color};\n`;
      cssText += `background: -webkit-radial-gradient(${radialPosition}, ${radialShape}, ${stopsStr});\n`;
      cssText += `background: radial-gradient(${radialShape} at ${radialPosition}, ${stopsStr});`;
    }

    setCssCode(cssText);
  };

  // 添加新颜色停止点
  const addColorStop = () => {
    const id = Date.now().toString();
    const colorCount = colorStops.length;

    // 设置默认颜色和位置
    const color = '#818CF8';
    let position = 50;

    // 如果有至少两个颜色，尝试在中间插入
    if (colorCount >= 2) {
      // 按位置排序
      const sortedStops = [...colorStops].sort((a, b) => a.position - b.position);
      // 找出最大间隔
      let maxGap = 0;
      let insertPosition = 50;

      for (let i = 0; i < sortedStops.length - 1; i++) {
        const gap = sortedStops[i + 1].position - sortedStops[i].position;
        if (gap > maxGap) {
          maxGap = gap;
          insertPosition = sortedStops[i].position + gap / 2;
        }
      }

      position = Math.round(insertPosition);
    }

    setColorStops([...colorStops, { id, color, position }]);
  };

  // 移除颜色停止点
  const removeColorStop = (id: string) => {
    // 确保至少保留2个颜色停止点
    if (colorStops.length <= 2) {
      return;
    }

    setColorStops(colorStops.filter(stop => stop.id !== id));
  };

  // 更新颜色停止点
  const updateColorStop = (id: string, field: 'color' | 'position', value: string | number) => {
    setColorStops(colorStops.map(stop => {
      if (stop.id === id) {
        if (field === 'position') {
          // 确保位置在0-100范围内
          const numValue = typeof value === 'string' ? parseInt(value, 10) : value;
          return { ...stop, position: Math.max(0, Math.min(100, numValue)) };
        }
        return { ...stop, [field]: value as string };
      }
      return stop;
    }));
  };

  // 应用预设颜色
  const applyPreset = (colors: string[]) => {
    const newStops = colorStops.map((stop, index) => {
      // 只替换颜色，保持原有位置和ID
      if (index < colors.length) {
        return { ...stop, color: colors[index] };
      }
      return stop;
    });

    setColorStops(newStops);
  };

  // 生成随机渐变
  const generateRandomGradient = () => {
    // 生成随机颜色
    const generateRandomColor = () => {
      const letters = '0123456789ABCDEF';
      let color = '#';
      for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
      }
      return color;
    };

    // 更新颜色停止点
    const newStops = colorStops.map(stop => ({
      ...stop,
      color: generateRandomColor()
    }));

    // 随机渐变类型和方向
    const newType = Math.random() > 0.5 ? 'linear' : 'radial';
    setGradientType(newType);

    if (newType === 'linear') {
      const directions: LinearDirection[] = ['0deg', '45deg', '90deg', '135deg', '180deg', '225deg', '270deg', '315deg'];
      const randomDirection = directions[Math.floor(Math.random() * directions.length)];
      setLinearDirection(randomDirection);
    } else {
      const shapes: RadialShape[] = ['circle', 'ellipse'];
      const positions: RadialPosition[] = ['center', 'top', 'right', 'bottom', 'left', 'top right', 'bottom right', 'bottom left', 'top left'];

      setRadialShape(shapes[Math.floor(Math.random() * shapes.length)]);
      setRadialPosition(positions[Math.floor(Math.random() * positions.length)]);
    }

    setColorStops(newStops);
  };

  // 复制 CSS 代码
  const copyToClipboard = () => {
    navigator.clipboard.writeText(cssCode)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => console.error(t('tools.css_gradient_generator.copy_failed'), err));
  };

  // 渐变预览样式
  const gradientPreviewStyle = {
    background: gradientType === 'linear'
      ? `linear-gradient(${linearDirection === 'custom' ? `${customAngle}deg` : linearDirection}, ${colorStops.sort((a, b) => a.position - b.position).map(stop => `${stop.color} ${stop.position}%`).join(', ')})`
      : `radial-gradient(${radialShape} at ${radialPosition}, ${colorStops.sort((a, b) => a.position - b.position).map(stop => `${stop.color} ${stop.position}%`).join(', ')})`
  };

  return (
    <div className={styles.container}>
      {/* 工具头部 */}
      {toolConfig && (
        <ToolHeader
          icon={toolConfig.icon || faCogs}
          toolCode="css_gradient_generator"
          title=""
          description=""
        />
      )}

      {/* 主内容区 */}
      <div className={styles.grid}>
        {/* 左侧 - 控制面板 */}
        <div className="lg:col-span-1 space-y-6">
          {/* 渐变类型 */}
          <div className={styles.smallCard}>
            <h2 className={styles.heading}>{t('tools.css_gradient_generator.gradient_type')}</h2>
            <div className={styles.flexRow}>
              <button
                className={styles.optionBtn(gradientType === 'linear')}
                onClick={() => setGradientType('linear')}
              >
                {t('tools.css_gradient_generator.linear_gradient')}
              </button>
              <button
                className={styles.optionBtn(gradientType === 'radial')}
                onClick={() => setGradientType('radial')}
              >
                {t('tools.css_gradient_generator.radial_gradient')}
              </button>
            </div>
          </div>

          {/* 渐变参数 */}
          <div className={styles.smallCard}>
            <h2 className={styles.heading}>
              {gradientType === 'linear'
                ? t('tools.css_gradient_generator.gradient_direction')
                : t('tools.css_gradient_generator.gradient_shape_position')}
            </h2>

            {gradientType === 'linear' ? (
              <div>
                {/* 线性渐变方向 */}
                <div className={styles.directionsGrid}>
                  <button
                    className={styles.directionBtn(linearDirection === '225deg')}
                    onClick={() => setLinearDirection('225deg')}
                    title={t('tools.css_gradient_generator.direction_titles.225deg')}
                  >
                    <FontAwesomeIcon icon={faAngleRight} className="transform rotate-[-135deg]" />
                  </button>
                  <button
                    className={styles.directionBtn(linearDirection === '270deg')}
                    onClick={() => setLinearDirection('270deg')}
                    title={t('tools.css_gradient_generator.direction_titles.270deg')}
                  >
                    <FontAwesomeIcon icon={faAngleRight} className="transform rotate-[-90deg]" />
                  </button>
                  <button
                    className={styles.directionBtn(linearDirection === '315deg')}
                    onClick={() => setLinearDirection('315deg')}
                    title={t('tools.css_gradient_generator.direction_titles.315deg')}
                  >
                    <FontAwesomeIcon icon={faAngleRight} className="transform rotate-[-45deg]" />
                  </button>
                  <button
                    className={styles.directionBtn(linearDirection === '180deg')}
                    onClick={() => setLinearDirection('180deg')}
                    title={t('tools.css_gradient_generator.direction_titles.180deg')}
                  >
                    <FontAwesomeIcon icon={faAngleRight} className="transform rotate-[180deg]" />
                  </button>
                  <div className={styles.flexCenter}>
                    <FontAwesomeIcon icon={faCircle} className="text-purple text-xs" />
                  </div>
                  <button
                    className={styles.directionBtn(linearDirection === '0deg')}
                    onClick={() => setLinearDirection('0deg')}
                    title={t('tools.css_gradient_generator.direction_titles.0deg')}
                  >
                    <FontAwesomeIcon icon={faAngleRight} />
                  </button>
                  <button
                    className={styles.directionBtn(linearDirection === '135deg')}
                    onClick={() => setLinearDirection('135deg')}
                    title={t('tools.css_gradient_generator.direction_titles.135deg')}
                  >
                    <FontAwesomeIcon icon={faAngleRight} className="transform rotate-[135deg]" />
                  </button>
                  <button
                    className={styles.directionBtn(linearDirection === '90deg')}
                    onClick={() => setLinearDirection('90deg')}
                    title={t('tools.css_gradient_generator.direction_titles.90deg')}
                  >
                    <FontAwesomeIcon icon={faAngleRight} className="transform rotate-[90deg]" />
                  </button>
                  <button
                    className={styles.directionBtn(linearDirection === '45deg')}
                    onClick={() => setLinearDirection('45deg')}
                    title={t('tools.css_gradient_generator.direction_titles.45deg')}
                  >
                    <FontAwesomeIcon icon={faAngleRight} className="transform rotate-[45deg]" />
                  </button>
                </div>

                {/* 自定义角度 */}
                <div className={styles.inputGroup}>
                  <div className="flex items-center justify-between mb-2">
                    <label className={styles.label}>{t('tools.css_gradient_generator.custom_angle')}</label>
                    <span className="text-sm text-secondary">{customAngle}°</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="359"
                      value={customAngle}
                      onChange={(e) => {
                        setCustomAngle(parseInt(e.target.value, 10));
                        setLinearDirection('custom');
                      }}
                      className={styles.rangeInput}
                    />
                    <button
                      className={styles.optionBtn(linearDirection === 'custom')}
                      onClick={() => setLinearDirection('custom')}
                    >
                      {t('tools.css_gradient_generator.apply')}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                {/* 径向渐变形状 */}
                <div className={styles.inputGroup}>
                  <label className={styles.label}>{t('tools.css_gradient_generator.gradient_shape')}</label>
                  <div className={styles.flexRow}>
                    <button
                      className={styles.optionBtn(radialShape === 'circle')}
                      onClick={() => setRadialShape('circle')}
                    >
                      {t('tools.css_gradient_generator.circle')}
                    </button>
                    <button
                      className={styles.optionBtn(radialShape === 'ellipse')}
                      onClick={() => setRadialShape('ellipse')}
                    >
                      {t('tools.css_gradient_generator.ellipse')}
                    </button>
                  </div>
                </div>

                {/* 径向渐变位置 */}
                <div>
                  <label className={styles.label}>{t('tools.css_gradient_generator.gradient_position')}</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['top left', 'top', 'top right', 'left', 'center', 'right', 'bottom left', 'bottom', 'bottom right'].map((pos) => (
                      <button
                        key={pos}
                        className={styles.directionBtn(radialPosition === pos)}
                        onClick={() => setRadialPosition(pos as RadialPosition)}
                      >
                        <div className="w-2 h-2 rounded-full bg-current"></div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 渐变颜色 */}
          <div className={styles.smallCard}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={styles.heading}>{t('tools.css_gradient_generator.gradient_colors')}</h2>
              <div className="flex gap-2">
                <button
                  className="btn-secondary text-xs px-3 py-1"
                  onClick={addColorStop}
                  title={t('tools.css_gradient_generator.add_color_stop')}
                >
                  <FontAwesomeIcon icon={faPlus} />
                </button>
                <button
                  className="btn-secondary text-xs px-3 py-1"
                  onClick={generateRandomGradient}
                  title={t('tools.css_gradient_generator.random_gradient')}
                >
                  <FontAwesomeIcon icon={faRandom} />
                </button>
              </div>
            </div>

            {/* 颜色停止点列表 */}
            <div className="mb-4">
              {colorStops.sort((a, b) => a.position - b.position).map((stop) => (
                <div key={stop.id} className={styles.colorStopItem}>
                  <input
                    type="color"
                    value={stop.color}
                    onChange={(e) => updateColorStop(stop.id, 'color', e.target.value)}
                    title="选择颜色"
                    className={styles.colorInput}
                  />

                  <div className="flex-1">
                    <input
                      type="text"
                      value={stop.color}
                      onChange={(e) => updateColorStop(stop.id, 'color', e.target.value)}
                      className="w-full bg-block border border-purple-glow/20 rounded-md px-2 py-1 text-sm text-primary"
                    />
                  </div>

                  <input
                    type="number"
                    value={stop.position}
                    min="0"
                    max="100"
                    onChange={(e) => updateColorStop(stop.id, 'position', e.target.value)}
                    className={styles.positionInput}
                  />
                  <span className="text-xs text-tertiary">%</span>

                  {colorStops.length > 2 && (
                    <button
                      onClick={() => removeColorStop(stop.id)}
                      title="删除"
                      className={styles.deleteBtn}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* 预设颜色 */}
            <div>
              <h3 className={styles.subheading}>{t('tools.css_gradient_generator.preset_colors')}</h3>
              <div className="flex flex-wrap gap-2">
                {presetColors.map((colors, index) => (
                  <button
                    key={index}
                    className={styles.presetBtn}
                    onClick={() => applyPreset(colors)}
                    style={{
                      background: `linear-gradient(to right, ${colors[0]}, ${colors[1]})`
                    }}
                    title={t('tools.css_gradient_generator.apply_preset')}
                  ></button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 右侧 - 预览和代码 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 渐变预览 */}
          <div className={styles.card}>
            <h2 className={styles.heading}>{t('tools.css_gradient_generator.gradient_preview')}</h2>

            <div className={styles.previewBox} style={gradientPreviewStyle}>
            </div>

            <div className="text-sm text-tertiary">
              <p>{t('tools.css_gradient_generator.preview_hint')}</p>
            </div>
          </div>

          {/* CSS代码 */}
          <div className={styles.card}>
            <h2 className={styles.heading}>{t('tools.css_gradient_generator.css_code')}</h2>

            <div className="relative">
              <pre className={styles.codeBlock}>
                <span className={styles.codeComment}>{t('tools.css_gradient_generator.css_comment')}</span>
                <br />
                {cssCode.split('\n').map((line, index) => (
                  <React.Fragment key={index}>
                    {line}
                    <br />
                  </React.Fragment>
                ))}
              </pre>

              <button
                className={styles.copyBtn}
                onClick={copyToClipboard}
              >
                <FontAwesomeIcon icon={copied ? faCheck : faCopy} />
                {copied ? t('tools.css_gradient_generator.copied') : t('tools.css_gradient_generator.copy_code')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 回到顶部按钮 */}
      <BackToTop position="bottom-right" offset={30} size="medium" />
    </div>
  );
} 