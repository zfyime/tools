'use client';

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faSearch, faTimes, faChevronDown, faBook, faCode, faCloud, faBell, faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';
import { faStar as farStar } from '@fortawesome/free-regular-svg-icons';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import categories from '@/config/categories';
import tools from '@/config/tools';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';
import LanguageToggle from '@/components/LanguageToggle';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

export default function Home() {
  const { t, language } = useLanguage();
  const [activeCategory, setActiveCategory] = useState(() => {
    // 从 localStorage 获取上次选择的分类，如果没有则默认为 "all"
    if (typeof window !== 'undefined') {
      return localStorage.getItem('lastActiveCategory') || "all";
    }
    return "all";
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [iconsLoaded, setIconsLoaded] = useState(false);
  const [favoriteTools, setFavoriteTools] = useState<string[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [firstFavoriteAdded, setFirstFavoriteAdded] = useState(false);
  const [prefetchedTools, setPrefetchedTools] = useState<Set<string>>(new Set());
  const [loadingProgress, setLoadingProgress] = useState<{ current: number, total: number }>({ current: 0, total: 0 });
  const [showProductsDropdown, setShowProductsDropdown] = useState(false);
  const router = useRouter();

  // 产品推荐列表
  const recommendedProducts = [
    { title: "ShowDoc", url: "https://www.showdoc.com.cn/", description: "API文档、技术文档工具", icon: faBook },
    { title: "RunApi", url: "https://www.runapi.com.cn/", description: "接口管理与测试平台", icon: faCode },
    { title: "大风云", url: "https://www.dfyun.com.cn/", description: "性价比巨高的CDN服务", icon: faCloud },
    { title: "Push", url: "https://push.showdoc.com.cn/", description: "消息推送服务", icon: faBell }
  ];

  // 点击其他区域关闭产品推荐下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('#products-dropdown-container')) {
        setShowProductsDropdown(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // 切换产品推荐下拉菜单的显示状态
  const toggleProductsDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowProductsDropdown(prev => !prev);
  };

  // 批量工具预加载管理
  useEffect(() => {
    let isMounted = true;
    
    // 页面完全加载后开始批量预加载
    const startBatchPrefetch = () => {
      // 获取收藏的工具列表
      const savedFavorites = localStorage.getItem('favoriteTools');
      const userFavorites = savedFavorites ? JSON.parse(savedFavorites) : [];
      
      // 按优先级排序工具：1. 收藏的工具 2. 常用工具 3. 其他工具
      const favoriteTools = tools.filter(tool => userFavorites.includes(tool.code));
      const commonTools = tools.filter(tool => 
        tool.category.includes('common') && !userFavorites.includes(tool.code)
      );
      const otherTools = tools.filter(tool => 
        !tool.category.includes('common') && !userFavorites.includes(tool.code)
      );
      
      // 按优先级顺序合并工具列表
      const orderedTools = [...favoriteTools, ...commonTools, ...otherTools];
      
      if (!isMounted) return;
      
      // 设置总数
      setLoadingProgress({ current: 0, total: orderedTools.length });
      
      // 创建预加载队列
      const prefetchQueue = async () => {
        const newPrefetchedSet = new Set(prefetchedTools);
        
        for (let i = 0; i < orderedTools.length; i++) {
          if (!isMounted) return;
          
          const tool = orderedTools[i];
          
          // 如果已经预加载过，跳过
          if (newPrefetchedSet.has(tool.code)) {
            setLoadingProgress(prev => ({ ...prev, current: prev.current + 1 }));
            continue;
          }
          
          try {
            // 计算优先级：收藏 > 常用 > 其他
            const isPriority = userFavorites.includes(tool.code) || 
                              (i < favoriteTools.length + commonTools.length);
            
            // 使用 fetch 预加载页面内容
            const prefetchUrl = `/tools/${tool.code}`;
            const response = await fetch(prefetchUrl, { 
              priority: isPriority ? 'high' : 'low',
              method: 'GET',
              cache: 'default'
            });
            
            if (!isMounted) return;
            
            if (response.ok) {
              // 预解析响应以确保它被缓存
              await response.text();
              
              // 更新已预加载的工具集合
              newPrefetchedSet.add(tool.code);
              
              // 更新进度
              setLoadingProgress(prev => ({ ...prev, current: prev.current + 1 }));
              
              // 更新预加载状态
              if (isMounted) {
                setPrefetchedTools(prev => {
                  const updatedSet = new Set(prev);
                  updatedSet.add(tool.code);
                  return updatedSet;
                });
              }
            } else {
              // 即使请求不成功也更新进度
              setLoadingProgress(prev => ({ ...prev, current: prev.current + 1 }));
            }
          } catch (error) {
            console.warn(`批量预加载工具 ${tool.code} 失败:`, error);
            // 即使失败也更新进度
            setLoadingProgress(prev => ({ ...prev, current: prev.current + 1 }));
          }
          
          // 调整不同优先级工具的预加载延迟
          if (i < orderedTools.length - 1) {
            // 收藏与常用工具间隔短一些，其他工具间隔长一些
            const delay = i < favoriteTools.length + commonTools.length ? 150 : 300;
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
        
        // 预加载完成后，在开发环境打印信息
        if (process.env.NODE_ENV === 'development') {
          console.log(`预加载完成! 收藏工具: ${favoriteTools.length}, 常用工具: ${commonTools.length}, 其他工具: ${otherTools.length}`);
        }
      };
      
      // 开始预加载队列
      prefetchQueue();
    };
    
    // 等待页面完全加载后开始预加载
    if (document.readyState === 'complete') {
      // 给页面内容完全渲染一些时间，然后开始批量预加载
      setTimeout(startBatchPrefetch, 2000);
    } else {
      window.addEventListener('load', () => {
        // 页面加载完成后延迟一段时间再开始预加载
        setTimeout(startBatchPrefetch, 2000);
      });
    }
    
    // 清理函数
    return () => {
      isMounted = false;
    };
  }, []);

  // 添加预加载工具页面的函数
  const prefetchTool = (toolCode: string) => {
    // 如果已经预加载过，则不再重复预加载
    if (prefetchedTools.has(toolCode)) {
      return;
    }
    
    // 使用 fetch 预加载页面内容
    const prefetchUrl = `/tools/${toolCode}`;
    fetch(prefetchUrl, { priority: 'low' })
      .then(response => {
        if (!response.ok) {
          throw new Error(`预加载失败: ${response.status}`);
        }
        return response.text();
      })
      .then(() => {
        // 成功预加载后更新状态
        setPrefetchedTools(prev => {
          const newSet = new Set(prev);
          newSet.add(toolCode);
          return newSet;
        });
      })
      .catch(error => {
        console.warn(`工具 ${toolCode} 预加载失败:`, error);
      });
  };

  // 处理工具导航并显示加载指示器
  const navigateToTool = (toolCode: string) => {
    // 检查是否已预加载 - 使用最新状态重新检查一次
    const isPrefetched = prefetchedTools.has(toolCode);

    // 检查是否是首次访问该工具
    const isFirstVisit = !localStorage.getItem(`visited-${toolCode}`);
    
    // 记录已访问工具
    localStorage.setItem(`visited-${toolCode}`, 'true');
    
    // 打印调试信息 - 开发环境
    if (process.env.NODE_ENV === 'development') {
      console.log(`导航到工具: ${toolCode}, 预加载状态: ${isPrefetched ? '已预加载' : '未预加载'}`);
    }
    
    // 如果已预加载，直接导航，不显示loading
    if (isPrefetched) {
      // 在导航前存储一个标志，表示这是从主页导航过来的
      localStorage.setItem('from_homepage', 'true');
      router.push(`/tools/${toolCode}`);
      return;
    }
    
    // 在导航前存储一个标志，表示这是从主页导航过来的
    localStorage.setItem('from_homepage', 'true');
    
    const loadingId = 'loading-indicator-' + Date.now();
    const loadingEl = document.createElement('div');
    loadingEl.id = loadingId;
    loadingEl.className = 'fixed inset-0 flex items-center justify-center bg-[rgba(0,0,0,0.3)] z-50 backdrop-blur-sm transition-opacity duration-300';
    
    // 使用自适应主题的加载指示器
    const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--color-bg-card').trim();
    const borderColor = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim();
    const textColor = getComputedStyle(document.documentElement).getPropertyValue('--color-text-primary').trim();
    
    loadingEl.innerHTML = `<div style="background-color: rgb(${bgColor}); border: 1px solid rgba(${borderColor}, 0.3);" class="p-4 rounded-lg shadow-lg">
      <div class="flex items-center gap-3">
        <div style="border-color: rgb(${borderColor}); border-top-color: transparent;" class="w-6 h-6 border-2 rounded-full animate-spin"></div>
        <div style="color: rgb(${textColor});">加载中...</div>
      </div>
    </div>`;
    
    document.body.appendChild(loadingEl);
    
    const removeLoadingIndicator = () => {
      const indicator = document.getElementById(loadingId);
      if (indicator) {
        indicator.classList.add('opacity-0');
        setTimeout(() => {
          indicator.remove();
        }, 200);
      }
    };
    
    // 立即导航
    router.push(`/tools/${toolCode}`);
    
    // 超短超时检测，针对缓存页面快速检测
    setTimeout(() => {
      // 如果页面已变化并且不是首次访问，很可能是使用了缓存，可以快速移除loading
      if (window.location.pathname.includes(`/tools/${toolCode}`) && !isFirstVisit) {
        removeLoadingIndicator();
        return;
      }
      
      // 否则继续进行DOM检测
      startDomCheck();
    }, 20);
    
    // 启动DOM监测
    const startDomCheck = () => {
      let checkCount = 0;
      const maxChecks = isFirstVisit ? 20 : 10; // 首次访问检查更多次
      const baseDelay = isFirstVisit ? 50 : 30; // 首次访问间隔更长
      
      const checkForPageLoad = () => {
        // 检查是否已经导航到新页面
        if (window.location.pathname.includes(`/tools/${toolCode}`)) {
          // 检查页面内容是否已经渲染
          const content = document.querySelector('main') || document.querySelector('#tool-content');
          if (content) {
            removeLoadingIndicator();
            return;
          }
        }
        
        checkCount++;
        if (checkCount < maxChecks) {
          // 最开始快速检查，逐渐减慢检查频率
          const delay = Math.min(baseDelay + checkCount * 5, isFirstVisit ? 100 : 60);
          setTimeout(checkForPageLoad, delay);
        }
      };
      
      // 立即开始检查
      checkForPageLoad();
    };
    
    // 兜底保障，确保加载指示器一定会被移除
    // 对于首次访问等待更长时间，后续访问缩短时间
    setTimeout(removeLoadingIndicator, isFirstVisit ? 800 : 300);
  };

  // 图标加载处理
  useEffect(() => {
    // 设置小延迟确保图标已加载
    const timer = setTimeout(() => {
      setIconsLoaded(true);
    }, 200);
    
    return () => clearTimeout(timer);
  }, []);

  // 加载收藏工具和首次收藏状态
  useEffect(() => {
    const savedFavorites = localStorage.getItem('favoriteTools');
    const hasSeenFirstFavoriteNotification = localStorage.getItem('hasSeenFirstFavoriteNotification') === 'true';
    
    setFirstFavoriteAdded(hasSeenFirstFavoriteNotification);
    
    if (savedFavorites) {
      setFavoriteTools(JSON.parse(savedFavorites));
      setShowFavorites(true);
    }
  }, []);

  // 收藏/取消收藏工具
  const toggleFavorite = (toolCode: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // 检查是否要添加到收藏
    const isAdding = !favoriteTools.includes(toolCode);
    
    const updatedFavorites = isAdding
      ? [...favoriteTools, toolCode]
      : favoriteTools.filter(code => code !== toolCode);
    
    setFavoriteTools(updatedFavorites);
    localStorage.setItem('favoriteTools', JSON.stringify(updatedFavorites));
    
    // 更新收藏分类的显示状态
    setShowFavorites(updatedFavorites.length > 0);
    
    // 如果是添加收藏且是第一次收藏，显示通知
    if (isAdding && !firstFavoriteAdded) {
      setShowNotification(true);
      setFirstFavoriteAdded(true);
      localStorage.setItem('hasSeenFirstFavoriteNotification', 'true');
      
      // 5秒后自动关闭通知
      setTimeout(() => {
        setShowNotification(false);
      }, 5000);
    }
  };

  // 关闭通知
  const closeNotification = () => {
    setShowNotification(false);
  };

  // 切换到收藏分类
  const viewFavorites = () => {
    setActiveCategory('favorites');
  };

  // 过滤工具列表
  const filteredTools = () => tools.filter(tool => {
    // 根据搜索词过滤
    if (searchTerm && !t(`tools.${tool.code}.title`).toLowerCase().includes(searchTerm.toLowerCase()) && 
        !t(`tools.${tool.code}.description`).toLowerCase().includes(searchTerm.toLowerCase()) &&
        !tool.keywords?.some(keyword => keyword.toLowerCase().includes(searchTerm.toLowerCase()))) {
      return false;
    }
    
    // 过滤收藏分类
    if (activeCategory === 'favorites') {
      return favoriteTools.includes(tool.code);
    }
    
    // 根据类别过滤
    if (activeCategory !== "all" && !tool.category.includes(activeCategory)) {
      return false;
    }
    
    return true;
  }).sort((a, b) => {
    // 搜索优先级排序
    if (searchTerm) {
      // 计算匹配得分 (越高越靠前)
      const getScore = (tool: typeof tools[0]) => {
        let score = 0;
        const term = searchTerm.toLowerCase();
        const title = t(`tools.${tool.code}.title`).toLowerCase();
        const description = t(`tools.${tool.code}.description`).toLowerCase();
        
        // 标题匹配权重最高
        if (title.includes(term)) {
          score += 100;
          // 标题精确匹配给额外加分
          if (title === term) {
            score += 50;
          }
        }
        
        // 关键词匹配权重次之
        if (tool.keywords?.some(keyword => keyword.toLowerCase() === term)) {
          // 关键词精确匹配
          score += 80;
        } else if (tool.keywords?.some(keyword => keyword.toLowerCase().includes(term))) {
          // 关键词部分匹配
          score += 60;
        }
        
        // 描述匹配权重稍低
        if (description.includes(term)) {
          score += 40;
        }
        
        return score;
      };
      
      const scoreA = getScore(a);
      const scoreB = getScore(b);
      
      // 按分数降序排列
      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }
    }
    
    // 在全部工具视图中，将常用工具排在前面
    if (activeCategory === "all") {
      const aIsCommon = a.category.includes('common');
      const bIsCommon = b.category.includes('common');
      
      if (aIsCommon && !bIsCommon) return -1;
      if (!aIsCommon && bIsCommon) return 1;
    }
    
    return 0;
  });

  // 构建分类列表（添加动态的"我的收藏"分类）
  const allCategories = [
    ...categories.slice(0, 2), // 全部工具和常用工具
    ...(showFavorites ? [{ code: "favorites", name: t('common.favorites'), active: false }] : []),
    ...categories.slice(2) // 其余分类
  ];

  // 更新分类选择处理函数
  const handleCategoryChange = (categoryCode: string) => {
    setActiveCategory(categoryCode);
    // 保存到 localStorage
    localStorage.setItem('lastActiveCategory', categoryCode);
  };

  return (
    <div className={`min-h-screen flex flex-col max-w-[1440px] mx-auto px-4 sm:px-8 py-4 sm:py-6 ${!iconsLoaded ? 'opacity-90' : 'opacity-100 transition-opacity duration-300'}`}>
      {/* 通知提示 */}
      {showNotification && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-2 bg-[rgb(var(--color-primary))] text-[rgb(var(--color-bg-main))] px-4 py-3 rounded-lg shadow-sm border border-[var(--color-border)] animate-fadeIn">
          <span>工具已添加到收藏夹，点击导航栏中的&quot;我的收藏&quot;查看</span>
          <button 
            className="ml-2 text-[rgb(var(--color-bg-main))] hover:opacity-80 transition-opacity"
            onClick={closeNotification}
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
      )}

      {/* 添加预加载进度提示（仅在开发环境显示） */}
      {process.env.NODE_ENV === 'development' && loadingProgress.total > 0 && (
        <div className="fixed bottom-4 left-4 z-40 bg-[rgb(var(--color-bg-card))] border border-[rgba(var(--color-primary),0.3)] rounded-lg p-2 text-xs opacity-80">
          <div className="flex items-center gap-2">
            <div>预加载: {loadingProgress.current}/{loadingProgress.total}</div>
            <div className="w-20 h-1.5 bg-[rgb(var(--color-bg-secondary))] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[rgb(var(--color-primary))]"
                style={{width: `${(loadingProgress.current / loadingProgress.total) * 100}%`}}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* 头部 */}
      <header className="sticky top-0 z-10 backdrop-blur-md border-b border-[rgba(var(--color-primary),0.1)] bg-[rgba(var(--color-bg-secondary),0.8)]">
        <div className="container mx-auto px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-[rgb(var(--color-primary))]">
                {t('common.siteName')}
              </h1>
              <span className="mx-2 text-sm text-[rgb(var(--color-text-secondary))]">|</span>
              <p className="text-sm text-[rgb(var(--color-text-secondary))]">{t('common.siteDesc')}</p>
            </div>
            
            <div className="flex items-center space-x-2 md:hidden">
              <button 
                className="btn-primary w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center"
                onClick={viewFavorites}
                title={t('common.favorites')}
              >
                <FontAwesomeIcon icon={faStar} className="text-sm md:text-base" />
              </button>
              
              <div className="w-px h-6 bg-[rgba(var(--color-text-secondary),0.2)]"></div>
              
              <LanguageToggle />
              <ThemeToggle />
              
              {language === 'zh' && (
                <>
                  <div className="w-px h-6 bg-[rgba(var(--color-text-secondary),0.2)]"></div>
                  
                  <div className="relative">
                    <button
                      className="btn-secondary w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center relative"
                      onClick={toggleProductsDropdown}
                      title={t('common.productRecommend')}
                    >
                      <FontAwesomeIcon icon={faExternalLinkAlt} className="text-sm md:text-base" />
                      <FontAwesomeIcon icon={faChevronDown} className="absolute text-[0.5rem] md:text-[0.6rem] bottom-0.5 md:bottom-1 right-0.5 md:right-1" />
                    </button>
                  </div>
                </>
              )}
              
              <a 
                href="https://github.com/star7th/jisuxiang"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center"
                title="GitHub"
              >
                <FontAwesomeIcon icon={faGithub} className="text-sm md:text-base" />
              </a>
            </div>
          </div>
          
          <div className="mt-3 md:mt-0 relative w-full md:w-auto flex-1 md:max-w-md">
            <div className="relative">
              <input
                type="text"
                placeholder={t('common.search')}
                className="w-full bg-[rgb(var(--color-bg-card))] rounded-full pl-10 pr-4 py-2 text-[rgb(var(--color-text-primary))] outline-none focus:ring-2 ring-[rgb(var(--color-primary))] transition-shadow shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FontAwesomeIcon 
                icon={faSearch} 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[rgb(var(--color-text-secondary))]" 
              />
              {searchTerm && (
                <button 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  onClick={() => setSearchTerm('')}
                >
                  <FontAwesomeIcon 
                    icon={faTimes} 
                    className="text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-text-primary))] transition-colors" 
                  />
                </button>
              )}
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-3">
            <button 
              className="btn-primary w-10 h-10 rounded-full flex items-center justify-center group relative"
              onClick={viewFavorites}
              title={t('common.favorites')}
            >
              <FontAwesomeIcon icon={faStar} />
              <span className="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-2 py-1 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 text-sm z-10"
                style={{
                  backgroundColor: 'rgb(var(--color-bg-secondary))',
                  color: 'rgb(var(--color-text-primary))'
                }}>
                {t('common.favorites')}
              </span>
            </button>
            
            <div className="w-px h-6 bg-[rgba(var(--color-text-secondary),0.2)]"></div>
            
            <LanguageToggle />
            <ThemeToggle />
            
            <div className="w-px h-6 bg-[rgba(var(--color-text-secondary),0.2)]"></div>
            
            {/* GitHub链接按钮 */}
            <a 
              href="https://github.com/star7th/jisuxiang"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary w-10 h-10 rounded-full flex items-center justify-center group relative"
              title="GitHub"
            >
              <FontAwesomeIcon icon={faGithub} />
              <span className="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-2 py-1 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 text-sm z-10"
                style={{
                  backgroundColor: 'rgb(var(--color-bg-secondary))',
                  color: 'rgb(var(--color-text-primary))'
                }}>
                GitHub
              </span>
            </a>
            
            {/* 产品推荐下拉菜单 - 仅在中文语言下显示 */}
            {language === 'zh' && (
              <div id="products-dropdown-container" className="relative">
                <button
                  className="btn-secondary w-10 h-10 rounded-full flex items-center justify-center group relative"
                  onClick={toggleProductsDropdown}
                  title={t('common.productRecommend')}
                >
                  <FontAwesomeIcon icon={faExternalLinkAlt} />
                  <FontAwesomeIcon icon={faChevronDown} className={`absolute text-[0.6rem] bottom-1 right-1 transition-transform duration-200 ${showProductsDropdown ? 'rotate-180' : ''}`} />
                  <span className="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-2 py-1 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 text-sm z-10"
                    style={{
                      backgroundColor: 'rgb(var(--color-bg-secondary))',
                      color: 'rgb(var(--color-text-primary))'
                    }}>
                    {t('common.productRecommend')}
                  </span>
                </button>
                
                {showProductsDropdown && (
                  <div className="absolute right-0 top-full mt-1 w-56 rounded-md shadow-lg border z-50 animate-fadeIn overflow-hidden"
                      style={{
                        backgroundColor: 'rgb(var(--color-bg-card))',
                        borderColor: 'rgba(var(--color-primary), 0.2)'
                      }}>
                    <div className="py-1">
                      {recommendedProducts.map((product, index) => (
                        <a 
                          key={index}
                          href={product.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block px-4 py-3 hover:bg-[rgba(var(--color-primary),0.1)] transition-colors"
                          style={{color: 'rgb(var(--color-text-primary))'}}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{backgroundColor: 'rgba(var(--color-primary), 0.1)'}}>
                              <FontAwesomeIcon icon={product.icon} style={{color: 'rgb(var(--color-primary))'}} />
                            </div>
                            <div>
                              <div className="font-medium">{product.title}</div>
                              <div className="text-xs mt-1" style={{color: 'rgb(var(--color-text-tertiary))'}}>{product.description}</div>
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 主内容区域 */}
      <main className="flex-1 container mx-auto">
        {/* 分类导航 - 独立导航栏 */}
        <div className="flex flex-wrap nav-bar gap-2 sm:gap-3 mb-6 sm:mb-8 mt-6">
          {allCategories.map((category, index) => (
            <button 
              key={index}
              className={`px-4 py-2 rounded-button whitespace-nowrap transition-all text-sm font-medium ${
                activeCategory === category.code 
                  ? 'bg-[rgb(var(--color-primary))] text-[rgb(var(--color-bg-main))] shadow-sm' 
                  : 'btn-secondary text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-text-primary))]'
              }`}
              onClick={() => handleCategoryChange(category.code)}
            >
              {t(`categories.${category.code}`)}
            </button>
          ))}
        </div>

        {/* 工具列表 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {filteredTools().map((tool, index) => (
            <div 
              key={index} 
              className="card p-6 flex flex-col cursor-pointer min-h-[170px]"
              onClick={() => navigateToTool(tool.code)}
              onMouseEnter={() => prefetchTool(tool.code)}
            >
              {/* 添加不可见的 Link 组件用于 Next.js 原生预加载 */}
              <Link 
                href={`/tools/${tool.code}`} 
                prefetch={true} 
                className="hidden" 
                aria-hidden="true"
              />
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="icon-container w-10 h-10 flex-shrink-0">
                    <FontAwesomeIcon icon={tool.icon} className="icon" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium" style={{color: 'rgb(var(--color-text-primary))'}}>{t(`tools.${tool.code}.title`)}</h3>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {tool.category.map((catCode, catIndex) => (
                        <span 
                          key={catIndex} 
                          className="category-tag"
                        >
                          {t(`categories.${catCode}`)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <button 
                  className="transition-colors"
                  style={{color: 'rgb(var(--color-text-tertiary))'}}
                  onClick={(e) => toggleFavorite(tool.code, e)}
                >
                  <FontAwesomeIcon 
                    icon={favoriteTools.includes(tool.code) ? faStar : farStar}
                    className={favoriteTools.includes(tool.code) ? 'text-[rgb(var(--color-text-primary))]' : ''} 
                  />
                </button>
              </div>
              <p className="text-sm mt-auto" style={{color: 'rgb(var(--color-text-secondary))'}}>{t(`tools.${tool.code}.description`)}</p>
            </div>
          ))}
        </div>
      </main>

      {/* 底部 */}
      <footer className="mt-auto py-6 sm:py-8 border-t" style={{borderColor: 'rgb(var(--color-bg-secondary))'}}>
        <div className="flex justify-center items-center text-sm" style={{color: 'rgb(var(--color-text-tertiary))'}}>
          <span>本站基于开源项目 </span>
          <a 
            href="https://github.com/star7th/jisuxiang" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="mx-1 text-[rgb(var(--color-text-primary))] hover:underline transition-colors"
          >
            极速箱
          </a>
          <span> 搭建</span>
        </div>
      </footer>
    </div>
  );
}
