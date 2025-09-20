/**
 * QUITTR 生产环境优化器
 * 自动移除调试代码、优化性能、准备上架版本
 */

class ProductionOptimizer {
    constructor() {
        this.isProduction = this.detectEnvironment();
        this.debugRemoved = false;
        this.performanceOptimized = false;
        
        if (this.isProduction) {
            this.init();
        }
    }

    /**
     * 检测运行环境
     */
    detectEnvironment() {
        // 检测是否为生产环境
        const hostname = window.location.hostname;
        const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
        const hasDebugParam = window.location.search.includes('debug=true');
        
        return !isLocalhost && !hasDebugParam;
    }

    /**
     * 初始化优化器
     */
    init() {
        this.removeDebugCode();
        this.optimizePerformance();
        this.setupErrorHandling();
        this.optimizeStorage();
        this.setupSecurityHeaders();
    }

    /**
     * 移除调试代码
     */
    removeDebugCode() {
        // 禁用 console 输出
        if (this.isProduction) {
            const noop = () => {};
            window.console = {
                log: noop,
                warn: noop,
                error: noop,
                info: noop,
                debug: noop,
                trace: noop,
                group: noop,
                groupEnd: noop,
                time: noop,
                timeEnd: noop
            };
        }

        // 替换 alert 为用户友好的提示
        window.alert = (message) => {
            if (window.ToastManager) {
                window.ToastManager.show(message, 'info');
            }
        };

        // 替换 confirm 为模态框
        window.confirm = (message) => {
            return new Promise((resolve) => {
                if (window.showConfirmModal) {
                    window.showConfirmModal(message, resolve);
                } else {
                    resolve(true); // 默认确认
                }
            });
        };

        this.debugRemoved = true;
    }

    /**
     * 性能优化
     */
    optimizePerformance() {
        // 图片懒加载优化
        this.setupImageLazyLoading();
        
        // 资源预加载
        this.setupResourcePreloading();
        
        // 内存管理
        this.setupMemoryManagement();
        
        // 事件节流
        this.setupEventThrottling();

        this.performanceOptimized = true;
    }

    /**
     * 图片懒加载
     */
    setupImageLazyLoading() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                            imageObserver.unobserve(img);
                        }
                    }
                });
            });

            // 观察所有带有 data-src 的图片
            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }
    }

    /**
     * 资源预加载
     */
    setupResourcePreloading() {
        const criticalResources = [
            '/css/styles.css',
            '/js/utils.js',
            '/js/security.js'
        ];

        criticalResources.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = resource;
            link.as = resource.endsWith('.css') ? 'style' : 'script';
            document.head.appendChild(link);
        });
    }

    /**
     * 内存管理
     */
    setupMemoryManagement() {
        // 定期清理未使用的缓存
        setInterval(() => {
            this.cleanupCache();
        }, 300000); // 5分钟清理一次

        // 页面卸载时清理
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });
    }

    /**
     * 事件节流
     */
    setupEventThrottling() {
        // 滚动事件节流
        let scrollTimeout;
        const originalAddEventListener = window.addEventListener;
        
        window.addEventListener = function(type, listener, options) {
            if (type === 'scroll') {
                const throttledListener = function(e) {
                    if (scrollTimeout) return;
                    scrollTimeout = setTimeout(() => {
                        listener(e);
                        scrollTimeout = null;
                    }, 16); // 60fps
                };
                return originalAddEventListener.call(this, type, throttledListener, options);
            }
            return originalAddEventListener.call(this, type, listener, options);
        };
    }

    /**
     * 错误处理
     */
    setupErrorHandling() {
        window.addEventListener('error', (event) => {
            // 生产环境下静默处理错误，避免暴露敏感信息
            if (this.isProduction) {
                event.preventDefault();
                this.logError('JavaScript Error', event.error);
            }
        });

        window.addEventListener('unhandledrejection', (event) => {
            if (this.isProduction) {
                event.preventDefault();
                this.logError('Unhandled Promise Rejection', event.reason);
            }
        });
    }

    /**
     * 存储优化
     */
    optimizeStorage() {
        // 加密敏感数据
        const originalSetItem = localStorage.setItem;
        localStorage.setItem = function(key, value) {
            if (key.includes('payment') || key.includes('password') || key.includes('token')) {
                value = btoa(value); // 简单的Base64编码，实际应用中应使用更强的加密
            }
            return originalSetItem.call(this, key, value);
        };

        const originalGetItem = localStorage.getItem;
        localStorage.getItem = function(key) {
            const value = originalGetItem.call(this, key);
            if (value && (key.includes('payment') || key.includes('password') || key.includes('token'))) {
                try {
                    return atob(value);
                } catch (e) {
                    return value;
                }
            }
            return value;
        };

        // 定期清理过期数据
        this.cleanupExpiredData();
    }

    /**
     * 安全头设置
     */
    setupSecurityHeaders() {
        // 设置更严格的CSP
        const meta = document.createElement('meta');
        meta.httpEquiv = 'Content-Security-Policy';
        meta.content = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https:;";
        document.head.appendChild(meta);

        // 防止点击劫持
        const frameOptions = document.createElement('meta');
        frameOptions.httpEquiv = 'X-Frame-Options';
        frameOptions.content = 'DENY';
        document.head.appendChild(frameOptions);

        // XSS保护
        const xssProtection = document.createElement('meta');
        xssProtection.httpEquiv = 'X-XSS-Protection';
        xssProtection.content = '1; mode=block';
        document.head.appendChild(xssProtection);

        // 内容类型嗅探保护
        const contentType = document.createElement('meta');
        contentType.httpEquiv = 'X-Content-Type-Options';
        contentType.content = 'nosniff';
        document.head.appendChild(contentType);
    }

    /**
     * 清理缓存
     */
    cleanupCache() {
        try {
            // 清理localStorage中的临时数据
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('temp_')) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));

            // 清理过期的缓存项
            this.cleanupExpiredData();
        } catch (error) {
            // 静默处理清理错误
        }
    }

    /**
     * 清理过期数据
     */
    cleanupExpiredData() {
        const now = Date.now();
        const expiredKeys = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.includes('_expires_')) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    if (data.expires && data.expires < now) {
                        expiredKeys.push(key);
                    }
                } catch (e) {
                    // 无效数据，标记删除
                    expiredKeys.push(key);
                }
            }
        }

        expiredKeys.forEach(key => localStorage.removeItem(key));
    }

    /**
     * 记录错误（生产环境）
     */
    logError(type, error) {
        try {
            const errorData = {
                type: type,
                message: error.message || error,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                url: window.location.href
            };

            // 存储到本地，后续可以上传到服务器
            const errors = JSON.parse(localStorage.getItem('app_errors') || '[]');
            errors.push(errorData);
            
            // 只保留最近50个错误
            if (errors.length > 50) {
                errors.splice(0, errors.length - 50);
            }
            
            localStorage.setItem('app_errors', JSON.stringify(errors));
        } catch (e) {
            // 静默处理错误记录失败
        }
    }

    /**
     * 页面清理
     */
    cleanup() {
        // 清理事件监听器
        // 清理定时器
        // 清理未完成的请求
    }

    /**
     * 获取优化状态
     */
    getOptimizationStatus() {
        return {
            isProduction: this.isProduction,
            debugRemoved: this.debugRemoved,
            performanceOptimized: this.performanceOptimized,
            timestamp: new Date().toISOString()
        };
    }
}

// 自动初始化
if (typeof window !== 'undefined') {
    window.ProductionOptimizer = new ProductionOptimizer();
}