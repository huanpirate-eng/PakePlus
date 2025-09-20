// QUITTR 应用通用工具函数

// ==================== 错误处理和用户反馈 ====================

/**
 * 统一的Toast提示系统
 */
class ToastManager {
    constructor() {
        this.container = null;
        // 延迟初始化，避免在DOM未准备好时执行
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            // 使用setTimeout确保在当前执行栈完成后再初始化
            setTimeout(() => this.init(), 0);
        }
    }

    init() {
        // 确保DOM已加载且body存在
        if (!document.body) {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    setTimeout(() => this.init(), 0);
                });
            } else {
                // DOM已加载但body不存在，延迟重试
                setTimeout(() => {
                    this.init();
                }, 100);
            }
            return;
        }

        // 避免重复创建容器
        if (this.container && document.getElementById('toast-container')) {
            return;
        }

        try {
            // 创建容器
            this.container = document.createElement('div');
            this.container.id = 'toast-container';
            this.container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                pointer-events: none;
            `;
            // 为屏幕阅读器提供区域和播报配置
            this.container.setAttribute('role', 'region');
            this.container.setAttribute('aria-live', 'polite');
            this.container.setAttribute('aria-atomic', 'true');
            // 修复：将容器添加到body，而不是错误地添加到自身
            if (document.body) {
                document.body.appendChild(this.container);
            }
            this.addStyles();
        } catch (error) {
            console.error('ToastManager初始化失败:', error);
            // 延迟重试
            setTimeout(() => this.init(), 200);
        }
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .toast {
                background: rgba(0, 0, 0, 0.85);
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                margin-bottom: 10px;
                font-size: 14px;
                max-width: 300px;
                word-wrap: break-word;
                pointer-events: auto;
                transform: translateX(100%);
                opacity: 0;
                transition: all 0.3s ease;
                position: relative;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            }

            .toast.show {
                transform: translateX(0);
                opacity: 1;
            }

            .toast.success {
                background: var(--success-color, #4CAF50);
            }

            .toast.error {
                background: var(--danger-color, #F44336);
            }

            .toast.warning {
                background: var(--warning-color, #FFC107);
                color: #333;
            }

            .toast.info {
                background: var(--info-color, #2196F3);
            }

            .toast .close-btn {
                position: absolute;
                top: 5px;
                right: 8px;
                background: none;
                border: none;
                color: inherit;
                cursor: pointer;
                font-size: 16px;
                opacity: 0.7;
            }

            .toast .close-btn:hover {
                opacity: 1;
            }

            @media (max-width: 480px) {
                #toast-container {
                    top: 10px;
                    right: 10px;
                    left: 10px;
                }
                
                .toast {
                    max-width: none;
                }
            }
        `;
        document.head.appendChild(style);
    }

    show(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        // ARIA无障碍：根据类型选择播报优先级
        toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
        toast.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
        toast.setAttribute('aria-atomic', 'true');
        toast.innerHTML = `
            ${message}
            <button class="close-btn" onclick="this.parentElement.remove()">&times;</button>
        `;

        this.container.appendChild(toast);

        // 触发显示动画
        setTimeout(() => toast.classList.add('show'), 10);

        // 自动移除
        if (duration > 0) {
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, duration);
        }

        return toast;
    }

    success(message, duration = 3000) {
        return this.show(message, 'success', duration);
    }

    error(message, duration = 5000) {
        return this.show(message, 'error', duration);
    }

    warning(message, duration = 4000) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration = 3000) {
        return this.show(message, 'info', duration);
    }
}

// 延迟创建ToastManager实例，确保DOM加载完成
let toast = null;

// 获取toast实例的安全方法
function getToast() {
    // 确保DOM和body都存在
    if (!toast && document.body && document.readyState !== 'loading') {
        try {
            toast = new ToastManager();
        } catch (error) {
            console.warn('ToastManager创建失败，稍后重试:', error);
            return null;
        }
    }
    return toast;
}

// 安全的初始化函数
function initToast() {
    // 确保DOM完全加载且body存在
    if (document.readyState === 'loading' || !document.body) {
        return;
    }
    
    if (!toast) {
        try {
            toast = new ToastManager();
        } catch (error) {
            console.warn('ToastManager初始化失败，稍后重试:', error);
        }
    }
}

