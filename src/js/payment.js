/**
 * 支付管理器
 * 负责支付流程、表单验证、API集成和安全处理
 */
class PaymentManager {
    constructor() {
        this.selectedPlan = null;
        this.selectedMethod = 'alipay';
        this.selectedDonation = null;
        this.currentTab = 'subscription';
        this.isProcessing = false;
        
        // 支付配置
        this.config = {
            apiEndpoint: '/api/payment',
            timeout: 30000,
            retryAttempts: 3
        };

        // 计划价格映射
        this.planPrices = {
            basic: 19,
            premium: 39,
            annual: 299
        };

        this.init();
    }

    /**
     * 初始化支付管理器
     */
    init() {
        this.setupEventListeners();
        this.initializeCardFormatting();
        this.updatePayButton();
        this.displayMembershipStatus(); // 显示会员状态
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 选项卡切换
        document.querySelectorAll('.payment-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // 计划选择
        document.querySelectorAll('.plan-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const planCard = e.currentTarget;
                if (planCard.dataset.plan) {
                    this.selectPlan(planCard.dataset.plan);
                } else if (planCard.dataset.donation) {
                    this.selectDonation(planCard.dataset.donation);
                }
            });
        });

        // 支付方式选择
        document.querySelectorAll('.payment-method').forEach(method => {
            method.addEventListener('click', (e) => {
                this.selectPaymentMethod(e.currentTarget.dataset.method);
            });
        });

        // 支付按钮
        document.getElementById('pay-button').addEventListener('click', () => {
            this.processPayment();
        });

        // 自定义捐赠金额
        document.getElementById('donation-amount')?.addEventListener('input', (e) => {
            this.updateDonationAmount(e.target.value);
        });

        // 表单验证
        this.setupFormValidation();
    }

    /**
     * 切换选项卡
     */
    switchTab(tabName) {
        this.currentTab = tabName;
        
        // 更新选项卡状态
        document.querySelectorAll('.payment-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // 更新内容区域
        document.querySelectorAll('.payment-section').forEach(section => {
            section.classList.toggle('active', section.id === tabName);
        });

        // 重置选择状态
        this.resetSelections();
        this.updatePayButton();
    }

    /**
     * 选择计划
     */
    selectPlan(planType) {
        this.selectedPlan = planType;
        this.selectedDonation = null;

        // 更新UI状态
        document.querySelectorAll('.plan-card').forEach(card => {
            card.classList.toggle('selected', card.dataset.plan === planType);
        });

        // 更新摘要
        this.updatePaymentSummary();
        this.updatePayButton();
    }

    /**
     * 选择捐赠
     */
    selectDonation(donationType) {
        this.selectedDonation = donationType;
        this.selectedPlan = null;

        // 更新UI状态
        document.querySelectorAll('.plan-card').forEach(card => {
            card.classList.toggle('selected', card.dataset.donation === donationType);
        });

        // 显示/隐藏自定义金额输入
        const customAmountDiv = document.getElementById('custom-amount');
        if (donationType === 'custom') {
            customAmountDiv.style.display = 'block';
            document.getElementById('donation-amount').focus();
        } else {
            customAmountDiv.style.display = 'none';
        }

        this.updatePaymentSummary();
        this.updatePayButton();
    }

    /**
     * 选择支付方式
     */
    selectPaymentMethod(method) {
        this.selectedMethod = method;

        // 更新UI状态
        document.querySelectorAll('.payment-method').forEach(methodEl => {
            methodEl.classList.toggle('selected', methodEl.dataset.method === method);
        });

        // 显示/隐藏银行卡表单
        const cardForm = document.getElementById('card-form');
        if (method === 'card') {
            cardForm.style.display = 'block';
        } else {
            cardForm.style.display = 'none';
        }

        this.updatePaymentSummary();
    }

    /**
     * 更新捐赠金额
     */
    updateDonationAmount(amount) {
        if (this.selectedDonation === 'custom') {
            this.customDonationAmount = parseFloat(amount) || 0;
            this.updatePaymentSummary();
            this.updatePayButton();
        }
    }

    /**
     * 更新支付摘要
     */
    updatePaymentSummary() {
        const selectedPlanEl = document.getElementById('selected-plan');
        const selectedMethodEl = document.getElementById('selected-method');
        const totalAmountEl = document.getElementById('total-amount');

        let planText = '请选择计划';
        let amount = 0;

        if (this.currentTab === 'subscription' && this.selectedPlan) {
            const planNames = {
                basic: '基础版 (¥19/月)',
                premium: '高级版 (¥39/月)',
                annual: '年度版 (¥299/年)'
            };
            planText = planNames[this.selectedPlan];
            amount = this.planPrices[this.selectedPlan];
        } else if (this.currentTab === 'donation' && this.selectedDonation) {
            if (this.selectedDonation === 'custom') {
                planText = `自定义捐赠 (¥${this.customDonationAmount || 0})`;
                amount = this.customDonationAmount || 0;
            } else {
                planText = `捐赠支持 (¥${this.selectedDonation})`;
                amount = parseInt(this.selectedDonation);
            }
        }

        const methodNames = {
            alipay: '支付宝',
            wechat: '微信支付',
            card: '银行卡',
            paypal: 'PayPal'
        };

        selectedPlanEl.textContent = planText;
        selectedMethodEl.textContent = methodNames[this.selectedMethod];
        totalAmountEl.textContent = `¥${amount}`;
    }

    /**
     * 更新支付按钮状态
     */
    updatePayButton() {
        const payButton = document.getElementById('pay-button');
        const buttonText = document.getElementById('button-text');
        
        let isEnabled = false;
        let text = '请选择计划';

        if (this.currentTab === 'subscription' && this.selectedPlan) {
            isEnabled = true;
            text = `支付 ¥${this.planPrices[this.selectedPlan]}`;
        } else if (this.currentTab === 'donation' && this.selectedDonation) {
            if (this.selectedDonation === 'custom') {
                isEnabled = this.customDonationAmount > 0;
                text = isEnabled ? `捐赠 ¥${this.customDonationAmount}` : '请输入金额';
            } else {
                isEnabled = true;
                text = `捐赠 ¥${this.selectedDonation}`;
            }
        }

        // 如果选择银行卡支付，需要验证表单
        if (isEnabled && this.selectedMethod === 'card') {
            isEnabled = this.validateCardForm();
        }

        payButton.disabled = !isEnabled || this.isProcessing;
        buttonText.textContent = text;
    }

    /**
     * 重置选择状态
     */
    resetSelections() {
        this.selectedPlan = null;
        this.selectedDonation = null;
        this.customDonationAmount = 0;

        document.querySelectorAll('.plan-card').forEach(card => {
            card.classList.remove('selected');
        });

        document.getElementById('custom-amount').style.display = 'none';
        document.getElementById('donation-amount').value = '';
    }

    /**
     * 初始化银行卡格式化
     */
    initializeCardFormatting() {
        const cardNumberInput = document.getElementById('card-number');
        const expiryInput = document.getElementById('expiry-date');
        const cvvInput = document.getElementById('cvv');

        if (cardNumberInput) {
            cardNumberInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\s/g, '').replace(/[^0-9]/gi, '');
                let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
                e.target.value = formattedValue;
                this.updatePayButton();
            });
        }

        if (expiryInput) {
            expiryInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length >= 2) {
                    value = value.substring(0, 2) + '/' + value.substring(2, 4);
                }
                e.target.value = value;
                this.updatePayButton();
            });
        }

        if (cvvInput) {
            cvvInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/[^0-9]/g, '');
                this.updatePayButton();
            });
        }
    }

    /**
     * 设置表单验证
     */
    setupFormValidation() {
        const inputs = document.querySelectorAll('.form-input');
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.validateField(input);
            });
            input.addEventListener('input', () => {
                this.clearFieldError(input);
                this.updatePayButton();
            });
        });
    }

    /**
     * 验证单个字段
     */
    validateField(field) {
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';

        switch (field.id) {
            case 'cardholder-name':
                isValid = value.length >= 2;
                errorMessage = '请输入有效的持卡人姓名';
                break;
            case 'card-number':
                isValid = value.replace(/\s/g, '').length >= 13;
                errorMessage = '请输入有效的卡号';
                break;
            case 'expiry-date':
                isValid = /^\d{2}\/\d{2}$/.test(value) && this.isValidExpiryDate(value);
                errorMessage = '请输入有效的有效期';
                break;
            case 'cvv':
                isValid = value.length >= 3;
                errorMessage = '请输入有效的CVV';
                break;
        }

        if (!isValid) {
            this.showFieldError(field, errorMessage);
        } else {
            this.clearFieldError(field);
        }

        return isValid;
    }

    /**
     * 验证有效期
     */
    isValidExpiryDate(expiry) {
        const [month, year] = expiry.split('/').map(num => parseInt(num));
        const now = new Date();
        const currentYear = now.getFullYear() % 100;
        const currentMonth = now.getMonth() + 1;

        return month >= 1 && month <= 12 && 
               (year > currentYear || (year === currentYear && month >= currentMonth));
    }

    /**
     * 显示字段错误
     */
    showFieldError(field, message) {
        field.style.borderColor = '#ef5350';
        // 可以添加更多错误显示逻辑
    }

    /**
     * 清除字段错误
     */
    clearFieldError(field) {
        field.style.borderColor = '#e0e0e0';
    }

    /**
     * 验证银行卡表单
     */
    validateCardForm() {
        if (this.selectedMethod !== 'card') return true;

        const cardholderName = document.getElementById('cardholder-name')?.value.trim();
        const cardNumber = document.getElementById('card-number')?.value.replace(/\s/g, '');
        const expiryDate = document.getElementById('expiry-date')?.value;
        const cvv = document.getElementById('cvv')?.value;

        return cardholderName && cardholderName.length >= 2 &&
               cardNumber && cardNumber.length >= 13 &&
               expiryDate && /^\d{2}\/\d{2}$/.test(expiryDate) && this.isValidExpiryDate(expiryDate) &&
               cvv && cvv.length >= 3;
    }

    /**
     * 处理支付
     */
    async processPayment() {
        if (this.isProcessing) return;

        this.isProcessing = true;
        this.showLoading(true);
        this.hideMessages();

        try {
            // 准备支付数据
            const paymentData = this.preparePaymentData();
            
            // 安全验证
            const securityManager = window.getSecurityManager();
            if (securityManager) {
                // 检查速率限制
                securityManager.checkRateLimit();
                
                // 验证请求来源
                securityManager.validateRequestOrigin();
                
                // 添加时间戳防止重放攻击
                paymentData.timestamp = Date.now();
                
                // 验证支付数据
                securityManager.validatePaymentData(paymentData);
                
                // 加密敏感数据
                if (paymentData.cardInfo) {
                    paymentData.cardInfo = securityManager.encryptSensitiveData(paymentData.cardInfo);
                }
                
                // 添加CSRF令牌
                paymentData.csrfToken = securityManager.getCSRFToken();
            }
            
            // 验证支付数据
            if (!this.validatePaymentData(paymentData)) {
                throw new Error('支付信息验证失败');
            }

            // 如果是银行卡支付，验证表单
            if (this.selectedMethod === 'card' && !this.validateCardForm()) {
                return;
            }

            // 生成支付ID
            const paymentId = this.generatePaymentId();
            paymentData.paymentId = paymentId;

            // 根据支付方式处理
            if (this.selectedMethod === 'wechat') {
                // 保存支付信息
                this.savePaymentInfo(paymentData);
                
                // 开始支付状态检测
                this.startPaymentStatusCheck(paymentData.paymentId);
                
                this.handleWechatPayment(paymentData);
            } else if (this.selectedMethod === 'alipay') {
                // 保存支付信息
                this.savePaymentInfo(paymentData);
                
                // 开始支付状态检测
                this.startPaymentStatusCheck(paymentData.paymentId);
                
                this.handleAlipayPayment(paymentData);
            } else {
                // 其他支付方式的原有逻辑
                const result = await this.sendPaymentRequest(paymentData);
                
                // 处理支付结果
                await this.handlePaymentResult(result);
            }
            
            // 重置失败尝试计数
            if (securityManager) {
                securityManager.resetFailedAttempts();
            }

        } catch (error) {
            console.error('支付处理失败:', error);
            
            // 记录失败尝试
            const securityManager = window.getSecurityManager();
            if (securityManager && error instanceof window.SecurityError) {
                securityManager.recordFailedAttempt();
            }
            
            this.showError(error.message || '支付处理失败，请重试');
        } finally {
            this.isProcessing = false;
            this.showLoading(false);
        }
    }

    /**
     * 生成支付ID
     */
    generatePaymentId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        return `PAY_${timestamp}_${random}`;
    }

    /**
     * 处理微信支付
     */
    handleWechatPayment(paymentData) {
        // 保存支付信息到本地存储
        this.savePaymentInfo(paymentData);
        
        // 直接跳转到微信收款码页面
        window.open('images/wechat-qr-real.jpg', '_blank');
        
        // 显示支付状态提示
        this.showPaymentStatusMessage('微信支付', paymentData);
        
        // 开始监听支付状态
        this.startPaymentStatusCheck(paymentData.paymentId);
    }

    /**
     * 处理支付宝支付
     */
    handleAlipayPayment(paymentData) {
        // 保存支付信息到本地存储
        this.savePaymentInfo(paymentData);
        
        // 直接跳转到支付宝收款码页面
        window.open('images/alipay-qr-real.jpg', '_blank');
        
        // 显示支付状态提示
        this.showPaymentStatusMessage('支付宝支付', paymentData);
        
        // 开始监听支付状态
        this.startPaymentStatusCheck(paymentData.paymentId);
    }

    /**
     * 显示支付状态消息
     */
    showPaymentStatusMessage(paymentMethod, paymentData) {
        // 创建状态提示弹窗
        const statusModal = document.createElement('div');
        statusModal.className = 'payment-status-modal';
        statusModal.innerHTML = `
            <div class="status-modal-content">
                <div class="status-modal-header">
                    <h3>${paymentMethod}支付</h3>
                    <button class="status-close-btn" onclick="this.closest('.payment-status-modal').remove()">×</button>
                </div>
                <div class="status-modal-body">
                    <div class="payment-details">
                        <p><strong>支付金额：</strong>¥${paymentData.amount}</p>
                        <p><strong>支付ID：</strong>${paymentData.paymentId}</p>
                        <p><strong>订单描述：</strong>${paymentData.description}</p>
                    </div>
                    <div class="payment-instructions">
                        <p class="instruction-text">收款码已在新窗口中打开，请使用${paymentMethod}扫码完成支付</p>
                        <div class="status-indicator">
                            <div class="loading-dots">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                            <p>等待支付确认中...</p>
                        </div>
                    </div>
                </div>
                <div class="status-modal-footer">
                    <button class="btn-secondary" onclick="this.closest('.payment-status-modal').remove()">取消支付</button>
                    <button class="btn-primary" onclick="window.paymentManager.checkPaymentManually('${paymentData.paymentId}')">我已完成支付</button>
                </div>
            </div>
        `;

        // 添加样式
        if (!document.querySelector('#status-modal-styles')) {
            const styles = document.createElement('style');
            styles.id = 'status-modal-styles';
            styles.textContent = `
                .payment-status-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.5);
                    z-index: 10000;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }
                
                .payment-status-modal.show {
                    opacity: 1;
                }
                
                .status-modal-content {
                    background: white;
                    border-radius: 15px;
                    width: 90%;
                    max-width: 450px;
                    transform: translateY(20px);
                    transition: transform 0.3s ease;
                }
                
                .payment-status-modal.show .status-modal-content {
                    transform: translateY(0);
                }
                
                .status-modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px;
                    border-bottom: 1px solid #f0f0f0;
                }
                
                .status-modal-header h3 {
                    margin: 0;
                    font-size: 18px;
                    font-weight: 600;
                    color: #333;
                }
                
                .status-close-btn {
                    background: none;
                    border: none;
                    font-size: 24px;
                    color: #666;
                    cursor: pointer;
                    padding: 5px;
                    border-radius: 50%;
                    transition: background-color 0.2s;
                }
                
                .status-close-btn:hover {
                    background-color: #f5f5f5;
                }
                
                .status-modal-body {
                    padding: 20px;
                }
                
                .payment-details {
                    background: #f8f9fa;
                    border-radius: 8px;
                    padding: 15px;
                    margin-bottom: 20px;
                }
                
                .payment-details p {
                    margin: 8px 0;
                    font-size: 14px;
                    color: #333;
                }
                
                .payment-instructions {
                    text-align: center;
                }
                
                .instruction-text {
                    font-size: 16px;
                    color: #333;
                    margin-bottom: 20px;
                    line-height: 1.5;
                }
                
                .status-indicator {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 10px;
                }
                
                .loading-dots {
                    display: flex;
                    gap: 4px;
                }
                
                .loading-dots span {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: #667eea;
                    animation: loadingDots 1.4s ease-in-out infinite both;
                }
                
                .loading-dots span:nth-child(1) { animation-delay: -0.32s; }
                .loading-dots span:nth-child(2) { animation-delay: -0.16s; }
                
                @keyframes loadingDots {
                    0%, 80%, 100% { transform: scale(0); }
                    40% { transform: scale(1); }
                }
                
                .status-modal-footer {
                    display: flex;
                    gap: 10px;
                    padding: 20px;
                    border-top: 1px solid #f0f0f0;
                }
                
                .status-modal-footer .btn-secondary,
                .status-modal-footer .btn-primary {
                    flex: 1;
                    padding: 12px 20px;
                    border: none;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .status-modal-footer .btn-secondary {
                    background: #f8f9fa;
                    color: #666;
                    border: 1px solid #ddd;
                }
                
                .status-modal-footer .btn-secondary:hover {
                    background: #e9ecef;
                }
                
                .status-modal-footer .btn-primary {
                    background: #667eea;
                    color: white;
                }
                
                .status-modal-footer .btn-primary:hover {
                    background: #5a6fd8;
                }
            `;
            document.head.appendChild(styles);
        }

        document.body.appendChild(statusModal);
        
        // 添加动画效果
        setTimeout(() => {
            statusModal.classList.add('show');
        }, 10);
    }

    /**
     * 显示微信收款码弹窗
     */
    showWechatQRCode(paymentData) {
        const modal = this.createQRCodeModal('微信支付', paymentData);
        
        // 设置微信收款码图片
        const qrImage = modal.querySelector('.qr-code-image');
        qrImage.src = 'images/wechat-qr-real.jpg';
        qrImage.alt = '微信收款码';
        
        // 显示支付信息
        const paymentInfo = modal.querySelector('.payment-info');
        paymentInfo.innerHTML = `
            <p><strong>支付金额：</strong>¥${paymentData.amount}</p>
            <p><strong>支付ID：</strong>${paymentData.paymentId}</p>
            <p><strong>订单描述：</strong>${paymentData.description}</p>
            <p class="payment-tip">请使用微信扫描上方二维码完成支付</p>
        `;
        
        document.body.appendChild(modal);
        
        // 添加动画效果
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    }

    /**
     * 显示支付宝收款码弹窗
     */
    showAlipayQRCode(paymentData) {
        const modal = this.createQRCodeModal('支付宝支付', paymentData);
        
        // 设置支付宝收款码图片
        const qrImage = modal.querySelector('.qr-code-image');
        qrImage.src = 'images/alipay-qr-real.jpg';
        qrImage.alt = '支付宝收款码';
        
        // 显示支付信息
        const paymentInfo = modal.querySelector('.payment-info');
        paymentInfo.innerHTML = `
            <p><strong>支付金额：</strong>¥${paymentData.amount}</p>
            <p><strong>支付ID：</strong>${paymentData.paymentId}</p>
            <p><strong>订单描述：</strong>${paymentData.description}</p>
            <p class="payment-tip">请使用支付宝扫描上方二维码完成支付</p>
        `;
        
        document.body.appendChild(modal);
        
        // 添加动画效果
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    }

    /**
     * 创建收款码弹窗
     */
    createQRCodeModal(title, paymentData) {
        const modal = document.createElement('div');
        modal.className = 'qr-payment-modal';
        modal.innerHTML = `
            <div class="qr-modal-content">
                <div class="qr-modal-header">
                    <h3>${title}</h3>
                    <button class="qr-close-btn" onclick="this.closest('.qr-payment-modal').remove()">×</button>
                </div>
                <div class="qr-modal-body">
                    <div class="qr-code-container">
                        <img class="qr-code-image" src="" alt="收款码">
                    </div>
                    <div class="payment-info"></div>
                    <div class="payment-status">
                        <div class="status-indicator">
                            <div class="loading-dots">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                            <p>等待支付中...</p>
                        </div>
                    </div>
                </div>
                <div class="qr-modal-footer">
                    <button class="btn-secondary" onclick="this.closest('.qr-payment-modal').remove()">取消支付</button>
                    <button class="btn-primary" onclick="window.paymentManager.checkPaymentManually('${paymentData.paymentId}')">我已完成支付</button>
                </div>
            </div>
        `;
        
        // 添加样式
        if (!document.querySelector('#qr-modal-styles')) {
            const styles = document.createElement('style');
            styles.id = 'qr-modal-styles';
            styles.textContent = `
                .qr-payment-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.5);
                    z-index: 10000;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }
                
                .qr-payment-modal.show {
                    opacity: 1;
                }
                
                .qr-modal-content {
                    background: white;
                    border-radius: 15px;
                    width: 90%;
                    max-width: 400px;
                    max-height: 80vh;
                    overflow-y: auto;
                    transform: translateY(20px);
                    transition: transform 0.3s ease;
                }
                
                .qr-payment-modal.show .qr-modal-content {
                    transform: translateY(0);
                }
                
                .qr-modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px;
                    border-bottom: 1px solid #f0f0f0;
                }
                
                .qr-modal-header h3 {
                    margin: 0;
                    font-size: 18px;
                    font-weight: 600;
                }
                
                .qr-close-btn {
                    background: none;
                    border: none;
                    font-size: 24px;
                    color: #666;
                    cursor: pointer;
                    padding: 5px;
                    border-radius: 50%;
                    transition: background-color 0.2s;
                }
                
                .qr-close-btn:hover {
                    background-color: #f0f0f0;
                }
                
                .qr-modal-body {
                    padding: 20px;
                    text-align: center;
                }
                
                .qr-code-container {
                    margin-bottom: 20px;
                }
                
                .qr-code-image {
                    width: 200px;
                    height: 200px;
                    border: 1px solid #e0e0e0;
                    border-radius: 10px;
                    object-fit: cover;
                }
                
                .payment-info {
                    background: #f8f9fa;
                    border-radius: 10px;
                    padding: 15px;
                    margin-bottom: 20px;
                    text-align: left;
                }
                
                .payment-info p {
                    margin: 5px 0;
                    font-size: 14px;
                }
                
                .payment-tip {
                    color: #666;
                    font-style: italic;
                }
                
                .payment-status {
                    margin: 20px 0;
                }
                
                .status-indicator {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 10px;
                }
                
                .loading-dots {
                    display: flex;
                    gap: 5px;
                }
                
                .loading-dots span {
                    width: 8px;
                    height: 8px;
                    background: #667eea;
                    border-radius: 50%;
                    animation: loadingDots 1.4s infinite ease-in-out both;
                }
                
                .loading-dots span:nth-child(1) { animation-delay: -0.32s; }
                .loading-dots span:nth-child(2) { animation-delay: -0.16s; }
                
                @keyframes loadingDots {
                    0%, 80%, 100% { transform: scale(0); }
                    40% { transform: scale(1); }
                }
                
                .qr-modal-footer {
                    display: flex;
                    gap: 10px;
                    padding: 20px;
                    border-top: 1px solid #f0f0f0;
                }
                
                .btn-secondary, .btn-primary {
                    flex: 1;
                    padding: 12px 20px;
                    border: none;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .btn-secondary {
                    background: #f8f9fa;
                    color: #495057;
                    border: 1px solid #dee2e6;
                }
                
                .btn-secondary:hover {
                    background: #e9ecef;
                }
                
                .btn-primary {
                    background: #667eea;
                    color: white;
                }
                
                .btn-primary:hover {
                    background: #5a6fd8;
                }
            `;
            document.head.appendChild(styles);
        }
        
        return modal;
    }
    /**
     * 保存支付信息到本地存储
     */
    savePaymentInfo(paymentData) {
        const paymentInfo = {
            ...paymentData,
            timestamp: Date.now(),
            status: 'pending'
        };
        
        // 保存到localStorage
        localStorage.setItem(`payment_${paymentData.paymentId}`, JSON.stringify(paymentInfo));
        
        // 保存到支付历史
        const paymentHistory = this.getPaymentHistory();
        paymentHistory.push(paymentInfo);
        localStorage.setItem('payment_history', JSON.stringify(paymentHistory));
    }

    /**
     * 开始支付状态检测
     */
    startPaymentStatusCheck(paymentId) {
        // 每5秒检查一次支付状态
        const checkInterval = setInterval(async () => {
            try {
                const status = await this.checkPaymentStatus(paymentId);
                if (status === 'success') {
                    clearInterval(checkInterval);
                    this.handlePaymentSuccess(paymentId);
                } else if (status === 'failed') {
                    clearInterval(checkInterval);
                    this.handlePaymentFailure(paymentId);
                }
            } catch (error) {
                console.error('支付状态检查失败:', error);
            }
        }, 5000);

        // 30分钟后停止检查
        setTimeout(() => {
            clearInterval(checkInterval);
        }, 30 * 60 * 1000);
    }

    /**
     * 检查支付状态
     */
    async checkPaymentStatus(paymentId) {
        try {
            // 模拟API调用检查支付状态
            // 在实际应用中，这里应该调用后端API
            const response = await fetch(`/api/payment/status/${paymentId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const result = await response.json();
                return result.status;
            } else {
                // 如果API不可用，检查本地存储的模拟状态
                return this.checkLocalPaymentStatus(paymentId);
            }
        } catch (error) {
            // 网络错误时，检查本地存储
            return this.checkLocalPaymentStatus(paymentId);
        }
    }

    /**
     * 检查本地支付状态（模拟）
     */
    checkLocalPaymentStatus(paymentId) {
        const localStatus = localStorage.getItem(`payment_status_${paymentId}`);
        return localStatus || 'pending';
    }

    /**
     * 手动检查支付状态
     */
    async checkPaymentManually(paymentId) {
        try {
            const status = await this.checkPaymentStatus(paymentId);
            if (status === 'success') {
                this.handlePaymentSuccess(paymentId);
            } else {
                // 显示确认对话框
                const confirmed = confirm('系统暂未检测到您的支付，如果您已完成支付，请点击确定。我们会在24小时内为您手动开通会员。');
                if (confirmed) {
                    this.handleManualPaymentConfirmation(paymentId);
                }
            }
        } catch (error) {
            this.showError('支付状态检查失败，请稍后重试');
        }
    }

    /**
     * 处理支付成功
     */
    handlePaymentSuccess(paymentId) {
        // 更新支付状态
        this.updatePaymentStatus(paymentId, 'success');
        
        // 开通会员
        this.activateMembership(paymentId);
        
        // 关闭支付弹窗
        const modal = document.querySelector('.qr-payment-modal');
        if (modal) {
            modal.remove();
        }
        
        // 显示成功消息
        this.showSuccess('支付成功！会员已开通');
        
        // 跳转到成功页面
        setTimeout(() => {
            this.redirectToSuccess();
        }, 2000);
    }

    /**
     * 处理支付失败
     */
    handlePaymentFailure(paymentId) {
        this.updatePaymentStatus(paymentId, 'failed');
        
        const modal = document.querySelector('.qr-payment-modal');
        if (modal) {
            modal.remove();
        }
        
        this.showError('支付失败，请重试');
    }

    /**
     * 处理手动支付确认
     */
    handleManualPaymentConfirmation(paymentId) {
        // 标记为待审核状态
        this.updatePaymentStatus(paymentId, 'pending_review');
        
        // 关闭弹窗
        const modal = document.querySelector('.qr-payment-modal');
        if (modal) {
            modal.remove();
        }
        
        // 显示提示消息
        this.showSuccess('您的支付确认已提交，我们会在24小时内为您开通会员');
        
        // 发送通知给管理员（模拟）
        this.notifyAdminForManualReview(paymentId);
    }

    /**
     * 更新支付状态
     */
    updatePaymentStatus(paymentId, status) {
        // 更新本地存储
        localStorage.setItem(`payment_status_${paymentId}`, status);
        
        // 更新支付信息
        const paymentInfo = localStorage.getItem(`payment_${paymentId}`);
        if (paymentInfo) {
            const data = JSON.parse(paymentInfo);
            data.status = status;
            data.updatedAt = Date.now();
            localStorage.setItem(`payment_${paymentId}`, JSON.stringify(data));
        }
    }

    /**
     * 开通会员
     */
    activateMembership(paymentId) {
        const paymentInfo = localStorage.getItem(`payment_${paymentId}`);
        if (!paymentInfo) return;

        const data = JSON.parse(paymentInfo);
        const membershipData = {
            paymentId: paymentId,
            plan: data.plan || data.donationType,
            amount: data.amount,
            startDate: new Date().toISOString(),
            status: 'active'
        };

        // 根据计划类型设置到期时间
        if (data.plan === 'annual') {
            membershipData.endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
        } else if (data.plan === 'premium' || data.plan === 'basic') {
            membershipData.endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        }

        // 保存会员信息
        localStorage.setItem('membership_info', JSON.stringify(membershipData));
        localStorage.setItem('user_membership_status', 'active');
        
        // 触发会员状态更新事件
        window.dispatchEvent(new CustomEvent('membershipUpdated', { detail: membershipData }));
    }

    /**
     * 通知管理员进行手动审核
     */
    notifyAdminForManualReview(paymentId) {
        // 在实际应用中，这里应该发送通知给管理员
        console.log(`管理员通知：支付ID ${paymentId} 需要手动审核`);
        
        // 可以发送邮件或推送通知
        // 这里只是模拟保存到待审核列表
        const pendingReviews = JSON.parse(localStorage.getItem('pending_reviews') || '[]');
        pendingReviews.push({
            paymentId: paymentId,
            timestamp: Date.now(),
            status: 'pending'
        });
        localStorage.setItem('pending_reviews', JSON.stringify(pendingReviews));
    }

    preparePaymentData() {
        const data = {
            type: this.currentTab,
            method: this.selectedMethod,
            timestamp: Date.now(),
            userAgent: navigator.userAgent
        };

        if (this.currentTab === 'subscription') {
            data.plan = this.selectedPlan;
            data.amount = this.planPrices[this.selectedPlan];
            data.description = `订阅${data.plan}计划`;
        } else if (this.currentTab === 'donation') {
            data.donationType = this.selectedDonation;
            data.amount = this.selectedDonation === 'custom' ? 
                         this.customDonationAmount : 
                         parseInt(this.selectedDonation);
            data.description = `捐赠支持 ¥${data.amount}`;
        }

        // 如果是银行卡支付，添加卡片信息（加密处理）
        if (this.selectedMethod === 'card') {
            data.cardInfo = this.getEncryptedCardInfo();
        }

        return data;
    }

    /**
     * 检查会员状态
     */
    checkMembershipStatus() {
        const membershipInfo = localStorage.getItem('membership_info');
        const membershipStatus = localStorage.getItem('user_membership_status');
        
        if (membershipInfo && membershipStatus === 'active') {
            const data = JSON.parse(membershipInfo);
            const endDate = new Date(data.endDate);
            const now = new Date();
            
            if (endDate > now) {
                return {
                    isActive: true,
                    plan: data.plan,
                    endDate: data.endDate,
                    paymentId: data.paymentId
                };
            } else {
                // 会员已过期
                localStorage.setItem('user_membership_status', 'expired');
                return { isActive: false, status: 'expired' };
            }
        }
        
        return { isActive: false, status: 'none' };
    }

    /**
     * 显示会员状态
     */
    displayMembershipStatus() {
        const status = this.checkMembershipStatus();
        const statusElement = document.getElementById('membership-status');
        
        if (statusElement) {
            if (status.isActive) {
                const endDate = new Date(status.endDate).toLocaleDateString();
                statusElement.innerHTML = `
                    <div class="membership-active">
                        <span class="status-badge active">会员已激活</span>
                        <p>计划: ${status.plan}</p>
                        <p>到期时间: ${endDate}</p>
                    </div>
                `;
            } else {
                statusElement.innerHTML = `
                    <div class="membership-inactive">
                        <span class="status-badge inactive">未开通会员</span>
                        <p>开通会员享受更多功能</p>
                    </div>
                `;
            }
        }
    }

    /**
     * 获取加密的卡片信息
     */
    getEncryptedCardInfo() {
        // 注意：实际应用中应该使用真正的加密
        const cardNumber = document.getElementById('card-number').value.replace(/\s/g, '');
        const expiryDate = document.getElementById('expiry-date').value;
        const cvv = document.getElementById('cvv').value;
        const cardholderName = document.getElementById('cardholder-name').value;

        return {
            // 只传输卡号的前6位和后4位用于显示
            maskedNumber: cardNumber.substring(0, 6) + '******' + cardNumber.substring(cardNumber.length - 4),
            expiryMonth: expiryDate.split('/')[0],
            expiryYear: expiryDate.split('/')[1],
            cardholderName: cardholderName,
            // 实际应用中，敏感信息应该在前端加密后传输
            encryptedData: btoa(JSON.stringify({
                number: cardNumber,
                expiry: expiryDate,
                cvv: cvv
            }))
        };
    }

    /**
     * 验证支付数据
     */
    validatePaymentData(data) {
        if (!data.type || !data.method || !data.amount || data.amount <= 0) {
            return false;
        }

        if (data.type === 'subscription' && !data.plan) {
            return false;
        }

        if (data.type === 'donation' && !data.donationType) {
            return false;
        }

        return true;
    }

    /**
     * 发送支付请求
     */
    async sendPaymentRequest(paymentData) {
        // 模拟API调用
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // 模拟不同的支付结果
                const random = Math.random();
                if (random > 0.8) {
                    reject(new Error('网络连接失败，请检查网络后重试'));
                } else if (random > 0.9) {
                    reject(new Error('支付金额超出限制'));
                } else {
                    resolve({
                        success: true,
                        transactionId: 'TXN' + Date.now(),
                        paymentUrl: this.generatePaymentUrl(paymentData),
                        message: '支付请求已创建'
                    });
                }
            }, 2000);
        });

        // 实际的API调用代码：
        /*
        const response = await fetch(this.config.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(paymentData)
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
        */
    }

    /**
     * 生成支付URL
     */
    generatePaymentUrl(paymentData) {
        const baseUrls = {
            alipay: 'https://qr.alipay.com/',
            wechat: 'weixin://wxpay/bizpayurl?',
            paypal: 'https://www.paypal.com/checkoutnow?'
        };

        return baseUrls[paymentData.method] + 'mock_payment_' + Date.now();
    }

    /**
     * 处理支付结果
     */
    async handlePaymentResult(result) {
        if (result.success) {
            if (this.selectedMethod === 'card') {
                // 银行卡支付直接处理
                this.showSuccess('支付成功！感谢您的支持');
                setTimeout(() => {
                    this.redirectToSuccess();
                }, 2000);
            } else {
                // 第三方支付需要跳转
                this.showSuccess('正在跳转到支付页面...');
                setTimeout(() => {
                    window.open(result.paymentUrl, '_blank');
                }, 1000);
            }

            // 记录支付信息
            this.recordPayment(result);
        } else {
            throw new Error(result.message || '支付失败');
        }
    }

    /**
     * 记录支付信息
     */
    recordPayment(result) {
        const paymentRecord = {
            transactionId: result.transactionId,
            type: this.currentTab,
            plan: this.selectedPlan,
            donation: this.selectedDonation,
            method: this.selectedMethod,
            amount: this.getCurrentAmount(),
            timestamp: new Date().toISOString()
        };

        // 保存到本地存储
        const payments = JSON.parse(localStorage.getItem('quittr_payments') || '[]');
        payments.push(paymentRecord);
        localStorage.setItem('quittr_payments', JSON.stringify(payments));
    }

    /**
     * 获取当前金额
     */
    getCurrentAmount() {
        if (this.currentTab === 'subscription' && this.selectedPlan) {
            return this.planPrices[this.selectedPlan];
        } else if (this.currentTab === 'donation' && this.selectedDonation) {
            return this.selectedDonation === 'custom' ? 
                   this.customDonationAmount : 
                   parseInt(this.selectedDonation);
        }
        return 0;
    }

    /**
     * 跳转到成功页面
     */
    redirectToSuccess() {
        // 可以跳转到成功页面或返回主页
        window.location.href = 'index.html?payment=success';
    }

    /**
     * 显示加载状态
     */
    showLoading(show) {
        const spinner = document.getElementById('loading-spinner');
        const button = document.getElementById('pay-button');
        
        if (show) {
            spinner.style.display = 'inline-block';
            button.disabled = true;
        } else {
            spinner.style.display = 'none';
            this.updatePayButton();
        }
    }

    /**
     * 处理支付错误
     */
    handlePaymentError(error) {
        if (error instanceof window.SecurityError) {
            this.showError('安全验证失败，请刷新页面后重试');
        } else if (error.name === 'RateLimitError') {
            this.showError('操作过于频繁，请稍后再试');
        } else {
            this.showError(error.message || '支付处理失败，请重试');
        }
    }

    /**
     * 显示错误消息
     */
    showError(message) {
        const errorEl = document.getElementById('error-message');
        errorEl.textContent = message;
        errorEl.style.display = 'block';
        
        // 自动隐藏
        setTimeout(() => {
            errorEl.style.display = 'none';
        }, 5000);
    }

    /**
     * 显示成功消息
     */
    showSuccess(message) {
        const successEl = document.getElementById('success-message');
        successEl.textContent = message;
        successEl.style.display = 'block';
    }

    /**
     * 隐藏所有消息
     */
    hideMessages() {
        document.getElementById('error-message').style.display = 'none';
        document.getElementById('success-message').style.display = 'none';
    }

    /**
     * 获取支付历史
     */
    getPaymentHistory() {
        return JSON.parse(localStorage.getItem('quittr_payments') || '[]');
    }

    /**
     * 清除支付历史
     */
    clearPaymentHistory() {
        localStorage.removeItem('quittr_payments');
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.payment-container')) {
        window.paymentManager = new PaymentManager();
        
        // 开发模式下的调试信息
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('支付管理器已初始化');
            console.log('支付历史:', window.paymentManager.getPaymentHistory());
        }
    }
});

// 导出到全局作用域
if (typeof window !== 'undefined') {
    window.PaymentManager = PaymentManager;
}