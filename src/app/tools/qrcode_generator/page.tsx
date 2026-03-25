'use client';

import React, { useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImage, faCopy, faCheck, faDownload, faTrash, faRedo } from '@fortawesome/free-solid-svg-icons';
import ToolHeader from '@/components/ToolHeader';
import { QRCode } from 'react-qrcode-logo';
import { useLanguage } from '@/context/LanguageContext';

// 定义QR码样式类型
type QRStyle = 'squares' | 'dots';

// 定义颜色预设
const colorPresets = [
  { bg: '#FFFFFF', fg: '#000000', name: 'preset_classic_bw' },
  { bg: '#0088CC', fg: '#FFFFFF', name: 'preset_blue_white' },
  { bg: '#EF4444', fg: '#FFFFFF', name: 'preset_vibrant_red' },
  { bg: '#10B981', fg: '#FFFFFF', name: 'preset_fresh_green' },
  { bg: '#6366F1', fg: '#FFFFFF', name: 'preset_tech_purple' },
  { bg: '#262626', fg: '#F5F5F5', name: 'preset_dark_mode' },
  { bg: '#FFFFFF', fg: '#F97316', name: 'preset_orange_accent' },
  { bg: '#FFEDD5', fg: '#7C2D12', name: 'preset_warm_brown' },
];

// 添加CSS变量样式
const styles = {
  card: "card p-4",
  heading: "text-md font-medium text-primary mb-4",
  label: "block text-sm text-secondary mb-2",
  input: "search-input w-full",
  rangeValue: "text-sm text-primary min-w-[40px] text-right",
  buttonActive: "px-4 py-2 rounded-md transition-all bg-[rgb(var(--color-primary))] text-[rgb(var(--color-bg-main))] shadow-sm border border-[var(--color-border)]",
  buttonInactive: "px-4 py-2 rounded-md transition-all btn-secondary",
  presetButton: "p-2 rounded-md border transition-all hover:border-purple",
  colorBox: "w-5 h-5 rounded-sm border border-purple-glow/30",
  secondaryText: "text-sm text-tertiary",
  flexCenter: "flex items-center justify-center",
  preview: "rounded-xl overflow-hidden border border-purple-glow/20 bg-block-strong p-2",
  placeholder: "flex items-center justify-center p-4 text-tertiary",
}