// 初始化逻辑
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initToast);
    } else if (document.body) {
        // DOM已加载且body存在，立即初始化
        setTimeout(initToast, 0);
    } else {
        // DOM已加载但body不存在，等待body
        const observer = new MutationObserver((mutations) => {
            if (document.body) {
                observer.disconnect();
                initToast();
            }
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });
    }
}

/**
 * 统一的错误处理函数
 */
function handleError(error, context = '') {
    console.error(`[${context}] Error:`, error);
    
    let message = '操作失败，请稍后重试';
    
    if (error.message) {
        if (error.message.includes('network') || error.message.includes('fetch')) {
            message = '网络连接异常，请检查网络设置';
        } else if (error.message.includes('storage')) {
            message = '存储空间不足，请清理设备存储';
        } else if (error.message.includes('permission')) {
            message = '权限不足，请检查应用权限设置';
        }
    }
    
    toast.error(message);
}

/**
 * 安全的异步操作包装器
 */
async function safeAsync(asyncFn, context = '', fallback = null) {
    try {
        return await asyncFn();
    } catch (error) {
        handleError(error, context);
        return fallback;
    }
}

// ==================== 数据验证 ====================

/**
 * 数据验证工具
 */
const Validator = {
    // 邮箱验证
    email(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    },

    // 手机号验证（中国大陆）
    phone(phone) {
        const regex = /^1[3-9]\d{9}$/;
        return regex.test(phone);
    },

    // 用户名验证
    username(username) {
        if (!username || username.length < 2 || username.length > 20) {
            return false;
        }
        // 允许中文、英文、数字、下划线
        const regex = /^[\u4e00-\u9fa5a-zA-Z0-9_]+$/;
        return regex.test(username);
    },

    // 密码强度验证
    password(password) {
        if (!password || password.length < 6) {
            return { valid: false, message: '密码长度至少6位' };
        }
        if (password.length > 20) {
            return { valid: false, message: '密码长度不能超过20位' };
        }
        return { valid: true, message: '密码格式正确' };
    },

    // HTML内容安全验证
    sanitizeHtml(html) {
        const div = document.createElement('div');
        div.textContent = html;
        return div.innerHTML;
    },

    // 通用非空验证
    required(value, fieldName = '字段') {
        if (!value || (typeof value === 'string' && !value.trim())) {
            throw new Error(`${fieldName}不能为空`);
        }
        return true;
    }
};

// ==================== 本地存储管理 ====================

/**
 * 安全的本地存储管理器
 */
class StorageManager {
    constructor() {
        this.isAvailable = this.checkAvailability();
    }

    checkAvailability() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    set(key, value) {
        if (!this.isAvailable) {
            console.warn('LocalStorage not available');
            return false;
        }

        try {
            const data = {
                value: value,
                timestamp: Date.now(),
                version: '1.0'
            };
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            handleError(error, 'StorageManager.set');
            return false;
        }
    }

    get(key, defaultValue = null) {
        if (!this.isAvailable) {
            return defaultValue;
        }

        try {
            const item = localStorage.getItem(key);
            if (!item) return defaultValue;

            const data = JSON.parse(item);
            return data.value !== undefined ? data.value : defaultValue;
        } catch (error) {
            handleError(error, 'StorageManager.get');
            return defaultValue;
        }
    }

    remove(key) {
        if (!this.isAvailable) return false;

        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            handleError(error, 'StorageManager.remove');
            return false;
        }
    }

    clear() {
        if (!this.isAvailable) return false;

        try {
            localStorage.clear();
            return true;
        } catch (error) {
            handleError(error, 'StorageManager.clear');
            return false;
        }
    }

    // 获取存储使用情况
    getUsage() {
        if (!this.isAvailable) return { used: 0, available: 0 };

        let used = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                used += localStorage[key].length + key.length;
            }
        }

        return {
            used: used,
            available: 5 * 1024 * 1024 - used, // 假设5MB限制
            percentage: (used / (5 * 1024 * 1024)) * 100
        };
    }
}

// 全局存储管理器实例
const storage = new StorageManager();

// ==================== 网络状态监测 ====================

/**
 * 网络状态管理器
 */
class NetworkManager {
    constructor() {
        this.isOnline = navigator.onLine;
        this.callbacks = [];
        this.init();
    }

