/**
 * 订阅管理器 - 整合会员中心和支付功能
 * 负责订阅状态管理、支付处理、历史记录等
 */
class SubscriptionManager {
    constructor() {
        this.selectedPlan = null;
        this.selectedPayment = 'alipay';
        this.currentSubscription = null;
        this.isProcessing = false;
        
        // 支付配置
        this.config = {
            apiEndpoint: '/api/subscription',
            timeout: 30000,
            retryAttempts: 3
        };

        // 计划价格映射
        this.planPrices = {
            basic: 19,
            premium: 39,
            annual: 299
        };

        // 计划名称映射
        this.planNames = {
            basic: 'VIP基础版',
            premium: 'VIP高级版', 
            annual: 'VIP年度版'
        };

        // 支付方式映射
        this.paymentNames = {
            alipay: '支付宝',
            wechat: '微信支付',
            apple: 'Apple Pay'
        };

        this.init();
    }

    /**
     * 初始化
     */
    init() {
        this.loadCurrentSubscription();
        this.updateUI();
        this.loadSubscriptionHistory();
        this.setupEventListeners();
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 监听存储变化
        window.addEventListener('storage', (e) => {
            if (e.key === 'subscriptionData') {
                this.loadCurrentSubscription();
            }
        });

        // 监听页面可见性变化
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.loadCurrentSubscription();
            }
        });
    }

    /**
     * 加载当前订阅状态
     */
    loadCurrentSubscription() {
        const savedSubscription = localStorage.getItem('subscriptionData');
        if (savedSubscription) {
            try {
                this.currentSubscription = JSON.parse(savedSubscription);
                
                // 检查订阅是否过期
                const expiryDate = new Date(this.currentSubscription.expiryDate);
                const now = new Date();
                
                if (expiryDate < now) {
                    this.currentSubscription.status = 'expired';
                    localStorage.setItem('subscriptionData', JSON.stringify(this.currentSubscription));
                }
                
                this.updateSubscriptionStatus();
            } catch (error) {
                console.error('加载订阅数据失败:', error);
                this.clearInvalidSubscription();
            }
        }
    }

    /**
     * 清除无效订阅数据
     */
    clearInvalidSubscription() {
        localStorage.removeItem('subscriptionData');
        this.currentSubscription = null;
        this.updateSubscriptionStatus();
    }

    /**
     * 更新订阅状态显示
     */
    updateSubscriptionStatus() {
        const currentPlanTitle = document.getElementById('currentPlanTitle');
        const currentPlanDesc = document.getElementById('currentPlanDesc');
        const subscriptionDetails = document.getElementById('subscriptionDetails');
        const cancelBtn = document.getElementById('cancelBtn');
        const subscriptionHistory = document.getElementById('subscriptionHistory');

        if (!this.currentSubscription || this.currentSubscription.status === 'expired') {
            // 显示免费版状态
            if (currentPlanTitle) currentPlanTitle.textContent = '当前计划：免费版';
            if (currentPlanDesc) currentPlanDesc.textContent = '升级到VIP享受更多专业功能';
            if (subscriptionDetails) subscriptionDetails.style.display = 'none';
            if (cancelBtn) cancelBtn.style.display = 'none';
            return;
        }

        // 更新当前计划显示
        if (currentPlanTitle) {
            currentPlanTitle.textContent = `当前计划：${this.planNames[this.currentSubscription.plan] || this.currentSubscription.planName}`;
        }
        if (currentPlanDesc) {
            currentPlanDesc.textContent = '享受所有专业功能';
        }

        // 显示订阅详情
        if (subscriptionDetails) {
            subscriptionDetails.style.display = 'grid';
            
            // 更新订阅信息
            const expiryDate = new Date(this.currentSubscription.expiryDate);
            const subscriptionStatus = document.getElementById('subscriptionStatus');
            const expiryDateEl = document.getElementById('expiryDate');
            const autoRenewal = document.getElementById('autoRenewal');
            const nextBilling = document.getElementById('nextBilling');

            if (subscriptionStatus) {
                subscriptionStatus.textContent = this.currentSubscription.status === 'active' ? '已激活' : '已过期';
                subscriptionStatus.className = this.currentSubscription.status === 'active' ? 'detail-value status-active' : 'detail-value status-expired';
            }

            if (expiryDateEl) {
                expiryDateEl.textContent = expiryDate.toLocaleDateString('zh-CN');
            }

            if (autoRenewal) {
                autoRenewal.textContent = this.currentSubscription.autoRenewal ? '已开启' : '已关闭';
            }

            // 计算下次扣费时间
            if (nextBilling && this.currentSubscription.autoRenewal && this.currentSubscription.status === 'active') {
                const nextBillingDate = new Date(expiryDate);
                nextBillingDate.setDate(nextBillingDate.getDate() - 3); // 提前3天扣费
                nextBilling.textContent = nextBillingDate.toLocaleDateString('zh-CN');
            } else if (nextBilling) {
                nextBilling.textContent = '未开启自动续费';
            }
        }

        // 显示取消订阅按钮
        if (cancelBtn && this.currentSubscription.status === 'active') {
            cancelBtn.style.display = 'inline-block';
        }

        // 显示订阅历史
        if (subscriptionHistory) {
            subscriptionHistory.style.display = 'block';
        }
    }

    /**
     * 选择订阅计划
     */
    selectPlan(planType) {
        this.selectedPlan = planType;

        // 更新UI状态
        document.querySelectorAll('.plan-card').forEach(card => {
            card.classList.toggle('selected', card.dataset.plan === planType);
        });

        this.updateSubscribeButton();
    }

    /**
     * 选择支付方式
     */
    selectPayment(paymentType) {
        this.selectedPayment = paymentType;

        // 更新UI状态
        document.querySelectorAll('.payment-option').forEach(option => {
            option.classList.toggle('selected', option.dataset.method === paymentType);
        });

        this.updateSubscribeButton();
    }

    /**
     * 更新订阅按钮状态
     */
    updateSubscribeButton() {
        const subscribeBtn = document.getElementById('subscribeBtn');
        const buttonText = document.getElementById('button-text');

        if (!subscribeBtn || !buttonText) return;

        if (this.selectedPlan && this.selectedPayment && !this.isProcessing) {
            subscribeBtn.disabled = false;
            buttonText.textContent = `立即订阅 ¥${this.planPrices[this.selectedPlan]}`;
        } else if (this.isProcessing) {
            subscribeBtn.disabled = true;
            buttonText.textContent = '处理中...';
        } else {
            subscribeBtn.disabled = true;
            buttonText.textContent = '请选择计划';
        }
    }

    /**
     * 订阅计划
     */
    async subscribeToPlan() {
        if (!this.selectedPlan || !this.selectedPayment) {
            this.showMessage('请选择订阅计划和支付方式', 'error');
            return;
        }

        if (this.isProcessing) {
            return;
        }

        this.isProcessing = true;
        this.showLoadingState(true);

        try {
            // 准备支付数据
            const paymentData = this.preparePaymentData();
            
            // 验证支付数据
            if (!this.validatePaymentData(paymentData)) {
                throw new Error('支付数据验证失败');
            }

            // 处理支付
            const result = await this.processPayment(paymentData);
            
            if (result.success) {
                // 更新订阅状态
                this.updateSubscriptionAfterPayment(result);
                this.showMessage('订阅成功！感谢您的支持', 'success');
                
                // 重置选择状态
                this.resetSelections();
            } else {
                throw new Error(result.message || '支付失败');
            }
            
        } catch (error) {
            console.error('订阅失败:', error);
            this.showMessage(error.message || '订阅失败，请重试', 'error');
        } finally {
            this.isProcessing = false;
            this.showLoadingState(false);
        }
    }

    /**
     * 准备支付数据
     */
    preparePaymentData() {
        return {
            plan: this.selectedPlan,
            planName: this.planNames[this.selectedPlan],
            amount: this.planPrices[this.selectedPlan],
            paymentMethod: this.selectedPayment,
            currency: 'CNY',
            timestamp: Date.now(),
            userId: this.getUserId(),
            deviceInfo: this.getDeviceInfo()
        };
    }

    /**
     * 验证支付数据
     */
    validatePaymentData(data) {
        if (!data.plan || !data.amount || !data.paymentMethod) {
            return false;
        }

        if (data.amount <= 0 || data.amount > 10000) {
            return false;
        }

        if (!['basic', 'premium', 'annual'].includes(data.plan)) {
            return false;
        }

        if (!['alipay', 'wechat', 'apple'].includes(data.paymentMethod)) {
            return false;
        }

        return true;
    }

    /**
     * 处理支付
     */
    async processPayment(paymentData) {
        // 检查是否为微信或支付宝支付，如果是则显示收款码
        if (paymentData.paymentMethod === 'wechat' || paymentData.paymentMethod === 'alipay') {
            // 获取计划价格
            const planPrices = {
                'basic': 9.9,
                'premium': 19.9,
                'annual': 199
            };
            
            const amount = planPrices[paymentData.plan] || 0;
            const planNames = {
                'basic': '基础版',
                'premium': '高级版',
                'annual': '年度版'
            };
            
            const planName = planNames[paymentData.plan] || '订阅计划';
            
            // 显示收款码
            showQRCode(paymentData.paymentMethod, amount, planName);
            
            // 返回一个pending状态，实际支付由用户确认
            return new Promise((resolve) => {
                // 这里不自动resolve，等待用户确认支付
                window.currentPaymentResolve = resolve;
                window.currentPaymentData = paymentData;
            });
        }
        
        // 其他支付方式的模拟支付过程
        return new Promise((resolve) => {
            setTimeout(() => {
                // 模拟支付成功
                resolve({
                    success: true,
                    transactionId: this.generateTransactionId(),
                    paymentData: paymentData,
                    timestamp: new Date().toISOString()
                });
            }, 2000);
        });
    }

    /**
     * 支付成功后更新订阅
     */
    updateSubscriptionAfterPayment(result) {
        const paymentData = result.paymentData;
        
        // 计算到期时间
        const now = new Date();
        let expiryDate;
        
        switch(paymentData.plan) {
            case 'basic':
            case 'premium':
                expiryDate = new Date(now.setMonth(now.getMonth() + 1));
                break;
            case 'annual':
                expiryDate = new Date(now.setFullYear(now.getFullYear() + 1));
                break;
        }

        // 保存订阅信息
        const subscriptionData = {
            plan: paymentData.plan,
            planName: paymentData.planName,
            price: paymentData.amount,
            paymentMethod: paymentData.paymentMethod,
            startDate: new Date().toISOString(),
            expiryDate: expiryDate.toISOString(),
            autoRenewal: true,
            status: 'active',
            transactionId: result.transactionId
        };

        localStorage.setItem('subscriptionData', JSON.stringify(subscriptionData));
        this.currentSubscription = subscriptionData;

        // 保存到历史记录
        this.saveToHistory(subscriptionData, result.transactionId);

        // 更新UI
        this.updateSubscriptionStatus();
        this.loadSubscriptionHistory();
    }

    /**
     * 保存到历史记录
     */
    saveToHistory(subscriptionData, transactionId) {
        let history = JSON.parse(localStorage.getItem('subscriptionHistory') || '[]');
        
        const historyItem = {
            id: transactionId,
            date: new Date().toISOString(),
            plan: subscriptionData.planName,
            amount: subscriptionData.price,
            paymentMethod: subscriptionData.paymentMethod,
            status: 'completed'
        };
        
        history.unshift(historyItem);
        
        // 只保留最近20条记录
        history = history.slice(0, 20);
        localStorage.setItem('subscriptionHistory', JSON.stringify(history));
    }

    /**
     * 加载订阅历史
     */
    loadSubscriptionHistory() {
        const history = JSON.parse(localStorage.getItem('subscriptionHistory') || '[]');
        const historyList = document.getElementById('historyList');
        
        if (!historyList) return;
        
        if (history.length === 0) {
            historyList.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">暂无订阅历史</p>';
            return;
        }

        historyList.innerHTML = history.map(item => `
            <div class="history-item">
                <div class="history-info">
                    <div class="history-plan">${item.plan}</div>
                    <div class="history-date">${new Date(item.date).toLocaleDateString('zh-CN')} ${new Date(item.date).toLocaleTimeString('zh-CN', {hour: '2-digit', minute: '2-digit'})}</div>
                    <div class="history-id">订单号: ${item.id}</div>
                </div>
                <div class="history-amount">¥${item.amount}</div>
            </div>
        `).join('');
    }

    /**
     * 切换自动续费
     */
    toggleAutoRenewal() {
        if (!this.currentSubscription || this.currentSubscription.status !== 'active') {
            this.showMessage('当前没有有效的订阅', 'error');
            return;
        }

        this.currentSubscription.autoRenewal = !this.currentSubscription.autoRenewal;
        localStorage.setItem('subscriptionData', JSON.stringify(this.currentSubscription));

        // 更新UI
        const autoRenewalEl = document.getElementById('autoRenewal');
        const nextBillingEl = document.getElementById('nextBilling');
        
        if (autoRenewalEl) {
            autoRenewalEl.textContent = this.currentSubscription.autoRenewal ? '已开启' : '已关闭';
        }

        if (nextBillingEl) {
            if (this.currentSubscription.autoRenewal) {
                const expiryDate = new Date(this.currentSubscription.expiryDate);
                const nextBillingDate = new Date(expiryDate);
                nextBillingDate.setDate(nextBillingDate.getDate() - 3);
                nextBillingEl.textContent = nextBillingDate.toLocaleDateString('zh-CN');
            } else {
                nextBillingEl.textContent = '未开启自动续费';
            }
        }

        this.showMessage(
            `自动续费已${this.currentSubscription.autoRenewal ? '开启' : '关闭'}`, 
            'success'
        );
    }

    /**
     * 取消订阅
     */
    cancelSubscription() {
        if (!this.currentSubscription || this.currentSubscription.status !== 'active') {
            this.showMessage('当前没有有效的订阅', 'error');
            return;
        }

        if (!confirm('确定要取消订阅吗？取消后将在到期时间后失去VIP权益。')) {
            return;
        }

        // 关闭自动续费
        this.currentSubscription.autoRenewal = false;
        localStorage.setItem('subscriptionData', JSON.stringify(this.currentSubscription));
        
        // 更新UI
        this.updateSubscriptionStatus();
        
        this.showMessage('订阅已取消，将在到期后停止续费', 'success');
    }

    /**
     * 重置选择状态
     */
    resetSelections() {
        this.selectedPlan = null;
        
        document.querySelectorAll('.plan-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        this.updateSubscribeButton();
    }

    /**
     * 显示加载状态
     */
    showLoadingState(show) {
        const subscribeBtn = document.getElementById('subscribeBtn');
        const loadingSpinner = document.getElementById('loading-spinner');
        const buttonText = document.getElementById('button-text');

        if (!subscribeBtn || !loadingSpinner || !buttonText) return;

        if (show) {
            subscribeBtn.disabled = true;
            loadingSpinner.style.display = 'inline-block';
            buttonText.textContent = '处理中...';
        } else {
            loadingSpinner.style.display = 'none';
            this.updateSubscribeButton();
        }
    }

    /**
     * 显示消息
     */
    showMessage(message, type = 'success') {
        const messageEl = document.getElementById('success-message');
        if (!messageEl) return;

        messageEl.textContent = message;
        messageEl.style.display = 'block';
        messageEl.style.background = type === 'success' ? '#4caf50' : '#f44336';

        // 自动隐藏消息
        setTimeout(() => {
            messageEl.style.display = 'none';
        }, 4000);

        // 如果是错误消息，也显示在控制台
        if (type === 'error') {
            console.error('订阅管理错误:', message);
        }
    }

    /**
     * 更新UI
     */
    updateUI() {
        // 应用深色模式
        if (localStorage.getItem('darkMode') === 'true') {
            document.body.classList.add('dark-mode');
        }

        // 更新按钮状态
        this.updateSubscribeButton();
    }

    /**
     * 获取用户ID
     */
    getUserId() {
        let userId = localStorage.getItem('userId');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('userId', userId);
        }
        return userId;
    }

    /**
     * 获取设备信息
     */
    getDeviceInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            screenResolution: `${screen.width}x${screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };
    }

    /**
     * 生成交易ID
     */
    generateTransactionId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        return `TXN_${timestamp}_${random}`;
    }

    /**
     * 获取订阅状态
     */
    getSubscriptionStatus() {
        return {
            hasActiveSubscription: this.currentSubscription && this.currentSubscription.status === 'active',
            currentPlan: this.currentSubscription?.plan || null,
            expiryDate: this.currentSubscription?.expiryDate || null,
            autoRenewal: this.currentSubscription?.autoRenewal || false
        };
    }

    /**
     * 检查功能权限
     */
    hasFeatureAccess(feature) {
        if (!this.currentSubscription || this.currentSubscription.status !== 'active') {
            return false;
        }

        const featureMap = {
            'ai_chat': ['basic', 'premium', 'annual'],
            'advanced_analytics': ['premium', 'annual'],
            'expert_consultation': ['annual'],
            'family_sharing': ['annual'],
            'offline_mode': ['annual']
        };

        const allowedPlans = featureMap[feature] || [];
        return allowedPlans.includes(this.currentSubscription.plan);
    }

    /**
     * 清理数据
     */
    cleanup() {
        // 清理过期的历史记录
        const history = JSON.parse(localStorage.getItem('subscriptionHistory') || '[]');
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const filteredHistory = history.filter(item => {
            return new Date(item.date) > thirtyDaysAgo;
        });

        if (filteredHistory.length !== history.length) {
            localStorage.setItem('subscriptionHistory', JSON.stringify(filteredHistory));
        }
    }
}

// 全局实例
let subscriptionManager;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    subscriptionManager = new SubscriptionManager();
    
    // 定期清理数据
    setInterval(() => {
        subscriptionManager.cleanup();
    }, 24 * 60 * 60 * 1000); // 每24小时清理一次
});

// 全局函数，供HTML调用
function selectPlan(planType) {
    if (subscriptionManager) {
        subscriptionManager.selectPlan(planType);
    }
}

function selectPayment(paymentType) {
    if (subscriptionManager) {
        subscriptionManager.selectPayment(paymentType);
    }
}

function subscribeToPlan() {
    if (subscriptionManager) {
        subscriptionManager.subscribeToPlan();
    }
}

function toggleAutoRenewal() {
    if (subscriptionManager) {
        subscriptionManager.toggleAutoRenewal();
    }
}

function cancelSubscription() {
    if (subscriptionManager) {
        subscriptionManager.cancelSubscription();
    }
}

function goBack() {
    if (subscriptionManager) {
        subscriptionManager.resetSelections();
    }
    window.history.back();
}

// 收款码相关函数
function showQRCode(paymentType, amount, planName) {
    console.log('showQRCode 被调用:', { paymentType, amount, planName });
    
    const modal = document.getElementById('qrCodeModal');
    const title = document.getElementById('qrModalTitle');
    const image = document.getElementById('qrCodeImage');
    const amountEl = document.getElementById('paymentAmount');
    const descEl = document.getElementById('paymentDesc');
    
    console.log('模态框元素检查:', { modal: !!modal, title: !!title, image: !!image, amountEl: !!amountEl, descEl: !!descEl });
    
    if (!modal || !title || !image || !amountEl || !descEl) {
        console.error('收款码模态框元素未找到');
        return;
    }
    
    // 设置金额
    amountEl.textContent = `¥${amount}`;
    
    // 设置标题和描述
    if (paymentType === 'wechat') {
        console.log('设置微信支付界面');
        title.textContent = '微信支付';
        descEl.textContent = '请使用微信扫码支付';
        // 使用真实的微信收款码图片
        image.src = 'images/wechat-qr-real.jpg';
        image.alt = '微信收款码';
        
        // 尝试自动跳转到微信支付
        tryOpenWeChatPay(amount, planName);
    } else if (paymentType === 'alipay') {
        console.log('设置支付宝支付界面');
        title.textContent = '支付宝支付';
        descEl.textContent = '请使用支付宝扫码支付';
        // 使用真实的支付宝收款码图片
        image.src = 'images/alipay-qr-real.jpg';
        image.alt = '支付宝收款码';
        
        // 尝试自动跳转到支付宝
        tryOpenAlipay(amount, planName);
    }
    
    // 显示模态框
    console.log('显示支付模态框');
    modal.style.display = 'flex';
    
    // 添加动画类
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
    
    // 添加支付状态提示
    showPaymentStatus('正在等待支付...', 'info');
}

// 尝试打开微信支付
function tryOpenWeChatPay(amount, planName) {
    console.log('tryOpenWeChatPay 被调用:', { amount, planName });
    
    try {
        // 检测是否在微信环境中
        const isWeChat = /MicroMessenger/i.test(navigator.userAgent);
        console.log('微信环境检测:', isWeChat);
        
        if (isWeChat) {
            // 在微信中，可以尝试调用微信支付API
            console.log('检测到微信环境，尝试调用微信支付');
            // 这里需要实际的微信支付配置
        } else {
            // 在其他环境中，尝试打开微信支付链接
            const wechatPayUrl = `weixin://wap/pay?prepayid=wx_prepay_${Date.now()}&package=Sign%3DWXPay&noncestr=${Date.now()}&timestamp=${Math.floor(Date.now() / 1000)}&sign=`;
            
            // 尝试打开微信支付链接
            const link = document.createElement('a');
            link.href = wechatPayUrl;
            link.target = '_blank';
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            console.log('尝试打开微信支付链接');
            
            // 如果是移动端，延迟1.5秒后尝试跳转
            if (isMobile()) {
                setTimeout(() => {
                    console.log('移动端延迟跳转微信');
                    window.location.href = 'weixin://';
                }, 1500);
            }
        }
    } catch (error) {
        console.log('无法自动跳转微信支付，请手动扫码', error);
    }
}

