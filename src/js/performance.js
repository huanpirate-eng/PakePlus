/**
 * 性能优化工具库
 * 包括图片懒加载、代码优化、内存管理等功能
 */

window.QuittrPerformance = (function() {
    'use strict';

    // 图片懒加载观察器
    let imageObserver = null;
    let loadedImages = new Set();

    // 防抖函数
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // 节流函数
    function throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // 初始化图片懒加载
    function initLazyLoading() {
        if ('IntersectionObserver' in window) {
            imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const element = entry.target;
                        
                        // 处理img标签的懒加载
                        if (element.tagName === 'IMG' && element.dataset.src) {
                            loadImage(element);
                        }
                        
                        // 处理背景图片的懒加载
                        if (element.dataset.bg) {
                            loadBackgroundImage(element);
                        }
                        
                        observer.unobserve(element);
                    }
                });
            }, {
                rootMargin: '50px 0px',
                threshold: 0.01
            });

            // 观察所有带有data-src属性的图片
            const lazyImages = document.querySelectorAll('img[data-src]');
            lazyImages.forEach(img => {
                imageObserver.observe(img);
            });
            
            // 观察所有带有data-bg属性的元素
            const lazyBackgrounds = document.querySelectorAll('[data-bg]');
            lazyBackgrounds.forEach(element => {
                imageObserver.observe(element);
            });
        } else {
            // 降级处理：直接加载所有图片
            const lazyImages = document.querySelectorAll('img[data-src]');
            lazyImages.forEach(loadImage);
            
            const lazyBackgrounds = document.querySelectorAll('[data-bg]');
            lazyBackgrounds.forEach(loadBackgroundImage);
        }
    }

    // 加载背景图片
    function loadBackgroundImage(element) {
        const bgUrl = element.dataset.bg;
        if (!bgUrl) return;

        // 显示加载状态
        element.classList.add('loading');
        
        // 创建新的图片对象进行预加载
        const img = new Image();
        
        img.onload = function() {
            element.style.backgroundImage = `url(${bgUrl})`;
            element.classList.remove('loading');
            element.classList.add('loaded');
            
            // 移除data-bg属性
            element.removeAttribute('data-bg');
        };
        
        img.onerror = function() {
            element.classList.remove('loading');
            element.classList.add('error');
            element.style.backgroundImage = 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)';
            element.style.backgroundSize = '20px 20px';
            element.style.backgroundPosition = '0 0, 0 10px, 10px -10px, -10px 0px';
        };
        
        img.src = bgUrl;
    }

    // 加载单个图片
    function loadImage(img) {
        if (loadedImages.has(img)) return;
        
        const src = img.dataset.src;
        if (!src) return;

        // 显示加载状态
        img.classList.add('loading');
        
        // 创建新的图片对象进行预加载
        const newImg = new Image();
        
        newImg.onload = function() {
            img.src = src;
            img.classList.remove('loading');
            img.classList.add('loaded');
            loadedImages.add(img);
            
            // 移除data-src属性
            img.removeAttribute('data-src');
        };
        
        newImg.onerror = function() {
            img.classList.remove('loading');
            img.classList.add('error');
            img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuWbvueJh+WKoOi9veWksei0pTwvdGV4dD48L3N2Zz4=';
            loadedImages.add(img);
        };
        
        newImg.src = src;
    }

    // 优化DOM操作
    function batchDOMUpdates(updates) {
        return new Promise(resolve => {
            requestAnimationFrame(() => {
                updates.forEach(update => update());
                resolve();
            });
        });
    }

    // 内存清理
    function cleanupMemory() {
        // 清理已加载的图片缓存
        if (loadedImages.size > 100) {
            const imagesToRemove = Array.from(loadedImages).slice(0, 50);
            imagesToRemove.forEach(img => loadedImages.delete(img));
        }

        // 清理事件监听器
        const elements = document.querySelectorAll('[data-cleanup]');
        elements.forEach(element => {
            const events = element.dataset.cleanup.split(',');
            events.forEach(event => {
                element.removeEventListener(event.trim(), null);
            });
            element.removeAttribute('data-cleanup');
        });
    }

    // 预加载关键资源
    function preloadCriticalResources() {
        const criticalImages = [
            'images/logo.png',
            'images/default-avatar.png',
            'images/placeholder.jpg'
        ];

        criticalImages.forEach(src => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = src;
            document.head.appendChild(link);
        });
    }

    // 监控性能指标
    function monitorPerformance() {
        if ('performance' in window) {
            // 监控页面加载时间
            window.addEventListener('load', () => {
                setTimeout(() => {
                    const perfData = performance.getEntriesByType('navigation')[0];
                    if (perfData) {
                        console.log('页面加载性能指标:', {
                            DNS查询: perfData.domainLookupEnd - perfData.domainLookupStart,
                            TCP连接: perfData.connectEnd - perfData.connectStart,
                            请求响应: perfData.responseEnd - perfData.requestStart,
                            DOM解析: perfData.domContentLoadedEventEnd - perfData.responseEnd,
                            总加载时间: perfData.loadEventEnd - perfData.navigationStart
                        });
                    }
                }, 0);
            });

            // 监控长任务
            if ('PerformanceObserver' in window) {
                const observer = new PerformanceObserver((list) => {
                    list.getEntries().forEach((entry) => {
                        if (entry.duration > 50) {
                            console.warn('检测到长任务:', entry.name, entry.duration + 'ms');
                        }
                    });
                });
                observer.observe({entryTypes: ['longtask']});
            }
        }
    }

    // 优化滚动性能
    function optimizeScrolling() {
        let ticking = false;

        function updateScrollElements() {
            // 更新滚动相关的元素
            const scrollElements = document.querySelectorAll('[data-scroll-effect]');
            scrollElements.forEach(element => {
                const rect = element.getBoundingClientRect();
                const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
                
                if (isVisible) {
                    element.classList.add('in-viewport');
                } else {
                    element.classList.remove('in-viewport');
                }
            });
            
            ticking = false;
        }

        function onScroll() {
            if (!ticking) {
                requestAnimationFrame(updateScrollElements);
                ticking = true;
            }
        }

        window.addEventListener('scroll', onScroll, { passive: true });
    }

    // 代码分割和动态导入
    function loadModuleOnDemand(moduleName) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = `js/modules/${moduleName}.js`;
            script.onload = () => resolve(window[moduleName]);
            script.onerror = () => reject(new Error(`Failed to load module: ${moduleName}`));
            document.head.appendChild(script);
        });
    }

    // 缓存管理
    const cache = new Map();
    
    function setCache(key, value, ttl = 300000) { // 默认5分钟过期
        const expiry = Date.now() + ttl;
        cache.set(key, { value, expiry });
    }

    function getCache(key) {
        const item = cache.get(key);
        if (!item) return null;
        
        if (Date.now() > item.expiry) {
            cache.delete(key);
            return null;
        }
        
        return item.value;
    }

    function clearExpiredCache() {
        const now = Date.now();
        for (const [key, item] of cache.entries()) {
            if (now > item.expiry) {
                cache.delete(key);
            }
        }
    }

    // 初始化性能优化
    function init() {
        // 等待DOM加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                initLazyLoading();
                optimizeScrolling();
                preloadCriticalResources();
                monitorPerformance();
            });
        } else {
            initLazyLoading();
            optimizeScrolling();
            preloadCriticalResources();
            monitorPerformance();
        }

        // 定期清理内存和缓存
        setInterval(() => {
            cleanupMemory();
            clearExpiredCache();
        }, 300000); // 每5分钟清理一次
    }

    // 公开API
    return {
        init,
        debounce,
        throttle,
        loadImage,
        batchDOMUpdates,
        loadModuleOnDemand,
        setCache,
        getCache,
        cleanupMemory,
        
        // 图片相关
        initLazyLoading,
        
        // 性能监控
        monitorPerformance
    };
})();

// 自动初始化
QuittrPerformance.init();