    init() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.notifyCallbacks('online');
            toast.success('网络连接已恢复');
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.notifyCallbacks('offline');
            toast.warning('网络连接已断开，部分功能可能受限');
        });
    }

    onStatusChange(callback) {
        this.callbacks.push(callback);
    }

    notifyCallbacks(status) {
        this.callbacks.forEach(callback => {
            try {
                callback(status, this.isOnline);
            } catch (error) {
                console.error('Network callback error:', error);
            }
        });
    }

    // 检查网络连接质量
    async checkConnection() {
        if (!this.isOnline) return false;

        try {
            const start = Date.now();
            await fetch('/favicon.ico', { 
                method: 'HEAD',
                cache: 'no-cache'
            });
            const duration = Date.now() - start;
            
            return {
                connected: true,
                speed: duration < 1000 ? 'fast' : duration < 3000 ? 'medium' : 'slow',
                latency: duration
            };
        } catch (error) {
            return { connected: false, speed: 'none', latency: -1 };
        }
    }
}

// 全局网络管理器实例
const network = new NetworkManager();

// ==================== 工具函数 ====================

/**
 * 防抖函数
 */
function debounce(func, wait, immediate = false) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            if (!immediate) func(...args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func(...args);
    };
}

/**
 * 节流函数
 */
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * 格式化日期
 */
function formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');

    return format
        .replace('YYYY', year)
        .replace('MM', month)
        .replace('DD', day)
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', seconds);
}

/**
 * 相对时间格式化
 */
function formatRelativeTime(date) {
    const now = new Date();
    const diff = now - new Date(date);
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return formatDate(date, 'MM-DD');
}

/**
 * 生成唯一ID
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * 深拷贝对象
 */
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj);
    if (obj instanceof Array) return obj.map(item => deepClone(item));
    if (typeof obj === 'object') {
        const clonedObj = {};
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                clonedObj[key] = deepClone(obj[key]);
            }
        }
        return clonedObj;
    }
}

// ==================== 导出全局对象 ====================

// 导出全局对象，使用getter确保toast实例存在
window.QuittrUtils = {
    get toast() { 
        // 确保DOM和body都存在
        if (!toast && document.body && document.readyState !== 'loading') {
            try {
                toast = new ToastManager();
            } catch (error) {
                console.warn('ToastManager创建失败，稍后重试:', error);
                return null;
            }
        }
        return toast; 
    },
    handleError,
    safeAsync,
    Validator,
    storage,
    network,
    debounce,
    throttle,
    formatDate,
    formatRelativeTime,
    generateId,
    deepClone
};

// 向后兼容的全局函数
window.showToast = (message, type = 'info') => {
  try {
    const t = (typeof getToast === 'function' ? getToast() : null) || toast;
    if (t && typeof t.show === 'function') return t.show(message, type);
  } catch (e) { /* ignore */ }
  try { console.info(`[Toast:${type}]`, message); } catch (e) {}
};
window.handleError = handleError;
window.safeAsync = safeAsync;

