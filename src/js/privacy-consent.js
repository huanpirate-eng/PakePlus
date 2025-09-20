/**
 * QUITTR 隐私同意管理器
 * 处理用户隐私同意、数据收集授权和合规性管理
 */

class PrivacyConsentManager {
    constructor() {
        this.consentVersion = '1.0.0';
        this.consentKey = 'quittr_privacy_consent';
        this.consentData = this.loadConsent();
        this.init();
    }

    init() {
        // 检查是否需要显示同意弹窗
        if (!this.hasValidConsent()) {
            this.showConsentModal();
        }
        
        // 监听页面加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupConsentUI();
            });
        } else {
            this.setupConsentUI();
        }
    }

    /**
     * 检查是否有有效的同意记录
     */
    hasValidConsent() {
        if (!this.consentData) return false;
        
        // 检查版本是否匹配
        if (this.consentData.version !== this.consentVersion) return false;
        
        // 检查是否已同意必要条款
        return this.consentData.essential === true;
    }

    /**
     * 加载已保存的同意记录
     */
    loadConsent() {
        try {
            const stored = localStorage.getItem(this.consentKey);
            return stored ? JSON.parse(stored) : null;
        } catch (error) {
            console.error('加载隐私同意记录失败:', error);
            return null;
        }
    }

    /**
     * 保存同意记录
     */
    saveConsent(consentData) {
        try {
            const consent = {
                version: this.consentVersion,
                timestamp: new Date().toISOString(),
                ...consentData
            };
            
            localStorage.setItem(this.consentKey, JSON.stringify(consent));
            this.consentData = consent;
            
            // 触发同意更新事件
            this.dispatchConsentEvent('consent-updated', consent);
            
            return true;
        } catch (error) {
            console.error('保存隐私同意记录失败:', error);
            return false;
        }
    }

    /**
     * 显示隐私同意弹窗
     */
    showConsentModal() {
        // 创建遮罩层
        const overlay = document.createElement('div');
        overlay.className = 'privacy-consent-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(5px);
        `;

        // 创建弹窗内容
        const modal = document.createElement('div');
        modal.className = 'privacy-consent-modal';
        modal.style.cssText = `
            background: var(--bg-color, #ffffff);
            border-radius: 16px;
            padding: 32px;
            max-width: 600px;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            color: var(--text-color, #333333);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;

        modal.innerHTML = `
            <div class="consent-header">
                <h2 style="margin: 0 0 16px 0; color: var(--primary-color, #007AFF); font-size: 24px;">
                    🔒 隐私保护声明
                </h2>
                <p style="margin: 0 0 24px 0; color: var(--text-secondary, #666); line-height: 1.6;">
                    欢迎使用 QUITTR！我们重视您的隐私权，请仔细阅读以下信息。
                </p>
            </div>

            <div class="consent-content" style="margin-bottom: 24px;">
                <div class="consent-section" style="margin-bottom: 20px;">
                    <h3 style="margin: 0 0 12px 0; font-size: 18px; color: var(--text-color, #333);">
                        📊 我们收集的信息
                    </h3>
                    <ul style="margin: 0; padding-left: 20px; line-height: 1.6; color: var(--text-secondary, #666);">
                        <li>基本信息：用户名、邮箱（用于账号管理）</li>
                        <li>使用数据：恢复进度、学习记录（用于个性化服务）</li>
                        <li>设备信息：设备类型、操作系统（用于优化体验）</li>
                    </ul>
                </div>

                <div class="consent-section" style="margin-bottom: 20px;">
                    <h3 style="margin: 0 0 12px 0; font-size: 18px; color: var(--text-color, #333);">
                        🛡️ 您的权利
                    </h3>
                    <ul style="margin: 0; padding-left: 20px; line-height: 1.6; color: var(--text-secondary, #666);">
                        <li>随时查看、修改或删除您的个人信息</li>
                        <li>控制数据收集和使用的范围</li>
                        <li>导出您的所有数据</li>
                        <li>随时撤回同意</li>
                    </ul>
                </div>
            </div>

            <div class="consent-options" style="margin-bottom: 24px;">
                <div class="consent-option" style="margin-bottom: 16px; padding: 16px; background: var(--bg-secondary, #f8f9fa); border-radius: 8px;">
                    <label style="display: flex; align-items: flex-start; cursor: pointer;">
                        <input type="checkbox" id="essential-consent" style="margin: 4px 12px 0 0; transform: scale(1.2);" checked disabled>
                        <div>
                            <strong style="color: var(--text-color, #333);">必要功能</strong>
                            <p style="margin: 4px 0 0 0; color: var(--text-secondary, #666); font-size: 14px;">
                                基本功能运行所必需的数据收集（无法关闭）
                            </p>
                        </div>
                    </label>
                </div>

                <div class="consent-option" style="margin-bottom: 16px; padding: 16px; background: var(--bg-secondary, #f8f9fa); border-radius: 8px;">
                    <label style="display: flex; align-items: flex-start; cursor: pointer;">
                        <input type="checkbox" id="analytics-consent" style="margin: 4px 12px 0 0; transform: scale(1.2);" checked>
                        <div>
                            <strong style="color: var(--text-color, #333);">使用分析</strong>
                            <p style="margin: 4px 0 0 0; color: var(--text-secondary, #666); font-size: 14px;">
                                收集使用统计以改进应用体验
                            </p>
                        </div>
                    </label>
                </div>

                <div class="consent-option" style="margin-bottom: 16px; padding: 16px; background: var(--bg-secondary, #f8f9fa); border-radius: 8px;">
                    <label style="display: flex; align-items: flex-start; cursor: pointer;">
                        <input type="checkbox" id="personalization-consent" style="margin: 4px 12px 0 0; transform: scale(1.2);" checked>
                        <div>
                            <strong style="color: var(--text-color, #333);">个性化推荐</strong>
                            <p style="margin: 4px 0 0 0; color: var(--text-secondary, #666); font-size: 14px;">
                                基于您的使用习惯提供个性化内容
                            </p>
                        </div>
                    </label>
                </div>
            </div>

            <div class="consent-actions" style="display: flex; gap: 12px; flex-wrap: wrap;">
                <button id="accept-all-btn" style="
                    flex: 1;
                    min-width: 120px;
                    padding: 12px 24px;
                    background: var(--primary-color, #007AFF);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                ">
                    接受全部
                </button>
                
                <button id="accept-selected-btn" style="
                    flex: 1;
                    min-width: 120px;
                    padding: 12px 24px;
                    background: transparent;
                    color: var(--primary-color, #007AFF);
                    border: 2px solid var(--primary-color, #007AFF);
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                ">
                    仅接受选中项
                </button>
            </div>

            <div class="consent-footer" style="margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--border-color, #e0e0e0);">
                <p style="margin: 0; font-size: 12px; color: var(--text-secondary, #666); text-align: center; line-height: 1.5;">
                    点击"接受"即表示您已阅读并同意我们的
                    <a href="#" onclick="window.privacyConsent.showPrivacyPolicy()" style="color: var(--primary-color, #007AFF); text-decoration: none;">隐私政策</a>
                    和
                    <a href="#" onclick="window.privacyConsent.showTermsOfService()" style="color: var(--primary-color, #007AFF); text-decoration: none;">服务条款</a>
                </p>
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // 绑定事件
        this.bindConsentEvents(overlay);

        // 防止背景滚动
        document.body.style.overflow = 'hidden';
    }

    /**
     * 绑定同意弹窗事件
     */
    bindConsentEvents(overlay) {
        const acceptAllBtn = overlay.querySelector('#accept-all-btn');
        const acceptSelectedBtn = overlay.querySelector('#accept-selected-btn');

        // 接受全部
        acceptAllBtn.addEventListener('click', () => {
            this.handleConsent({
                essential: true,
                analytics: true,
                personalization: true
            });
            this.hideConsentModal(overlay);
        });

        // 仅接受选中项
        acceptSelectedBtn.addEventListener('click', () => {
            const analytics = overlay.querySelector('#analytics-consent').checked;
            const personalization = overlay.querySelector('#personalization-consent').checked;
            
            this.handleConsent({
                essential: true,
                analytics: analytics,
                personalization: personalization
            });
            this.hideConsentModal(overlay);
        });

        // 按钮悬停效果
        [acceptAllBtn, acceptSelectedBtn].forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                btn.style.transform = 'translateY(-2px)';
                btn.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
            });
            
            btn.addEventListener('mouseleave', () => {
                btn.style.transform = 'translateY(0)';
                btn.style.boxShadow = 'none';
            });
        });
    }

    /**
     * 处理用户同意
     */
    handleConsent(consent) {
        if (this.saveConsent(consent)) {
            // 根据同意情况初始化相应功能
            this.initializeFeatures(consent);
            
            // 显示感谢消息
            this.showThankYouMessage();
        }
    }

    /**
     * 隐藏同意弹窗
     */
    hideConsentModal(overlay) {
        overlay.style.opacity = '0';
        overlay.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            document.body.removeChild(overlay);
            document.body.style.overflow = '';
        }, 200);
    }

    /**
     * 根据同意情况初始化功能
     */
    initializeFeatures(consent) {
        // 必要功能始终启用
        this.enableEssentialFeatures();

        // 分析功能
        if (consent.analytics) {
            this.enableAnalytics();
        }

        // 个性化功能
        if (consent.personalization) {
            this.enablePersonalization();
        }
    }

    /**
     * 启用必要功能
     */
    enableEssentialFeatures() {
        // 基本应用功能
        console.log('✅ 必要功能已启用');
    }

    /**
     * 启用分析功能
     */
    enableAnalytics() {
        // 使用统计收集
        console.log('📊 分析功能已启用');
        
        // 可以在这里初始化分析SDK
        if (typeof gtag !== 'undefined') {
            gtag('consent', 'update', {
                'analytics_storage': 'granted'
            });
        }
    }

    /**
     * 启用个性化功能
     */
    enablePersonalization() {
        // 个性化推荐
        console.log('🎯 个性化功能已启用');
        
        // 可以在这里初始化个性化服务
        if (typeof gtag !== 'undefined') {
            gtag('consent', 'update', {
                'ad_storage': 'granted',
                'personalization_storage': 'granted'
            });
        }
    }

    /**
     * 显示感谢消息
     */
    showThankYouMessage() {
        // 创建感谢提示
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--success-color, #28a745);
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10001;
            font-weight: 600;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        toast.textContent = '✅ 隐私设置已保存，感谢您的信任！';

        document.body.appendChild(toast);

        // 显示动画
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 100);

        // 自动隐藏
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }

    /**
     * 设置同意管理UI
     */
    setupConsentUI() {
        // 在设置页面添加隐私管理入口
        const settingsContainer = document.querySelector('.privacy-settings, .settings-container');
        if (settingsContainer) {
            this.addPrivacyManagementUI(settingsContainer);
        }
    }

    /**
     * 添加隐私管理UI
     */
    addPrivacyManagementUI(container) {
        const privacySection = document.createElement('div');
        privacySection.className = 'privacy-management-section';
        privacySection.innerHTML = `
            <div class="setting-item">
                <div class="setting-info">
                    <h3>隐私同意管理</h3>
                    <p>管理您的数据收集和使用偏好</p>
                </div>
                <button id="manage-consent-btn" class="btn btn-outline">
                    管理设置
                </button>
            </div>
        `;

        container.appendChild(privacySection);

        // 绑定管理按钮事件
        const manageBtn = privacySection.querySelector('#manage-consent-btn');
        manageBtn.addEventListener('click', () => {
            this.showConsentModal();
        });
    }

    /**
     * 显示隐私政策
     */
    showPrivacyPolicy() {
        // 这里可以打开隐私政策页面或弹窗
        console.log('显示隐私政策');
    }

    /**
     * 显示服务条款
     */
    showTermsOfService() {
        // 这里可以打开服务条款页面或弹窗
        console.log('显示服务条款');
    }

    /**
     * 撤回同意
     */
    revokeConsent() {
        localStorage.removeItem(this.consentKey);
        this.consentData = null;
        
        // 触发撤回事件
        this.dispatchConsentEvent('consent-revoked');
        
        // 重新显示同意弹窗
        this.showConsentModal();
    }

    /**
     * 获取当前同意状态
     */
    getConsentStatus() {
        return this.consentData;
    }

    /**
     * 检查特定功能是否已同意
     */
    hasConsentFor(feature) {
        if (!this.consentData) return false;
        return this.consentData[feature] === true;
    }

    /**
     * 触发同意事件
     */
    dispatchConsentEvent(eventType, data = null) {
        const event = new CustomEvent(eventType, {
            detail: data
        });
        window.dispatchEvent(event);
    }
}

// 全局初始化
window.privacyConsent = new PrivacyConsentManager();

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PrivacyConsentManager;
}