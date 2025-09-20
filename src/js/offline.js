// 离线功能支持
class OfflineManager {
    constructor() {
        this.isOnline = navigator.onLine;
        this.cache = new Map();
        this.syncQueue = [];
        // 延迟初始化，避免在DOM未准备好时执行
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            // 使用setTimeout确保在当前执行栈完成后再初始化
            setTimeout(() => this.init(), 0);
        }
    }

    init() {
        // 监听网络状态变化
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.showNetworkStatus('已连接到网络', 'success');
            this.syncOfflineData();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.showNetworkStatus('网络连接已断开，正在离线模式下运行', 'warning');
        });

        // 初始化Service Worker
        this.initServiceWorker();
        
        // 初始化本地存储
        this.initLocalStorage();
        
        // 显示当前网络状态
        this.showNetworkStatus(
            this.isOnline ? '网络连接正常' : '当前处于离线模式',
            this.isOnline ? 'success' : 'warning'
        );
    }

    // 初始化Service Worker
    async initServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker注册成功:', registration);
            } catch (error) {
                console.error('Service Worker注册失败:', error);
            }
        }
    }

    // 初始化本地存储
    initLocalStorage() {
        // 检查localStorage可用性
        try {
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
        } catch (error) {
            console.warn('localStorage不可用，使用内存缓存');
        }
    }

    // 显示网络状态
    showNetworkStatus(message, type = 'info') {
        // 确保DOM已加载且body存在
        if (!document.body) {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    setTimeout(() => this.showNetworkStatus(message, type), 0);
                });
            } else {
                // DOM已加载但body不存在，延迟重试
                setTimeout(() => {
                    this.showNetworkStatus(message, type);
                }, 100);
            }
            return;
        }

        try {
            const statusBar = document.createElement('div');
            statusBar.className = `network-status ${type}`;
            statusBar.textContent = message;
            
            // 添加样式
            statusBar.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: ${type === 'error' ? '#ff4444' : '#44aa44'};
                color: white;
                text-align: center;
                padding: 10px;
                z-index: 9999;
                font-size: 14px;
                transition: transform 0.3s ease;
            `;
            
            // 移除现有的状态栏
            const existingStatus = document.querySelector('.network-status');
            if (existingStatus) {
                existingStatus.remove();
            }
            
            // 确保body存在后再插入状态栏
            if (document.body && document.body.firstChild) {
                document.body.insertBefore(statusBar, document.body.firstChild);
            } else if (document.body) {
                // 如果body存在但没有子元素，直接添加
                document.body.appendChild(statusBar);
            } else {
                // 如果body仍然不存在，延迟重试
                setTimeout(() => this.showNetworkStatus(message, type), 100);
                return;
            }
            
            // 3秒后自动隐藏
            setTimeout(() => {
                if (statusBar && statusBar.parentNode) {
                    statusBar.style.transform = 'translateY(-100%)';
                    setTimeout(() => {
                        if (statusBar && statusBar.parentNode) {
                            statusBar.remove();
                        }
                    }, 300);
                }
            }, 3000);
            
        } catch (error) {
            console.error('OfflineManager显示网络状态失败:', error);
            // 降级方案：使用toast显示
            if (window.QuittrUtils && window.QuittrUtils.toast) {
                window.QuittrUtils.toast.show(message, type);
            }
        }
    }

    // 缓存数据
    cacheData(key, data, expiry = 24 * 60 * 60 * 1000) { // 默认24小时过期
        const cacheItem = {
            data: data,
            timestamp: Date.now(),
            expiry: expiry
        };

        try {
            localStorage.setItem(`cache_${key}`, JSON.stringify(cacheItem));
        } catch (error) {
            // localStorage满了，使用内存缓存
            this.cache.set(key, cacheItem);
        }
    }

    // 获取缓存数据
    getCachedData(key) {
        let cacheItem = null;

        try {
            const stored = localStorage.getItem(`cache_${key}`);
            if (stored) {
                cacheItem = JSON.parse(stored);
            }
        } catch (error) {
            // 从内存缓存获取
            cacheItem = this.cache.get(key);
        }

        if (!cacheItem) return null;

        // 检查是否过期
        if (Date.now() - cacheItem.timestamp > cacheItem.expiry) {
            this.removeCachedData(key);
            return null;
        }

        return cacheItem.data;
    }

    // 删除缓存数据
    removeCachedData(key) {
        try {
            localStorage.removeItem(`cache_${key}`);
        } catch (error) {
            this.cache.delete(key);
        }
    }

    // 添加到同步队列
    addToSyncQueue(action, data) {
        const syncItem = {
            id: Date.now() + Math.random(),
            action: action,
            data: data,
            timestamp: Date.now()
        };

        this.syncQueue.push(syncItem);
        this.saveSyncQueue();
    }

    // 保存同步队列到本地存储
    saveSyncQueue() {
        try {
            localStorage.setItem('syncQueue', JSON.stringify(this.syncQueue));
        } catch (error) {
            console.warn('无法保存同步队列到localStorage');
        }
    }

    // 从本地存储加载同步队列
    loadSyncQueue() {
        try {
            const stored = localStorage.getItem('syncQueue');
            if (stored) {
                this.syncQueue = JSON.parse(stored);
            }
        } catch (error) {
            console.warn('无法从localStorage加载同步队列');
            this.syncQueue = [];
        }
    }

    // 同步离线数据
    async syncOfflineData() {
        if (!this.isOnline || this.syncQueue.length === 0) return;

        this.showNetworkStatus('正在同步离线数据...', 'info');

        const failedItems = [];

        for (const item of this.syncQueue) {
            try {
                await this.processSyncItem(item);
            } catch (error) {
                console.error('同步失败:', item, error);
                failedItems.push(item);
            }
        }

        // 更新同步队列，保留失败的项目
        this.syncQueue = failedItems;
        this.saveSyncQueue();

        if (failedItems.length === 0) {
            this.showNetworkStatus('离线数据同步完成', 'success');
        } else {
            this.showNetworkStatus(`${failedItems.length}项数据同步失败`, 'warning');
        }
    }

    // 处理单个同步项目
    async processSyncItem(item) {
        switch (item.action) {
            case 'post_comment':
                return await this.syncComment(item.data);
            case 'like_post':
                return await this.syncLike(item.data);
            case 'save_progress':
                return await this.syncProgress(item.data);
            default:
                throw new Error(`未知的同步动作: ${item.action}`);
        }
    }

    // 同步评论
    async syncComment(data) {
        // 模拟API调用
        const response = await fetch('/api/comments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('评论同步失败');
        }

        return response.json();
    }

    // 同步点赞
    async syncLike(data) {
        // 模拟API调用
        const response = await fetch('/api/likes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('点赞同步失败');
        }

        return response.json();
    }

    // 同步学习进度
    async syncProgress(data) {
        // 模拟API调用
        const response = await fetch('/api/progress', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('学习进度同步失败');
        }

        return response.json();
    }

    // 离线模式下的操作处理
    handleOfflineAction(action, data) {
        if (this.isOnline) {
            // 在线模式，直接执行
            return this.executeOnlineAction(action, data);
        } else {
            // 离线模式，添加到队列
            this.addToSyncQueue(action, data);
            this.showNetworkStatus('操作已保存，将在网络恢复后同步', 'info');
            return Promise.resolve({ offline: true });
        }
    }

    // 在线模式下执行操作
    async executeOnlineAction(action, data) {
        try {
            switch (action) {
                case 'post_comment':
                    return await this.syncComment(data);
                case 'like_post':
                    return await this.syncLike(data);
                case 'save_progress':
                    return await this.syncProgress(data);
                default:
                    throw new Error(`未知的操作: ${action}`);
            }
        } catch (error) {
            // 如果在线操作失败，添加到离线队列
            this.addToSyncQueue(action, data);
            throw error;
        }
    }

    // 清理过期缓存
    cleanExpiredCache() {
        const keys = [];
        
        // 获取所有localStorage中的缓存键
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('cache_')) {
                keys.push(key);
            }
        }

        // 检查并删除过期缓存
        keys.forEach(key => {
            try {
                const stored = localStorage.getItem(key);
                if (stored) {
                    const cacheItem = JSON.parse(stored);
                    if (Date.now() - cacheItem.timestamp > cacheItem.expiry) {
                        localStorage.removeItem(key);
                    }
                }
            } catch (error) {
                // 删除损坏的缓存项
                localStorage.removeItem(key);
            }
        });

        // 清理内存缓存
        for (const [key, cacheItem] of this.cache.entries()) {
            if (Date.now() - cacheItem.timestamp > cacheItem.expiry) {
                this.cache.delete(key);
            }
        }
    }

    // 获取缓存统计信息
    getCacheStats() {
        let localStorageCount = 0;
        let localStorageSize = 0;

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('cache_')) {
                localStorageCount++;
                localStorageSize += localStorage.getItem(key).length;
            }
        }

        return {
            localStorage: {
                count: localStorageCount,
                size: localStorageSize
            },
            memory: {
                count: this.cache.size,
                size: JSON.stringify([...this.cache.entries()]).length
            },
            syncQueue: this.syncQueue.length,
            isOnline: this.isOnline
        };
    }
}

// 延迟创建OfflineManager实例，确保DOM加载完成
let offlineManager = null;

// 导出供其他模块使用
window.OfflineManager = OfflineManager;

// 获取offlineManager实例的安全方法
function getOfflineManager() {
    // 确保DOM和body都存在
    if (!offlineManager && document.body && document.readyState !== 'loading') {
        try {
            offlineManager = new OfflineManager();
        } catch (error) {
            console.warn('OfflineManager创建失败，稍后重试:', error);
            return null;
        }
    }
    return offlineManager;
}

// 安全的初始化函数
function initOfflineManager() {
    // 确保DOM完全加载且body存在
    if (document.readyState === 'loading' || !document.body) {
        return;
    }
    
    if (!offlineManager) {
        try {
            offlineManager = new OfflineManager();
            window.offlineManager = offlineManager;
            
            // 加载同步队列
            offlineManager.loadSyncQueue();
            
            // 定期清理过期缓存（每小时）
            setInterval(() => {
                offlineManager.cleanExpiredCache();
            }, 60 * 60 * 1000);
            
            // 如果有待同步数据且当前在线，尝试同步
            if (offlineManager.isOnline && offlineManager.syncQueue.length > 0) {
                setTimeout(() => {
                    offlineManager.syncOfflineData();
                }, 2000); // 延迟2秒执行，确保页面完全加载
            }
        } catch (error) {
            console.warn('OfflineManager初始化失败，稍后重试:', error);
        }
    }
}

// 初始化逻辑
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initOfflineManager);
    } else if (document.body) {
        // DOM已加载且body存在，立即初始化
        setTimeout(initOfflineManager, 0);
    } else {
        // DOM已加载但body不存在，等待body
        const observer = new MutationObserver((mutations) => {
            if (document.body) {
                observer.disconnect();
                initOfflineManager();
            }
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });
    }
}