// 全局可访问性与细节优化增强，不影响现有逻辑
(function enhanceUXAndAccessibility() {
  if (window.__a11yEnhancementsInitialized) return;
  window.__a11yEnhancementsInitialized = true;

  function ensureHead() {
    return document.head || document.getElementsByTagName('head')[0];
  }

  function ensurePreconnect(url) {
    try {
      const head = ensureHead();
      if (!head) return;
      const exists = !!head.querySelector(`link[rel="preconnect"][href="${url}"]`);
      if (!exists) {
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = url;
        link.crossOrigin = '';
        head.appendChild(link);
      }
      const dnsPrefetchExists = !!head.querySelector(`link[rel="dns-prefetch"][href="${url}"]`);
      if (!dnsPrefetchExists) {
        const link2 = document.createElement('link');
        link2.rel = 'dns-prefetch';
        link2.href = url;
        head.appendChild(link2);
      }
    } catch (e) {
      // 静默失败，不影响功能
    }
  }

  function injectStyle(css, id) {
    try {
      const head = ensureHead();
      if (!head) return;
      if (id && document.getElementById(id)) return;
      const style = document.createElement('style');
      if (id) style.id = id;
      style.type = 'text/css';
      style.appendChild(document.createTextNode(css));
      head.appendChild(style);
    } catch (e) {
      // 静默失败
    }
  }

  function setupSkipLink() {
    try {
      if (document.querySelector('.skip-link')) return;
      const skip = document.createElement('a');
      skip.className = 'skip-link';
      skip.href = '#main-content';
      skip.textContent = '跳到主要内容';
      // 优先插入到body开头
      if (document.body.firstChild) {
        document.body.insertBefore(skip, document.body.firstChild);
      } else {
        document.body.appendChild(skip);
      }

      // 找到主要内容容器，若不存在则设置第一个主要容器
      const mainCandidates = [
        document.querySelector('[role="main"]'),
        document.getElementById('main-content'),
        document.querySelector('main'),
        document.querySelector('#app'),
        document.querySelector('.container'),
        document.body.children[1] || document.body.firstElementChild
      ].filter(Boolean);

      const mainEl = mainCandidates[0];
      if (mainEl) {
        if (!mainEl.id) mainEl.id = 'main-content';
        mainEl.setAttribute('role', mainEl.getAttribute('role') || 'main');
        // 允许通过跳转后聚焦
        if (!mainEl.hasAttribute('tabindex')) mainEl.setAttribute('tabindex', '-1');
      }

      injectStyle(`
        .skip-link {
          position: absolute;
          left: -9999px;
          top: auto;
          width: 1px;
          height: 1px;
          overflow: hidden;
        }
        .skip-link:focus {
          position: fixed;
          left: 16px;
          top: 16px;
          width: auto;
          height: auto;
          padding: 8px 12px;
          background: #111;
          color: #fff;
          z-index: 10000;
          border-radius: 6px;
          outline: 2px solid #fff;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
      `, 'a11y-skip-style');
    } catch (e) {
      // 忽略
    }
  }

  function setupFocusVisible() {
    // 键盘导航时显示更明确的焦点样式
    function onFirstTab(e) {
      if (e.key === 'Tab') {
        document.body.classList.add('user-is-tabbing');
        window.removeEventListener('keydown', onFirstTab);
        window.addEventListener('mousedown', onMouseDownOnce);
      }
    }
    function onMouseDownOnce() {
      document.body.classList.remove('user-is-tabbing');
      window.removeEventListener('mousedown', onMouseDownOnce);
      window.addEventListener('keydown', onFirstTab);
    }
    window.addEventListener('keydown', onFirstTab);

    injectStyle(`
      body.user-is-tabbing :focus-visible,
      body.user-is-tabbing a:focus,
      body.user-is-tabbing button:focus,
      body.user-is-tabbing input:focus,
      body.user-is-tabbing select:focus,
      body.user-is-tabbing textarea:focus {
        outline: 3px solid var(--focus-color, #3B82F6);
        outline-offset: 2px;
        border-radius: 4px;
      }
      /* 保留默认：用鼠标时避免过于突兀 */
    `, 'a11y-focus-visible-style');
  }

  function setupReducedMotion() {
    // 遵循用户减少动态效果的系统偏好
    injectStyle(`
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
          animation-duration: 0.001ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.001ms !important;
          scroll-behavior: auto !important;
        }
      }
    `, 'reduced-motion-style');
  }

  function setupLazyLoadingAttribute() {
    try {
      const imgs = document.querySelectorAll('img:not([loading])');
      imgs.forEach(img => {
        // 若已有IntersectionObserver懒加载(data-src)，则跳过
        if (!img.hasAttribute('data-src')) {
          img.setAttribute('loading', 'lazy');
        }
        if (!img.hasAttribute('decoding')) {
          img.setAttribute('decoding', 'async');
        }
      });
    } catch (e) {
      // 忽略
    }
  }

  function setupPreconnects() {
    ensurePreconnect('https://cdnjs.cloudflare.com');
    ensurePreconnect('https://cdn.jsdelivr.net');
    // 如后续接入其他CDN，可在此补充
  }

  function init() {
    setupPreconnects();
    setupSkipLink();
    setupFocusVisible();
    setupReducedMotion();
    setupLazyLoadingAttribute();
    setupLinkPrefetch();
    setupSafeExternalLinks();
    setupAriaCurrentForNav();
    setupFormA11yHints();
    setupRoleButtonKeyboard();
     setupIframeLazyLoading();
     setupHashFocus();
     setupPreventDoubleSubmit();
   }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

/* DEBUG_BISECT COMMENT END */
// 智能链接预取：悬停/触摸触发 + 空闲时间批量预取
function setupLinkPrefetch() {
  try {
    const nav = window.navigator;
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
    const saveData = connection && connection.saveData;
    const slow = connection && /(2g)/i.test(connection.effectiveType || '');
    if (saveData || slow) return; // 省流或慢网不预取

    const isSameOrigin = (url) => {
      try { const u = new URL(url, location.href); return u.origin === location.origin; } catch { return false; }
    };

    const prefetched = new Set();
    function prefetch(url) {
      if (!url || prefetched.has(url) || !isSameOrigin(url)) return;
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      link.as = 'document';
      link.crossOrigin = 'anonymous';
      prefetched.add(url);
      const head = document.head || document.getElementsByTagName('head')[0];
      head && head.appendChild(link);
    }

    function onHover(e) {
      const a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      if (!a) return;
      if (a.target && a.target !== '_self') return;
      if (a.hasAttribute('download')) return;
      prefetch(a.href);
    }

    document.addEventListener('mouseover', onHover, { passive: true });
    document.addEventListener('touchstart', onHover, { passive: true });

    const links = Array.from(document.querySelectorAll('a[href]')).slice(0, 10);
    const idle = window.requestIdleCallback || function(cb){ return setTimeout(() => cb({ timeRemaining: () => 0 }), 1200); };
    idle(() => {
      links.forEach(a => prefetch(a.href));
    });
  } catch (e) {
    // 静默失败不影响功能
  }
}

// 安全外链：自动为 target=_blank 的链接加上 rel="noopener noreferrer"
function setupSafeExternalLinks() {
  try {
    const anchors = document.querySelectorAll('a[target="_blank"]');
    anchors.forEach(a => {
      const rel = a.getAttribute('rel') || '';
      const tokens = new Set(rel.split(/\s+/).filter(Boolean));
      if (!tokens.has('noopener')) tokens.add('noopener');
      if (!tokens.has('noreferrer')) tokens.add('noreferrer');
      a.setAttribute('rel', Array.from(tokens).join(' '));
    });
  } catch (e) {
    // 忽略
  }
}

// 为导航/菜单中指向当前页面的链接添加 aria-current="page"
function setupAriaCurrentForNav() {
  try {
    const anchors = document.querySelectorAll('a[href]');
    const current = new URL(location.href);
    anchors.forEach(a => {
      try {
        const u = new URL(a.getAttribute('href'), location.href);
        const same = (u.origin === current.origin) && (u.pathname.replace(/\/+$/, '') === current.pathname.replace(/\/+$/, ''));
        if (same) {
          a.setAttribute('aria-current', 'page');
          a.classList.add('is-active');
        }
      } catch (e) { /* ignore single anchor */ }
    });
  } catch (e) { /* ignore */ }
}

// 表单可访问性：同步 required -> aria-required，并在校验失败时标注 aria-invalid
function setupFormA11yHints() {
  try {
    const fields = document.querySelectorAll('input, select, textarea');
    fields.forEach(el => {
      if (el.required && !el.hasAttribute('aria-required')) {
        el.setAttribute('aria-required', 'true');
      }
    });

    // 原生校验失败提示，捕获于捕获阶段
    document.addEventListener('invalid', function(e) {
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;
      target.setAttribute('aria-invalid', 'true');
      let labelText = '';
      try {
        if (target.id) {
          const label = document.querySelector(`label[for="${CSS.escape(target.id)}"]`);
          if (label) labelText = label.innerText.trim();
        }
        if (!labelText) labelText = target.getAttribute('aria-label') || target.placeholder || target.name || '该字段';
      } catch (_) { labelText = target.placeholder || target.name || '该字段'; }
      const msg = target.validationMessage || `${labelText} 未通过校验`;
      if (typeof window.showToast === 'function') {
        window.showToast(msg, 'warning');
      }
    }, true);

    // 一旦输入有效，移除 aria-invalid
    document.addEventListener('input', function(e) {
      const t = e.target;
      if (t && t instanceof HTMLElement && 'checkValidity' in t && t.checkValidity()) {
        t.setAttribute('aria-invalid', 'false');
      }
    }, true);
    document.addEventListener('change', function(e) {
      const t = e.target;
      if (t && t instanceof HTMLElement && 'checkValidity' in t && t.checkValidity()) {
        t.setAttribute('aria-invalid', 'false');
      }
    }, true);
  } catch (e) { /* ignore */ }
}

// 为带有 role=button 的元素添加键盘可访问性支持（Enter/Space）
function setupRoleButtonKeyboard() {
  try {
    const activate = (el) => {
      if (!el) return;
      el.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          el.click();
        }
      });
      if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
      if (!el.hasAttribute('role')) el.setAttribute('role', 'button');
    };
    document.querySelectorAll('[role="button"]').forEach(activate);
    // 动态元素：用捕获的方式代理
    document.addEventListener('keydown', (ev) => {
      const el = ev.target && ev.target.closest ? ev.target.closest('[role="button"]') : null;
      if (!el) return;
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        el.click();
      }
    }, true);
  } catch (e) { /* ignore */ }
}

