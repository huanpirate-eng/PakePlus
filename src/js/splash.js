/**
 * 启动页面管理器
 * 负责启动页的动画、加载进度、用户交互和页面跳转
 */
class SplashScreenManager {
    constructor() {
        this.loadingDuration = 3000; // 3秒加载时间
        this.isNavigating = false;
        this.loadingMessages = [
            '正在加载...',
            '初始化应用...',
            '准备就绪...'
        ];
        this.currentMessageIndex = 0;
        this.messageInterval = null;
        
        this.init();
    }

    /**
     * 初始化启动页
     */
    init() {
        // 检查是否应该显示启动页
        if (this.shouldSkipSplash()) {
            this.navigateToMain();
            return;
        }

        // 设置事件监听器
        this.setupEventListeners();
        
        // 开始加载动画
        this.startLoadingAnimation();
        
        // 预加载资源
        this.preloadResources();
        
        // 设置自动跳转
        this.setupAutoNavigation();
    }

    /**
     * 检查是否应该跳过启动页
     */
    shouldSkipSplash() {
        // 如果用户在24小时内访问过，可以跳过启动页
        const lastVisit = localStorage.getItem('quittr_last_visit');
        if (lastVisit) {
            const lastVisitTime = new Date(lastVisit);
            const now = new Date();
            const hoursDiff = (now - lastVisitTime) / (1000 * 60 * 60);
            
            // 24小时内访问过，跳过启动页
            if (hoursDiff < 24) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 点击跳过
        document.addEventListener('click', (e) => {
            if (!this.isNavigating) {
                this.navigateToMain();
            }
        });

        // 键盘跳过
        document.addEventListener('keydown', (e) => {
            if ((e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') && !this.isNavigating) {
                e.preventDefault();
                this.navigateToMain();
            }
        });

        // 触摸跳过（移动端）
        document.addEventListener('touchstart', (e) => {
            if (!this.isNavigating) {
                this.navigateToMain();
            }
        });

        // 页面可见性变化
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseAnimations();
            } else {
                this.resumeAnimations();
            }
        });
    }

    /**
     * 开始加载动画
     */
    startLoadingAnimation() {
        const loadingText = document.querySelector('.loading-text');
        if (!loadingText) return;

        // 更新加载文本
        this.messageInterval = setInterval(() => {
            if (this.currentMessageIndex < this.loadingMessages.length) {
                loadingText.textContent = this.loadingMessages[this.currentMessageIndex];
                this.currentMessageIndex++;
            } else {
                clearInterval(this.messageInterval);
                loadingText.textContent = '点击任意位置继续';
            }
        }, 1000);
    }

    /**
     * 预加载主要资源
     */
    preloadResources() {
        const resources = [
            'css/styles.css',
            'js/utils.js',
            'js/darkmode.js',
            'js/offline.js'
        ];

        resources.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = resource.endsWith('.css') ? 'style' : 'script';
            link.href = resource;
            link.onload = () => {
                console.log(`预加载完成: ${resource}`);
            };
            link.onerror = () => {
                console.warn(`预加载失败: ${resource}`);
            };
            document.head.appendChild(link);
        });
    }

    /**
     * 设置自动跳转
     */
    setupAutoNavigation() {
        setTimeout(() => {
            if (!this.isNavigating) {
                this.navigateToMain();
            }
        }, this.loadingDuration);
    }

    /**
     * 暂停动画
     */
    pauseAnimations() {
        const particles = document.querySelectorAll('.particle');
        particles.forEach(particle => {
            particle.style.animationPlayState = 'paused';
        });
    }

    /**
     * 恢复动画
     */
    resumeAnimations() {
        const particles = document.querySelectorAll('.particle');
        particles.forEach(particle => {
            particle.style.animationPlayState = 'running';
        });
    }

    /**
     * 跳转到主页面
     */
    navigateToMain() {
        // 防止重复触发
        if (this.isNavigating) return;
        this.isNavigating = true;

        // 清理定时器
        if (this.messageInterval) {
            clearInterval(this.messageInterval);
        }

        // 记录访问时间
        this.recordVisit();

        // 添加淡出动画
        document.body.classList.add('fade-out');
        
        // 延迟跳转，等待动画完成
        setTimeout(() => {
            this.performNavigation();
        }, 800);
    }

    /**
     * 记录访问信息
     */
    recordVisit() {
        const now = new Date().toISOString();
        localStorage.setItem('quittr_last_visit', now);
        localStorage.setItem('quittr_visited', 'true');
        
        // 记录访问次数
        const visitCount = parseInt(localStorage.getItem('quittr_visit_count') || '0') + 1;
        localStorage.setItem('quittr_visit_count', visitCount.toString());
    }

    /**
     * 执行页面跳转
     */
    performNavigation() {
        try {
            // 检查目标页面是否存在
            const targetPage = 'index.html';
            
            // 使用 replace 而不是 href，避免在浏览器历史中留下启动页
            window.location.replace(targetPage);
        } catch (error) {
            console.error('页面跳转失败:', error);
            // 降级处理
            window.location.href = 'index.html';
        }
    }

    /**
     * 获取启动页统计信息
     */
    getStats() {
        return {
            visitCount: parseInt(localStorage.getItem('quittr_visit_count') || '0'),
            lastVisit: localStorage.getItem('quittr_last_visit'),
            hasVisited: localStorage.getItem('quittr_visited') === 'true'
        };
    }

    /**
     * 重置启动页设置
     */
    reset() {
        localStorage.removeItem('quittr_last_visit');
        localStorage.removeItem('quittr_visited');
        localStorage.removeItem('quittr_visit_count');
    }
}

/**
 * 启动页工具函数
 */
const SplashUtils = {
    /**
     * 检查是否支持动画
     */
    supportsAnimations() {
        return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    },

    /**
     * 检查是否为移动设备
     */
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },

    /**
     * 获取设备信息
     */
    getDeviceInfo() {
        return {
            isMobile: this.isMobile(),
            supportsAnimations: this.supportsAnimations(),
            screenWidth: window.innerWidth,
            screenHeight: window.innerHeight,
            userAgent: navigator.userAgent
        };
    }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 检查是否在启动页
    if (document.querySelector('.splash-container')) {
        window.splashManager = new SplashScreenManager();
        
        // 开发模式下的调试信息
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('启动页已初始化');
            console.log('设备信息:', SplashUtils.getDeviceInfo());
            console.log('访问统计:', window.splashManager.getStats());
        }
    }
});

// 导出到全局作用域（如果需要）
if (typeof window !== 'undefined') {
    window.SplashScreenManager = SplashScreenManager;
    window.SplashUtils = SplashUtils;
}