export default function QRCodeGenerator() {
  const { t } = useLanguage();
  
  // QR码内容和样式状态
  const [value, setValue] = useState('https://example.com');
  const [size, setSize] = useState(200);
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [fgColor, setFgColor] = useState('#000000');
  const [quietZone, setQuietZone] = useState(10);
  const [qrStyle, setQrStyle] = useState<QRStyle>('squares');
  
  // Logo相关状态
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [logoWidth, setLogoWidth] = useState(60);
  const [logoHeight, setLogoHeight] = useState(60);
  const [logoOpacity, setLogoOpacity] = useState(1);
  const [removeQrCodeBehindLogo, setRemoveQrCodeBehindLogo] = useState(true);
  
  // 眼睛（定位图案）相关状态
  const [eyeColor, setEyeColor] = useState('#000000');
  const [eyeRadius, setEyeRadius] = useState(0);
  
  // 其他状态
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  
  // QR码引用
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const qrCodeRef = useRef<any>(null);
  
  // 文件上传引用
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 处理Logo图片上传
  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setLogoImage(result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // 触发文件上传点击
  const triggerLogoUpload = () => {
    fileInputRef.current?.click();
  };
  
  // 移除Logo
  const removeLogo = () => {
    setLogoImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // 复制QR码内容
  const copyQRValue = () => {
    navigator.clipboard.writeText(value)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => console.error(t('tools.qrcode_generator.copy_failed'), err));
  };
  
  // 下载QR码图片
  const downloadQRCode = () => {
    if (qrCodeRef.current) {
      setDownloading(true);
      try {
        qrCodeRef.current.download('png', '二维码');
      } catch (err) {
        console.error(t('tools.qrcode_generator.download_failed'), err);
      } finally {
        setDownloading(false);
      }
    }
  };
  
  // 应用颜色预设
  const applyColorPreset = (preset: { bg: string; fg: string }) => {
    setBgColor(preset.bg);
    setFgColor(preset.fg);
    setEyeColor(preset.fg);
  };
  
  // 重置所有设置
  const resetSettings = () => {
    setValue('https://example.com');
    setSize(200);
    setBgColor('#FFFFFF');
    setFgColor('#000000');
    setQuietZone(10);
    setQrStyle('squares');
    setLogoImage(null);
    setLogoWidth(60);
    setLogoHeight(60);
    setLogoOpacity(1);
    setRemoveQrCodeBehindLogo(true);
    setEyeColor('#000000');
    setEyeRadius(0);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen flex flex-col max-w-[1440px] mx-auto p-4 md:p-6">
      <ToolHeader 
        toolCode="qrcode_generator"
        icon={faImage}
        title=""
        description=""
      />
      
      {/* 主内容区 */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 左侧面板 - 设置选项 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 基本设置 */}
          <div className={styles.card}>
            <h2 className={styles.heading}>{t('tools.qrcode_generator.basic_settings')}</h2>
            
            <div className="space-y-4">
              <div>
                <label className={styles.label}>{t('tools.qrcode_generator.qrcode_content')}</label>
                <textarea
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={t('tools.qrcode_generator.input_placeholder')}
                  className="search-input min-h-[80px] w-full resize-y"
                />
              </div>
              
              <div>
                <label className={styles.label}>{t('tools.qrcode_generator.size_pixels')}</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="100"
                    max="400"
                    step="10"
                    value={size}
                    onChange={(e) => setSize(Number(e.target.value))}
                    className="w-full"
                  />
                  <span className={styles.rangeValue}>{size}</span>
                </div>
              </div>
              
              <div>
                <label className={styles.label}>{t('tools.qrcode_generator.margin_pixels')}</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="5"
                    value={quietZone}
                    onChange={(e) => setQuietZone(Number(e.target.value))}
                    className="w-full"
                  />
                  <span className={styles.rangeValue}>{quietZone}</span>
                </div>
              </div>
              
              <div>
                <label className={styles.label}>{t('tools.qrcode_generator.dot_style')}</label>
                <div className="flex gap-4">
                  <button
                    className={qrStyle === 'squares' ? styles.buttonActive : styles.buttonInactive}
                    onClick={() => setQrStyle('squares')}
                  >
                    {t('tools.qrcode_generator.squares')}
                  </button>
                  <button
                    className={qrStyle === 'dots' ? styles.buttonActive : styles.buttonInactive}
                    onClick={() => setQrStyle('dots')}
                  >
                    {t('tools.qrcode_generator.dots')}
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* 颜色设置 */}
          <div className={styles.card}>
            <h2 className={styles.heading}>{t('tools.qrcode_generator.color_settings')}</h2>
            
            <div className="space-y-4">
              <div>
                <label className={styles.label}>{t('tools.qrcode_generator.background_color')}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer border-none"
                  />
                  <input
                    type="text"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="search-input"
                  />
                </div>
              </div>
              
              <div>
                <label className={styles.label}>{t('tools.qrcode_generator.foreground_color')}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer border-none"
                  />
                  <input
                    type="text"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="search-input"
                  />
                </div>
              </div>
              
              <div>
                <label className={styles.label}>{t('tools.qrcode_generator.eye_color')}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={eyeColor}
                    onChange={(e) => setEyeColor(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer border-none"
                  />
                  <input
                    type="text"
                    value={eyeColor}
                    onChange={(e) => setEyeColor(e.target.value)}
                    className="search-input"
                  />
                </div>
              </div>
              
              <div>
                <label className={styles.label}>{t('tools.qrcode_generator.eye_radius')}</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="5"
                    value={eyeRadius}
                    onChange={(e) => setEyeRadius(Number(e.target.value))}
                    className="w-full"
                  />
                  <span className={styles.rangeValue}>{eyeRadius}%</span>
                </div>
              </div>
              
              <div>
                <label className={styles.label}>{t('tools.qrcode_generator.preset_colors')}</label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {colorPresets.map((preset, index) => (
                    <button
                      key={index}
                      className={styles.presetButton}
                      onClick={() => applyColorPreset(preset)}
                      title={t(`tools.qrcode_generator.${preset.name}`)}
                    >
                      <div className="flex flex-col items-center">
                        <div 
                          className={styles.colorBox} 
                          style={{ backgroundColor: preset.fg, borderColor: preset.bg }}
                        ></div>
                        <div className="text-xs mt-1 truncate w-full text-center">{t(`tools.qrcode_generator.${preset.name}`)}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Logo设置 */}
          <div className={styles.card}>
            <h2 className={styles.heading}>{t('tools.qrcode_generator.logo_settings')}</h2>
            
            <div className="space-y-4">
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleLogoUpload}
                  style={{ display: 'none' }}
                />
                
                <div className="flex justify-between items-center mb-2">
                  <button
                    className="btn-primary px-3 py-2 text-sm"
                    onClick={triggerLogoUpload}
                  >
                    <FontAwesomeIcon icon={faImage} className="mr-2" />
                    {t('tools.qrcode_generator.upload_logo')}
                  </button>
                  
                  {logoImage && (
                    <button
                      className="btn-secondary px-3 py-2 text-sm text-error"
                      onClick={removeLogo}
                    >
                      <FontAwesomeIcon icon={faTrash} className="mr-2" />
                      {t('tools.qrcode_generator.remove')}
                    </button>
                  )}
                </div>
                
                {logoImage && (
                  <div className="rounded bg-block-strong p-3 mb-4 flex justify-center items-center">
                    <img src={logoImage} alt="Logo" className="max-h-20 max-w-full" />
                  </div>
                )}
              </div>
              
              {logoImage && (
                <>
                  <div>
                    <label className={styles.label}>{t('tools.qrcode_generator.logo_width')}</label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="20"
                        max="150"
                        value={logoWidth}
                        onChange={(e) => setLogoWidth(Number(e.target.value))}
                        className="w-full"
                      />
                      <span className={styles.rangeValue}>{logoWidth}</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className={styles.label}>{t('tools.qrcode_generator.logo_height')}</label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="20"
                        max="150"
                        value={logoHeight}
                        onChange={(e) => setLogoHeight(Number(e.target.value))}
                        className="w-full"
                      />
                      <span className={styles.rangeValue}>{logoHeight}</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className={styles.label}>{t('tools.qrcode_generator.logo_opacity')}</label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={logoOpacity}
                        onChange={(e) => setLogoOpacity(Number(e.target.value))}
                        className="w-full"
                      />
                      <span className={styles.rangeValue}>{Math.round(logoOpacity * 100)}%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="removeQrCodeBehindLogo"
                      checked={removeQrCodeBehindLogo}
                      onChange={(e) => setRemoveQrCodeBehindLogo(e.target.checked)}
                      className="form-checkbox"
                    />
                    <label htmlFor="removeQrCodeBehindLogo" className="text-sm cursor-pointer">
                      {t('tools.qrcode_generator.remove_code_behind_logo')}
                    </label>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* 右侧面板 - 预览和说明 */}
        <div className="lg:col-span-2 space-y-6">
          <div className={styles.card}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={styles.heading}>{t('tools.qrcode_generator.preview')}</h2>
              <div className="flex space-x-2">
                <button 
                  onClick={copyQRValue} 
                  className="text-tertiary hover:text-purple transition-colors"
                  title={t('tools.qrcode_generator.copy_content')}
                >
                  <FontAwesomeIcon icon={copied ? faCheck : faCopy} />
                </button>
                <button 
                  onClick={downloadQRCode} 
                  className="text-tertiary hover:text-purple transition-colors"
                  title={t('tools.qrcode_generator.download_qrcode')}
                  disabled={downloading}
                >
                  <FontAwesomeIcon icon={faDownload} className={downloading ? 'animate-pulse' : ''} />
                </button>
                <button 
                  onClick={resetSettings} 
                  title={t('tools.qrcode_generator.reset_settings')}
                  className="text-tertiary hover:text-purple transition-colors"
                >
                  <FontAwesomeIcon icon={faRedo} />
                </button>
              </div>
            </div>
            
            <div className={styles.preview}>
              {value ? (
                <div className={styles.flexCenter}>
                  <QRCode
                    ref={qrCodeRef}
                    value={value}
                    size={size}
                    quietZone={quietZone}
                    bgColor={bgColor}
                    fgColor={fgColor}
                    logoImage={logoImage || undefined}
                    logoWidth={logoWidth}
                    logoHeight={logoHeight}
                    logoOpacity={logoOpacity}
                    removeQrCodeBehindLogo={removeQrCodeBehindLogo}
                    eyeColor={eyeColor}
                    eyeRadius={eyeRadius}
                    qrStyle={qrStyle}
                    logoPadding={0}
                    ecLevel="H"
                  />
                </div>
              ) : (
                <div className={styles.placeholder}>{t('tools.qrcode_generator.please_input_content')}</div>
              )}
            </div>
          </div>
          
          <div className={styles.card}>
            <h2 className={styles.heading}>{t('tools.qrcode_generator.instructions')}</h2>
            
            <div className="space-y-2 text-secondary text-sm">
              <p>{t('tools.qrcode_generator.instruction_1')}</p>
              <p>{t('tools.qrcode_generator.instruction_2')}</p>
              <p>{t('tools.qrcode_generator.instruction_3')}</p>
              <p>{t('tools.qrcode_generator.instruction_4')}</p>
            </div>
            
            <p className={styles.secondaryText}>{t('tools.qrcode_generator.note')}</p>
          </div>
        </div>
      </div>
    </div>
  );
} 