// 对话框可访问性增强：聚焦、焦点陷阱、ARIA属性与返回焦点
function setupDialogA11y() {
  if (!('HTMLDialogElement' in window)) return;
  try {
    const proto = HTMLDialogElement.prototype;
    const origShow = proto.show;
    const origShowModal = proto.showModal;
    const origClose = proto.close;
    let activeDialog = null;
    let lastFocused = null;

    const getFocusable = (root) => Array.from(root.querySelectorAll(
      'a[href], area[href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, audio[controls], video[controls], [tabindex]:not([tabindex="-1"])'
    )).filter(el => el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement);

    const focusTrapHandler = (e) => {
      if (!activeDialog) return;
      if (e.key !== 'Tab') return;
      const nodes = getFocusable(activeDialog);
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const goingBackward = e.shiftKey;
      if (goingBackward && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!goingBackward && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    const onOpen = (dialog) => {
      activeDialog = dialog;
      lastFocused = document.activeElement;
      if (!dialog.hasAttribute('role')) dialog.setAttribute('role', 'dialog');
      dialog.setAttribute('aria-modal', 'true');
      // 若未命名，则尝试使用标题
      if (!dialog.getAttribute('aria-label') && !dialog.getAttribute('aria-labelledby')) {
        const h = dialog.querySelector('h1,h2,h3,h4,h5,h6');
        if (h && h.textContent.trim()) dialog.setAttribute('aria-label', h.textContent.trim());
      }
      const nodes = getFocusable(dialog);
      const target = nodes.find(n => n.hasAttribute('autofocus')) || nodes[0] || dialog;
      if (target) target.focus();
      document.addEventListener('keydown', focusTrapHandler, true);
    };

    const onClose = (dialog) => {
      document.removeEventListener('keydown', focusTrapHandler, true);
      activeDialog = null;
      if (lastFocused && typeof lastFocused.focus === 'function') {
        try { lastFocused.focus(); } catch (_) {}
      }
    };

    proto.show = function() {
      const result = origShow.apply(this, arguments);
      onOpen(this);
      return result;
    };
    proto.showModal = function() {
      const result = origShowModal.apply(this, arguments);
      onOpen(this);
      return result;
    };
    proto.close = function() {
      const result = origClose.apply(this, arguments);
      onClose(this);
      return result;
    };

    // 监听Esc（dialog会触发cancel事件）
    document.addEventListener('cancel', (e) => {
      const dlg = e.target;
      if (dlg instanceof HTMLDialogElement) onClose(dlg);
    }, true);
    document.addEventListener('close', (e) => {
      const dlg = e.target;
      if (dlg instanceof HTMLDialogElement) onClose(dlg);
    }, true);
  } catch (_) {}
}

// 为无title的iframe提供可读标题
function setupIframeTitleFallback() {
  try {
    document.querySelectorAll('iframe:not([title])').forEach((f) => {
      const src = f.getAttribute('src') || '';
      const host = (() => { try { return new URL(src, location.href).hostname; } catch { return ''; } })();
      const label = host ? `来自 ${host} 的内嵌内容` : '内嵌内容';
      f.setAttribute('title', label);
    });
  } catch (e) {}
}

// 图片加载失败的无障碍与兼容处理
function setupImageErrorFallback() {
  try {
    const handler = (img) => {
      if (!img) return;
      img.addEventListener('error', () => {
        const alt = img.getAttribute('alt');
        if (!alt) img.setAttribute('alt', '图片加载失败');
        img.classList.add('img-error');
      }, { once: true });
    };
    document.querySelectorAll('img').forEach(handler);
    const mo = new MutationObserver((mutList) => {
      for (const m of mutList) {
        m.addedNodes && m.addedNodes.forEach(node => {
          if (node && node.nodeType === 1) {
            if (node.tagName === 'IMG') handler(node);
            node.querySelectorAll && node.querySelectorAll('img').forEach(handler);
          }
        });
      }
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
  } catch (e) {}
}

// 移动端键盘优化：为常见类型与name推断inputmode
function setupInputModeHints() {
  try {
    const apply = (el) => {
      if (!(el instanceof HTMLInputElement)) return;
      const type = (el.getAttribute('type') || '').toLowerCase();
      const name = (el.getAttribute('name') || '').toLowerCase();
      if (!el.hasAttribute('inputmode')) {
        if (type === 'email' || /email/.test(name)) el.setAttribute('inputmode', 'email');
        else if (type === 'tel' || /phone|tel/.test(name)) el.setAttribute('inputmode', 'tel');
        else if (type === 'number' || /code|otp|pin|amount|count/.test(name)) el.setAttribute('inputmode', 'numeric');
      }
      if (type === 'number' && !el.getAttribute('pattern')) {
        el.setAttribute('pattern', '[0-9]*');
      }
      if (type === 'search' && !el.hasAttribute('enterkeyhint')) {
        el.setAttribute('enterkeyhint', 'search');
      }
    };
    document.querySelectorAll('input').forEach(apply);
  } catch (e) {}
}

// 为所有iframe默认开启懒加载
function setupIframeLazyLoading() {
  try {
    document.querySelectorAll('iframe:not([loading])').forEach((f) => {
      f.setAttribute('loading', 'lazy');
      // 对可能的无尺寸iframe，避免布局抖动（仅在未设置时给个最小高度）
      if (!f.hasAttribute('width') && !f.hasAttribute('height')) {
        f.style.minHeight = f.style.minHeight || '120px';
      }
    });
  } catch (e) { /* ignore */ }
}

// 锚点跳转后自动聚焦到目标元素，提升可达性
function setupHashFocus() {
  function focusTargetByHash(hash) {
    if (!hash) return;
    try {
      const id = hash.replace(/^#/, '');
      const el = document.getElementById(id) || document.querySelector(hash);
      if (el instanceof HTMLElement) {
        if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
        el.focus({ preventScroll: true });
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } catch (_) { /* ignore */ }
  }

  try {
    if (location.hash) {
      // 等待首屏渲染后再聚焦，避免滚动竞争
      setTimeout(() => focusTargetByHash(location.hash), 0);
    }
    window.addEventListener('hashchange', () => focusTargetByHash(location.hash), false);
  } catch (e) { /* ignore */ }
}

// 防止表单重复提交：提交后暂时禁用提交按钮并显示加载态
function setupPreventDoubleSubmit() {
  try {
    document.addEventListener('submit', (e) => {
      const form = e.target;
      if (!(form instanceof HTMLFormElement)) return;
      // 若表单原生校验不通过，不处理
      if (typeof form.checkValidity === 'function' && !form.checkValidity()) return;

      const submitters = form.querySelectorAll('button[type="submit"], input[type="submit"]');
      submitters.forEach((btn) => {
        const el = btn;
        if (el.disabled) return;
        const originalText = el.tagName === 'BUTTON' ? el.textContent : el.value;
        el.setAttribute('data-original-text', originalText || '');
        el.disabled = true;
        // 简单的加载态提示
        if (el.tagName === 'BUTTON') {
          el.textContent = '提交中...';
        } else if (el.tagName === 'INPUT') {
          el.value = '提交中...';
        }
      });

      // 提交完成后，通过事件恢复（需在业务提交成功/失败处触发自定义事件）
      const restore = () => {
        submitters.forEach((btn) => {
          const el = btn;
          const text = el.getAttribute('data-original-text') || '';
          el.disabled = false;
          if (el.tagName === 'BUTTON') el.textContent = text;
          else if (el.tagName === 'INPUT') el.value = text;
        });
      };

      form.addEventListener('quittr:submit:restore', restore, { once: true });

      // 兜底：6秒后自动恢复，避免异常阻塞
      setTimeout(() => {
        const evt = new Event('quittr:submit:restore');
        form.dispatchEvent(evt);
      }, 6000);
    }, true);
  } catch (e) { /* ignore */ }
}