// 尝试打开支付宝
function tryOpenAlipay(amount, planName) {
    try {
        // 检测是否在支付宝环境中
        const isAlipay = /AlipayClient/i.test(navigator.userAgent);
        
        if (isAlipay) {
            // 在支付宝中，可以尝试调用支付宝支付API
            console.log('检测到支付宝环境，尝试调用支付宝支付');
            // 这里需要实际的支付宝支付配置
        } else {
            // 在其他环境中，尝试打开支付宝支付链接
            const alipayUrl = `alipays://platformapi/startapp?saId=10000007&clientVersion=3.7.0.0718&qrcode=https%3A%2F%2Fqr.alipay.com%2F${encodeURIComponent('alipay_qr_code_' + Date.now())}`;
            
            // 尝试打开支付宝支付链接
            const link = document.createElement('a');
            link.href = alipayUrl;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            console.log('尝试打开支付宝支付链接');
        }
    } catch (error) {
        console.log('无法自动跳转支付宝，请手动扫码', error);
    }
}

function closeQRModal() {
    const modal = document.getElementById('qrCodeModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
    
    // 清理支付状态提示
    hidePaymentStatus();
}

// 支付状态提示函数
function showPaymentStatus(message, type = 'info') {
    // 移除现有的状态提示
    hidePaymentStatus();
    
    // 创建状态提示元素
    const statusDiv = document.createElement('div');
    statusDiv.id = 'paymentStatus';
    statusDiv.className = `payment-status payment-status-${type}`;
    statusDiv.innerHTML = `
        <div class="payment-status-content">
            <span class="payment-status-icon">${getStatusIcon(type)}</span>
            <span class="payment-status-message">${message}</span>
        </div>
    `;
    
    // 添加到页面
    document.body.appendChild(statusDiv);
    
    // 添加显示动画
    setTimeout(() => {
        statusDiv.classList.add('show');
    }, 10);
    
    // 自动隐藏（除了loading状态）
    if (type !== 'info') {
        setTimeout(() => {
            hidePaymentStatus();
        }, 3000);
    }
}

function hidePaymentStatus() {
    const existingStatus = document.getElementById('paymentStatus');
    if (existingStatus) {
        existingStatus.classList.remove('show');
        setTimeout(() => {
            if (existingStatus.parentNode) {
                existingStatus.parentNode.removeChild(existingStatus);
            }
        }, 300);
    }
}

function getStatusIcon(type) {
    switch (type) {
        case 'success':
            return '✓';
        case 'error':
            return '✗';
        case 'warning':
            return '⚠';
        case 'info':
        default:
            return '⏳';
    }
}

function confirmPayment() {
    // 检查是否有待处理的支付
    if (window.currentPaymentResolve && window.currentPaymentData) {
        const paymentData = window.currentPaymentData;
        const resolve = window.currentPaymentResolve;
        
        // 清理全局变量
        window.currentPaymentResolve = null;
        window.currentPaymentData = null;
        
        // 显示支付成功状态
        showPaymentStatus('支付成功！正在处理...', 'success');
        
        // 关闭收款码模态框
        closeQRModal();
        
        // 模拟支付成功，调用resolve
        setTimeout(() => {
            resolve({
                success: true,
                transactionId: subscriptionManager ? subscriptionManager.generateTransactionId() : 'TXN' + Date.now(),
                paymentData: paymentData,
                timestamp: new Date().toISOString()
            });
        }, 1000);
        
        return;
    }
    
    // 兜底处理
    if (subscriptionManager) {
        showPaymentStatus('正在处理支付...', 'info');
        
        // 模拟支付成功
        const paymentData = subscriptionManager.preparePaymentData();
        if (paymentData) {
            subscriptionManager.processPayment(paymentData).then(result => {
                if (result.success) {
                    showPaymentStatus('支付成功！订阅已激活', 'success');
                    subscriptionManager.showMessage('支付成功！订阅已激活', 'success');
                } else {
                    showPaymentStatus('支付处理失败，请重试', 'error');
                    subscriptionManager.showMessage('支付处理失败，请重试', 'error');
                }
            }).catch(error => {
                console.error('支付处理错误:', error);
                showPaymentStatus('支付处理出错，请重试', 'error');
                subscriptionManager.showMessage('支付处理出错，请重试', 'error');
            });
        }
    }
}

// 检测是否为移动设备
function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// 支付方式点击处理
function handlePaymentMethod(method) {
    // 获取当前选择的计划和价格信息
    const selectedPlan = subscriptionManager ? subscriptionManager.selectedPlan : null;
    const planPrices = {
        'basic': 19,
        'premium': 39,
        'annual': 299
    };
    const planNames = {
        'basic': 'VIP基础版',
        'premium': 'VIP高级版',
        'annual': 'VIP年度版'
    };
    
    const amount = selectedPlan ? planPrices[selectedPlan] : 0;
    const planName = selectedPlan ? planNames[selectedPlan] : '订阅计划';
    
    if (method === 'wechat') {
        showQRCode('wechat', amount, planName);
        // 在移动端自动尝试跳转到微信
        if (isMobile()) {
            setTimeout(() => {
                // 尝试打开微信支付
                const wechatUrl = 'weixin://';
                window.location.href = wechatUrl;
            }, 1500);
        }
    } else if (method === 'alipay') {
        showQRCode('alipay', amount, planName);
        // 在移动端自动尝试跳转到支付宝
        if (isMobile()) {
            setTimeout(() => {
                // 尝试打开支付宝支付
                const alipayUrl = 'alipays://';
                window.location.href = alipayUrl;
            }, 1500);
        }
    }
}

// 全局导出
if (typeof window !== 'undefined') {
    window.SubscriptionManager = SubscriptionManager;
    window.subscriptionManager = subscriptionManager;
    window.showQRCode = showQRCode;
    window.closeQRModal = closeQRModal;
    window.confirmPayment = confirmPayment;
    window.tryOpenWeChatPay = tryOpenWeChatPay;
    window.tryOpenAlipay = tryOpenAlipay;
    window.isMobile = isMobile;
    window.handlePaymentMethod = handlePaymentMethod;
    window.toggleComparison = toggleComparison;
}

/**
 * 切换功能对比表显示/隐藏
 */
function toggleComparison() {
    const table = document.getElementById('comparisonTable');
    const toggleText = document.getElementById('toggleText');
    const toggleIcon = document.getElementById('toggleIcon');
    
    if (table.style.display === 'none') {
        table.style.display = 'block';
        toggleText.textContent = '隐藏详细对比';
        toggleIcon.classList.remove('fa-chevron-down');
        toggleIcon.classList.add('fa-chevron-up');
    } else {
        table.style.display = 'none';
        toggleText.textContent = '查看详细对比';
        toggleIcon.classList.remove('fa-chevron-up');
        toggleIcon.classList.add('fa-chevron-down');
    }
}