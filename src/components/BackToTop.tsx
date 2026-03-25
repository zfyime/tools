'use client';

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUp } from '@fortawesome/free-solid-svg-icons';

interface BackToTopProps {
  scrollThreshold?: number; // 显示按钮的滚动阈值（像素）
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'; // 按钮位置
  offset?: number; // 与屏幕边缘的距离（像素）
  containerRef?: React.RefObject<HTMLElement>; // 滚动容器引用，默认为window
  zIndex?: number; // 自定义z-index
  size?: 'small' | 'medium' | 'large'; // 按钮大小
}

/**
 * 回到顶部组件
 * 
 * 用法:
 * 1. 基本用法: <BackToTop />
 * 2. 自定义: <BackToTop position="bottom-left" offset={30} size="large" />
 * 3. 对特定容器: 
 *    const containerRef = useRef<HTMLDivElement>(null);
 *    <div ref={containerRef} style={{height: '500px', overflow: 'auto'}}>
 *      内容
 *      <BackToTop containerRef={containerRef} />
 *    </div>
 */
const BackToTop: React.FC<BackToTopProps> = ({
  scrollThreshold = 300,
  position = 'bottom-right',
  offset = 20,
  containerRef,
  zIndex = 40,
  size = 'medium'
}) => {
  const [isVisible, setIsVisible] = useState(false);

  // 生成位置样式
  const getPositionStyle = () => {
    const positionStyle: React.CSSProperties = {};
    
    if (position.includes('bottom')) {
      positionStyle.bottom = offset;
    } else {
      positionStyle.top = offset;
    }
    
    if (position.includes('right')) {
      positionStyle.right = offset;
    } else {
      positionStyle.left = offset;
    }
    
    return positionStyle;
  };

  // 根据大小获取样式类名
  const getSizeClassName = () => {
    switch (size) {
      case 'small':
        return 'w-8 h-8';
      case 'large':
        return 'w-12 h-12';
      case 'medium':
      default:
        return 'w-10 h-10';
    }
  };

  // 处理滚动事件
  const handleScroll = () => {
    if (containerRef && containerRef.current) {
      setIsVisible(containerRef.current.scrollTop > scrollThreshold);
    } else {
      setIsVisible(window.scrollY > scrollThreshold);
    }
  };

  // 回到顶部
  const scrollToTop = () => {
    if (containerRef && containerRef.current) {
      containerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } else {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  // 设置滚动监听
  useEffect(() => {
    const scrollElement = containerRef?.current || window;
    scrollElement.addEventListener('scroll', handleScroll);
    
    // 初始检查
    handleScroll();
    
    return () => {
      scrollElement.removeEventListener('scroll', handleScroll);
    };
  }, [containerRef, scrollThreshold]);

  // 如果不可见，不渲染
  if (!isVisible) return null;

  const positionStyle = getPositionStyle();

  return (
    <button
      onClick={scrollToTop}
      className={`
        fixed 
        ${getSizeClassName()} 
        bg-[rgb(var(--color-primary))]
        text-white 
        rounded-full 
        flex 
        items-center 
        justify-center 
        shadow-lg 
        hover:shadow-xl 
        transition-all 
        duration-300 
        hover:scale-110
        focus:outline-none 
        focus:ring-2 
        focus:ring-[#6366F1] 
        focus:ring-opacity-50
      `}
      style={{ 
        ...positionStyle,
        zIndex 
      }}
      aria-label="回到顶部"
      title="回到顶部"
    >
      <FontAwesomeIcon icon={faArrowUp} />
    </button>
  );
};

export default BackToTop; 