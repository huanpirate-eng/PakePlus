// QUITTR 加载状态管理器

/**
 * 加载状态管理器
 */
class LoadingManager {
    constructor() {
        this.activeLoaders = new Set();
        this.init();
    }

    init() {
        this.addStyles();
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* 加载指示器样式 */
            .loading-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
            }

            .loading-overlay.show {
                opacity: 1;
                visibility: visible;
            }

            .loading-spinner {
                width: 40px;
                height: 40px;
                border: 3px solid rgba(255, 255, 255, 0.3);
                border-top: 3px solid var(--primary-color, #4CAF50);
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }

            .loading-content {
                background: white;
                padding: 30px;
                border-radius: 12px;
                text-align: center;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
                max-width: 200px;
            }

            .loading-text {
                margin-top: 15px;
                color: var(--text-primary, #333);
                font-size: 14px;
            }

            /* 内联加载器 */
            .inline-loader {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
            }

            .inline-loader.show {
                opacity: 1;
                visibility: visible;
            }

            .inline-spinner {
                width: 16px;
                height: 16px;
                border: 2px solid rgba(0, 0, 0, 0.1);
                border-top: 2px solid var(--primary-color, #4CAF50);
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }

            /* 骨架屏样式 */
            .skeleton {
                background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                background-size: 200% 100%;
                animation: loading 1.5s infinite;
                border-radius: 4px;
            }

            .skeleton-text {
                height: 16px;
                margin-bottom: 8px;
            }

            .skeleton-text.short {
                width: 60%;
            }

            .skeleton-text.medium {
                width: 80%;
            }

            .skeleton-text.long {
                width: 100%;
            }

            .skeleton-avatar {
                width: 40px;
                height: 40px;
                border-radius: 50%;
            }

            .skeleton-card {
                height: 120px;
                margin-bottom: 16px;
                border-radius: 8px;
            }

            /* 空状态样式 */
            .empty-state {
                text-align: center;
                padding: 60px 20px;
                color: var(--text-secondary, #666);
            }

            .empty-state-icon {
                font-size: 48px;
                color: var(--text-hint, #999);
                margin-bottom: 16px;
            }

            .empty-state-title {
                font-size: 18px;
                font-weight: 600;
                margin-bottom: 8px;
                color: var(--text-primary, #333);
            }

            .empty-state-description {
                font-size: 14px;
                line-height: 1.5;
                margin-bottom: 24px;
            }

            .empty-state-action {
                background: var(--primary-color, #4CAF50);
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 6px;
                font-size: 14px;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .empty-state-action:hover {
                background: var(--primary-dark, #388E3C);
                transform: translateY(-1px);
            }

            /* 动画 */
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            @keyframes loading {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
            }

            /* 深色模式适配 */
            .dark-mode .loading-content {
                background: var(--card-color, #1E1E1E);
            }

            .dark-mode .skeleton {
                background: linear-gradient(90deg, #2a2a2a 25%, #3a3a3a 50%, #2a2a2a 75%);
                background-size: 200% 100%;
            }

            /* 响应式设计 */
            @media (max-width: 480px) {
                .loading-content {
                    margin: 20px;
                    padding: 20px;
                }

                .empty-state {
                    padding: 40px 20px;
                }

                .empty-state-icon {
                    font-size: 36px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * 显示全屏加载
     */
    showFullscreen(text = '加载中...') {
        const loaderId = 'fullscreen-loader';
        
        if (document.getElementById(loaderId)) {
            return loaderId;
        }

        const overlay = document.createElement('div');
        overlay.id = loaderId;
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <div class="loading-text">${text}</div>
            </div>
        `;

        document.body.appendChild(overlay);
        
        // 触发显示动画
        setTimeout(() => overlay.classList.add('show'), 10);
        
        this.activeLoaders.add(loaderId);
        return loaderId;
    }

    /**
     * 显示内联加载器
     */
    showInline(container, text = '加载中...') {
        if (typeof container === 'string') {
            container = document.querySelector(container);
        }
        
        if (!container) return null;

        const loaderId = `inline-loader-${Date.now()}`;
        const loader = document.createElement('div');
        loader.id = loaderId;
        loader.className = 'inline-loader';
        loader.innerHTML = `
            <div class="inline-spinner"></div>
            <span>${text}</span>
        `;

        container.appendChild(loader);
        
        // 触发显示动画
        setTimeout(() => loader.classList.add('show'), 10);
        
        this.activeLoaders.add(loaderId);
        return loaderId;
    }

    /**
     * 显示骨架屏
     */
    showSkeleton(container, type = 'card', count = 3) {
        if (typeof container === 'string') {
            container = document.querySelector(container);
        }
        
        if (!container) return null;

        const loaderId = `skeleton-loader-${Date.now()}`;
        const skeletonContainer = document.createElement('div');
        skeletonContainer.id = loaderId;

        let skeletonHTML = '';
        
        for (let i = 0; i < count; i++) {
            switch (type) {
                case 'card':
                    skeletonHTML += '<div class="skeleton skeleton-card"></div>';
                    break;
                case 'text':
                    skeletonHTML += `
                        <div class="skeleton skeleton-text long"></div>
                        <div class="skeleton skeleton-text medium"></div>
                        <div class="skeleton skeleton-text short"></div>
                        <br>
                    `;
                    break;
                case 'list':
                    skeletonHTML += `
                        <div style="display: flex; align-items: center; margin-bottom: 16px;">
                            <div class="skeleton skeleton-avatar" style="margin-right: 12px;"></div>
                            <div style="flex: 1;">
                                <div class="skeleton skeleton-text medium"></div>
                                <div class="skeleton skeleton-text short"></div>
                            </div>
                        </div>
                    `;
                    break;
            }
        }

        skeletonContainer.innerHTML = skeletonHTML;
        container.appendChild(skeletonContainer);
        
        this.activeLoaders.add(loaderId);
        return loaderId;
    }

    /**
     * 隐藏加载器
     */
    hide(loaderId) {
        const loader = document.getElementById(loaderId);
        if (!loader) return;

        if (loader.classList.contains('loading-overlay')) {
            loader.classList.remove('show');
            setTimeout(() => {
                loader.remove();
                this.activeLoaders.delete(loaderId);
            }, 300);
        } else {
            loader.remove();
            this.activeLoaders.delete(loaderId);
        }
    }

    /**
     * 隐藏所有加载器
     */
    hideAll() {
        this.activeLoaders.forEach(loaderId => {
            this.hide(loaderId);
        });
    }

    /**
     * 显示空状态
     */
    showEmptyState(container, options = {}) {
        if (typeof container === 'string') {
            container = document.querySelector(container);
        }
        
        if (!container) return null;

        const {
            icon = 'fas fa-inbox',
            title = '暂无数据',
            description = '这里还没有任何内容',
            actionText = '',
            actionCallback = null
        } = options;

        const emptyStateId = `empty-state-${Date.now()}`;
        const emptyState = document.createElement('div');
        emptyState.id = emptyStateId;
        emptyState.className = 'empty-state';
        
        let actionHTML = '';
        if (actionText && actionCallback) {
            actionHTML = `<button class="empty-state-action" onclick="(${actionCallback})()">${actionText}</button>`;
        }

        emptyState.innerHTML = `
            <div class="empty-state-icon">
                <i class="${icon}"></i>
            </div>
            <div class="empty-state-title">${title}</div>
            <div class="empty-state-description">${description}</div>
            ${actionHTML}
        `;

        container.appendChild(emptyState);
        return emptyStateId;
    }

    /**
     * 移除空状态
     */
    hideEmptyState(emptyStateId) {
        const emptyState = document.getElementById(emptyStateId);
        if (emptyState) {
            emptyState.remove();
        }
    }
}

/**
 * 异步操作包装器，自动处理加载状态
 */
async function withLoading(asyncFn, options = {}) {
    const {
        container = null,
        type = 'fullscreen',
        text = '加载中...',
        showError = true
    } = options;

    const loading = window.QuittrLoading || new LoadingManager();
    let loaderId;

    try {
        // 显示加载状态
        switch (type) {
            case 'fullscreen':
                loaderId = loading.showFullscreen(text);
                break;
            case 'inline':
                loaderId = loading.showInline(container, text);
                break;
            case 'skeleton':
                loaderId = loading.showSkeleton(container, options.skeletonType, options.skeletonCount);
                break;
        }

        // 执行异步操作
        const result = await asyncFn();
        
        // 隐藏加载状态
        if (loaderId) {
            loading.hide(loaderId);
        }

        return result;
    } catch (error) {
        // 隐藏加载状态
        if (loaderId) {
            loading.hide(loaderId);
        }

        // 显示错误信息
        if (showError && window.QuittrUtils) {
            window.QuittrUtils.handleError(error, 'withLoading');
        }

        throw error;
    }
}

// 创建全局实例
const loading = new LoadingManager();

// 导出到全局对象
window.QuittrLoading = loading;
window.withLoading = withLoading;

// 向后兼容
window.showLoading = (text) => loading.showFullscreen(text);
window.hideLoading = (loaderId) => loading.hide(loaderId);