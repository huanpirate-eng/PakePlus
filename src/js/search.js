// QUITTR 搜索功能模块

/**
 * 搜索管理器
 */
class SearchManager {
    constructor() {
        this.searchHistory = [];
        this.maxHistoryItems = 10;
        this.debounceDelay = 300;
        this.init();
    }

    init() {
        this.addStyles();
        this.loadSearchHistory();
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* 搜索容器样式 */
            .search-container {
                position: relative;
                margin-bottom: 20px;
            }

            .search-input-wrapper {
                position: relative;
                display: flex;
                align-items: center;
                background: var(--card-color, white);
                border: 2px solid var(--border-color, #e0e0e0);
                border-radius: 12px;
                padding: 0;
                transition: all 0.3s ease;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }

            .search-input-wrapper:focus-within {
                border-color: var(--primary-color, #4CAF50);
                box-shadow: 0 4px 12px rgba(76, 175, 80, 0.2);
            }

            .search-input {
                flex: 1;
                border: none;
                outline: none;
                padding: 16px 20px;
                font-size: 16px;
                background: transparent;
                color: var(--text-primary, #333);
                border-radius: 12px;
            }

            .search-input::placeholder {
                color: var(--text-hint, #999);
            }

            .search-icon {
                padding: 0 16px;
                color: var(--text-secondary, #666);
                font-size: 18px;
            }

            .search-clear {
                padding: 0 16px;
                color: var(--text-secondary, #666);
                cursor: pointer;
                font-size: 18px;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
            }

            .search-clear.show {
                opacity: 1;
                visibility: visible;
            }

            .search-clear:hover {
                color: var(--text-primary, #333);
            }

            /* 搜索建议下拉框 */
            .search-suggestions {
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: var(--card-color, white);
                border: 1px solid var(--border-color, #e0e0e0);
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                z-index: 1000;
                max-height: 300px;
                overflow-y: auto;
                opacity: 0;
                visibility: hidden;
                transform: translateY(-10px);
                transition: all 0.3s ease;
            }

            .search-suggestions.show {
                opacity: 1;
                visibility: visible;
                transform: translateY(0);
            }

            .search-suggestion-item {
                padding: 12px 16px;
                cursor: pointer;
                border-bottom: 1px solid var(--border-light, #f0f0f0);
                display: flex;
                align-items: center;
                gap: 12px;
                transition: background-color 0.2s ease;
            }

            .search-suggestion-item:last-child {
                border-bottom: none;
            }

            .search-suggestion-item:hover,
            .search-suggestion-item.active {
                background: var(--hover-color, #f5f5f5);
            }

            .search-suggestion-icon {
                color: var(--text-secondary, #666);
                font-size: 14px;
                width: 16px;
            }

            .search-suggestion-text {
                flex: 1;
                color: var(--text-primary, #333);
                font-size: 14px;
            }

            .search-suggestion-type {
                color: var(--text-hint, #999);
                font-size: 12px;
                background: var(--bg-secondary, #f0f0f0);
                padding: 2px 8px;
                border-radius: 4px;
            }

            /* 搜索结果样式 */
            .search-results {
                margin-top: 20px;
            }

            .search-result-item {
                background: var(--card-color, white);
                border: 1px solid var(--border-color, #e0e0e0);
                border-radius: 8px;
                padding: 16px;
                margin-bottom: 12px;
                transition: all 0.3s ease;
                cursor: pointer;
            }

            .search-result-item:hover {
                border-color: var(--primary-color, #4CAF50);
                box-shadow: 0 4px 12px rgba(76, 175, 80, 0.1);
                transform: translateY(-2px);
            }

            .search-result-title {
                font-size: 16px;
                font-weight: 600;
                color: var(--text-primary, #333);
                margin-bottom: 8px;
                line-height: 1.4;
            }

            .search-result-snippet {
                color: var(--text-secondary, #666);
                font-size: 14px;
                line-height: 1.5;
                margin-bottom: 8px;
            }

            .search-result-meta {
                display: flex;
                align-items: center;
                gap: 12px;
                font-size: 12px;
                color: var(--text-hint, #999);
            }

            .search-result-tag {
                background: var(--primary-light, #E8F5E8);
                color: var(--primary-color, #4CAF50);
                padding: 2px 8px;
                border-radius: 4px;
                font-size: 11px;
            }

            /* 搜索过滤器 */
            .search-filters {
                display: flex;
                gap: 8px;
                margin-bottom: 16px;
                flex-wrap: wrap;
            }

            .search-filter {
                background: var(--bg-secondary, #f0f0f0);
                border: 1px solid var(--border-color, #e0e0e0);
                border-radius: 20px;
                padding: 6px 16px;
                font-size: 14px;
                cursor: pointer;
                transition: all 0.3s ease;
                color: var(--text-secondary, #666);
            }

            .search-filter.active {
                background: var(--primary-color, #4CAF50);
                color: white;
                border-color: var(--primary-color, #4CAF50);
            }

            .search-filter:hover:not(.active) {
                background: var(--hover-color, #f5f5f5);
                border-color: var(--primary-color, #4CAF50);
            }

            /* 搜索统计 */
            .search-stats {
                color: var(--text-secondary, #666);
                font-size: 14px;
                margin-bottom: 16px;
                padding: 12px 0;
                border-bottom: 1px solid var(--border-light, #f0f0f0);
            }

            /* 高亮搜索关键词 */
            .search-highlight {
                background: var(--highlight-color, #fff3cd);
                color: var(--highlight-text, #856404);
                padding: 1px 2px;
                border-radius: 2px;
                font-weight: 600;
            }

            /* 深色模式适配 */
            .dark-mode .search-highlight {
                background: var(--primary-dark, #388E3C);
                color: white;
            }

            /* 响应式设计 */
            @media (max-width: 768px) {
                .search-input {
                    padding: 14px 16px;
                    font-size: 16px;
                }

                .search-filters {
                    gap: 6px;
                }

                .search-filter {
                    padding: 4px 12px;
                    font-size: 13px;
                }

                .search-result-item {
                    padding: 12px;
                }
            }

            /* 无搜索结果状态 */
            .no-search-results {
                text-align: center;
                padding: 40px 20px;
                color: var(--text-secondary, #666);
            }

            .no-search-results-icon {
                font-size: 48px;
                color: var(--text-hint, #999);
                margin-bottom: 16px;
            }

            .no-search-results-title {
                font-size: 18px;
                font-weight: 600;
                margin-bottom: 8px;
                color: var(--text-primary, #333);
            }

            .no-search-results-description {
                font-size: 14px;
                line-height: 1.5;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * 创建搜索组件
     */
    createSearchComponent(container, options = {}) {
        if (typeof container === 'string') {
            container = document.querySelector(container);
        }
        
        if (!container) return null;

        const {
            placeholder = '搜索...',
            showFilters = true,
            filters = [],
            onSearch = null,
            onFilter = null,
            searchHistory = true
        } = options;

        const searchId = `search-${Date.now()}`;
        const searchHTML = `
            <div class="search-container" id="${searchId}">
                <div class="search-input-wrapper">
                    <i class="search-icon fas fa-search"></i>
                    <input type="text" class="search-input" placeholder="${placeholder}">
                    <i class="search-clear fas fa-times"></i>
                </div>
                <div class="search-suggestions"></div>
                ${showFilters ? `
                    <div class="search-filters">
                        ${filters.map(filter => `
                            <div class="search-filter" data-filter="${filter.value}">
                                ${filter.label}
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
                <div class="search-stats" style="display: none;"></div>
                <div class="search-results"></div>
            </div>
        `;

        container.innerHTML = searchHTML;
        
        const searchContainer = container.querySelector(`#${searchId}`);
        const searchInput = searchContainer.querySelector('.search-input');
        const searchClear = searchContainer.querySelector('.search-clear');
        const searchSuggestions = searchContainer.querySelector('.search-suggestions');
        const searchFilters = searchContainer.querySelectorAll('.search-filter');
        const searchResults = searchContainer.querySelector('.search-results');
        const searchStats = searchContainer.querySelector('.search-stats');

        let currentQuery = '';
        let activeFilters = [];
        let debounceTimer = null;

        // 搜索输入处理
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            currentQuery = query;

            // 显示/隐藏清除按钮
            if (query) {
                searchClear.classList.add('show');
            } else {
                searchClear.classList.remove('show');
                this.hideSuggestions(searchSuggestions);
                this.clearResults(searchResults, searchStats);
            }

            // 防抖搜索
            if (debounceTimer) {
                clearTimeout(debounceTimer);
            }

            debounceTimer = setTimeout(() => {
                if (query) {
                    if (searchHistory) {
                        this.showSuggestions(searchSuggestions, query);
                    }
                    if (onSearch) {
                        onSearch(query, activeFilters);
                    }
                }
            }, this.debounceDelay);
        });

        // 清除搜索
        searchClear.addEventListener('click', () => {
            searchInput.value = '';
            currentQuery = '';
            searchClear.classList.remove('show');
            this.hideSuggestions(searchSuggestions);
            this.clearResults(searchResults, searchStats);
            searchInput.focus();
        });

        // 过滤器处理
        searchFilters.forEach(filter => {
            filter.addEventListener('click', () => {
                const filterValue = filter.dataset.filter;
                
                if (filter.classList.contains('active')) {
                    filter.classList.remove('active');
                    activeFilters = activeFilters.filter(f => f !== filterValue);
                } else {
                    filter.classList.add('active');
                    activeFilters.push(filterValue);
                }

                if (onFilter) {
                    onFilter(activeFilters, currentQuery);
                }
            });
        });

        // 建议点击处理
        searchSuggestions.addEventListener('click', (e) => {
            const suggestionItem = e.target.closest('.search-suggestion-item');
            if (suggestionItem) {
                const text = suggestionItem.querySelector('.search-suggestion-text').textContent;
                searchInput.value = text;
                currentQuery = text;
                this.hideSuggestions(searchSuggestions);
                this.addToHistory(text);
                
                if (onSearch) {
                    onSearch(text, activeFilters);
                }
            }
        });

        // 键盘导航
        searchInput.addEventListener('keydown', (e) => {
            const suggestions = searchSuggestions.querySelectorAll('.search-suggestion-item');
            const activeSuggestion = searchSuggestions.querySelector('.search-suggestion-item.active');
            
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (activeSuggestion) {
                    activeSuggestion.classList.remove('active');
                    const next = activeSuggestion.nextElementSibling;
                    if (next) {
                        next.classList.add('active');
                    } else {
                        suggestions[0]?.classList.add('active');
                    }
                } else {
                    suggestions[0]?.classList.add('active');
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (activeSuggestion) {
                    activeSuggestion.classList.remove('active');
                    const prev = activeSuggestion.previousElementSibling;
                    if (prev) {
                        prev.classList.add('active');
                    } else {
                        suggestions[suggestions.length - 1]?.classList.add('active');
                    }
                } else {
                    suggestions[suggestions.length - 1]?.classList.add('active');
                }
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (activeSuggestion) {
                    activeSuggestion.click();
                } else if (currentQuery) {
                    this.addToHistory(currentQuery);
                    if (onSearch) {
                        onSearch(currentQuery, activeFilters);
                    }
                }
            } else if (e.key === 'Escape') {
                this.hideSuggestions(searchSuggestions);
            }
        });

        // 点击外部隐藏建议
        document.addEventListener('click', (e) => {
            if (!searchContainer.contains(e.target)) {
                this.hideSuggestions(searchSuggestions);
            }
        });

        return {
            container: searchContainer,
            input: searchInput,
            setResults: (results, stats) => this.setResults(searchResults, searchStats, results, stats, currentQuery),
            clearResults: () => this.clearResults(searchResults, searchStats),
            showLoading: () => this.showSearchLoading(searchResults),
            hideLoading: () => this.hideSearchLoading(searchResults)
        };
    }

    /**
     * 显示搜索建议
     */
    showSuggestions(container, query) {
        const suggestions = this.getSuggestions(query);
        
        if (suggestions.length === 0) {
            this.hideSuggestions(container);
            return;
        }

        const suggestionsHTML = suggestions.map(suggestion => `
            <div class="search-suggestion-item">
                <i class="search-suggestion-icon ${suggestion.icon}"></i>
                <span class="search-suggestion-text">${suggestion.text}</span>
                <span class="search-suggestion-type">${suggestion.type}</span>
            </div>
        `).join('');

        container.innerHTML = suggestionsHTML;
        container.classList.add('show');
    }

    /**
     * 隐藏搜索建议
     */
    hideSuggestions(container) {
        container.classList.remove('show');
        setTimeout(() => {
            container.innerHTML = '';
        }, 300);
    }

    /**
     * 获取搜索建议
     */
    getSuggestions(query) {
        const suggestions = [];
        
        // 搜索历史匹配
        this.searchHistory.forEach(item => {
            if (item.toLowerCase().includes(query.toLowerCase())) {
                suggestions.push({
                    text: item,
                    type: '历史',
                    icon: 'fas fa-history'
                });
            }
        });

        // 热门搜索建议
        const hotSearches = [
            '戒色方法', '健康生活', '运动计划', '营养饮食', 
            '心理健康', '社区支持', '成功案例', '专家建议'
        ];

        hotSearches.forEach(item => {
            if (item.toLowerCase().includes(query.toLowerCase()) && 
                !suggestions.some(s => s.text === item)) {
                suggestions.push({
                    text: item,
                    type: '热门',
                    icon: 'fas fa-fire'
                });
            }
        });

        return suggestions.slice(0, 8);
    }

    /**
     * 设置搜索结果
     */
    setResults(resultsContainer, statsContainer, results, stats, query) {
        // 显示统计信息
        if (stats) {
            statsContainer.innerHTML = `找到 ${stats.total} 个结果 (用时 ${stats.time}ms)`;
            statsContainer.style.display = 'block';
        }

        // 显示搜索结果
        if (results && results.length > 0) {
            const resultsHTML = results.map(result => `
                <div class="search-result-item" data-id="${result.id}">
                    <div class="search-result-title">${this.highlightText(result.title, query)}</div>
                    <div class="search-result-snippet">${this.highlightText(result.snippet, query)}</div>
                    <div class="search-result-meta">
                        <span>${result.type}</span>
                        <span>${result.date}</span>
                        ${result.tags ? result.tags.map(tag => 
                            `<span class="search-result-tag">${tag}</span>`
                        ).join('') : ''}
                    </div>
                </div>
            `).join('');
            
            resultsContainer.innerHTML = resultsHTML;

            // 添加点击事件
            resultsContainer.querySelectorAll('.search-result-item').forEach(item => {
                item.addEventListener('click', () => {
                    const resultId = item.dataset.id;
                    const result = results.find(r => r.id === resultId);
                    if (result && result.onClick) {
                        result.onClick(result);
                    }
                });
            });
        } else {
            // 显示无结果状态
            resultsContainer.innerHTML = `
                <div class="no-search-results">
                    <div class="no-search-results-icon">
                        <i class="fas fa-search"></i>
                    </div>
                    <div class="no-search-results-title">未找到相关结果</div>
                    <div class="no-search-results-description">
                        尝试使用不同的关键词或检查拼写
                    </div>
                </div>
            `;
        }
    }

    /**
     * 清除搜索结果
     */
    clearResults(resultsContainer, statsContainer) {
        resultsContainer.innerHTML = '';
        statsContainer.style.display = 'none';
    }

    /**
     * 显示搜索加载状态
     */
    showSearchLoading(container) {
        if (window.QuittrLoading) {
            window.QuittrLoading.showSkeleton(container, 'list', 3);
        }
    }

    /**
     * 隐藏搜索加载状态
     */
    hideSearchLoading(container) {
        const skeletons = container.querySelectorAll('[id^="skeleton-loader-"]');
        skeletons.forEach(skeleton => skeleton.remove());
    }

    /**
     * 高亮搜索关键词
     */
    highlightText(text, query) {
        if (!query || !text) return text;
        
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<span class="search-highlight">$1</span>');
    }

    /**
     * 添加到搜索历史
     */
    addToHistory(query) {
        if (!query || this.searchHistory.includes(query)) return;
        
        this.searchHistory.unshift(query);
        if (this.searchHistory.length > this.maxHistoryItems) {
            this.searchHistory = this.searchHistory.slice(0, this.maxHistoryItems);
        }
        
        this.saveSearchHistory();
    }

    /**
     * 加载搜索历史
     */
    loadSearchHistory() {
        try {
            const history = localStorage.getItem('quittr_search_history');
            if (history) {
                this.searchHistory = JSON.parse(history);
            }
        } catch (error) {
            console.warn('Failed to load search history:', error);
        }
    }

    /**
     * 保存搜索历史
     */
    saveSearchHistory() {
        try {
            localStorage.setItem('quittr_search_history', JSON.stringify(this.searchHistory));
        } catch (error) {
            console.warn('Failed to save search history:', error);
        }
    }

    /**
     * 清除搜索历史
     */
    clearHistory() {
        this.searchHistory = [];
        localStorage.removeItem('quittr_search_history');
    }
}

// 创建全局实例
const searchManager = new SearchManager();

// 导出到全局对象
window.QuittrSearch = searchManager;

// 便捷方法
window.createSearch = (container, options) => searchManager.createSearchComponent(container, options);