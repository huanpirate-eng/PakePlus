/**
 * 数据验证和输入安全性工具库
 * 提供表单验证、XSS防护、数据清理等功能
 */

window.QuittrValidation = (function() {
    'use strict';

    // XSS防护 - HTML实体编码
    function escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    }

    // 清理和验证文本输入
    function sanitizeText(input, options = {}) {
        if (typeof input !== 'string') {
            return '';
        }

        let cleaned = input.trim();
        
        // 移除危险字符
        if (options.removeDangerous !== false) {
            cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
            cleaned = cleaned.replace(/javascript:/gi, '');
            cleaned = cleaned.replace(/on\w+\s*=/gi, '');
        }

        // 限制长度
        if (options.maxLength) {
            cleaned = cleaned.substring(0, options.maxLength);
        }

        // HTML转义
        if (options.escapeHtml !== false) {
            cleaned = escapeHtml(cleaned);
        }

        return cleaned;
    }

    // 验证邮箱格式
    function validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // 验证手机号格式（中国大陆）
    function validatePhone(phone) {
        const phoneRegex = /^1[3-9]\d{9}$/;
        return phoneRegex.test(phone);
    }

    // 验证密码强度
    function validatePassword(password) {
        const result = {
            isValid: false,
            score: 0,
            feedback: []
        };

        if (!password || password.length < 6) {
            result.feedback.push('密码长度至少6位');
            return result;
        }

        let score = 0;
        
        // 长度检查
        if (password.length >= 8) score += 1;
        if (password.length >= 12) score += 1;

        // 复杂度检查
        if (/[a-z]/.test(password)) score += 1;
        if (/[A-Z]/.test(password)) score += 1;
        if (/\d/.test(password)) score += 1;
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;

        result.score = score;

        if (score < 3) {
            result.feedback.push('密码强度较弱，建议包含大小写字母、数字和特殊字符');
        } else if (score < 5) {
            result.feedback.push('密码强度中等');
            result.isValid = true;
        } else {
            result.feedback.push('密码强度良好');
            result.isValid = true;
        }

        return result;
    }

    // 验证URL格式
    function validateUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    // 表单验证器
    class FormValidator {
        constructor(form, rules = {}) {
            this.form = typeof form === 'string' ? document.querySelector(form) : form;
            this.rules = rules;
            this.errors = {};
            this.init();
        }

        init() {
            if (!this.form) return;

            // 添加实时验证
            this.form.addEventListener('input', (e) => {
                this.validateField(e.target);
            });

            // 添加提交验证
            this.form.addEventListener('submit', (e) => {
                if (!this.validateAll()) {
                    e.preventDefault();
                    this.showErrors();
                }
            });
        }

        validateField(field) {
            const name = field.name;
            const value = field.value;
            const rule = this.rules[name];

            if (!rule) return true;

            const errors = [];

            // 必填验证
            if (rule.required && !value.trim()) {
                errors.push(rule.messages?.required || '此字段为必填项');
            }

            if (value.trim()) {
                // 长度验证
                if (rule.minLength && value.length < rule.minLength) {
                    errors.push(rule.messages?.minLength || `最少需要${rule.minLength}个字符`);
                }
                if (rule.maxLength && value.length > rule.maxLength) {
                    errors.push(rule.messages?.maxLength || `最多允许${rule.maxLength}个字符`);
                }

                // 格式验证
                if (rule.type === 'email' && !validateEmail(value)) {
                    errors.push(rule.messages?.email || '请输入有效的邮箱地址');
                }
                if (rule.type === 'phone' && !validatePhone(value)) {
                    errors.push(rule.messages?.phone || '请输入有效的手机号码');
                }
                if (rule.type === 'url' && !validateUrl(value)) {
                    errors.push(rule.messages?.url || '请输入有效的URL地址');
                }

                // 自定义验证
                if (rule.validator && typeof rule.validator === 'function') {
                    const customResult = rule.validator(value);
                    if (customResult !== true) {
                        errors.push(customResult || '输入格式不正确');
                    }
                }

                // 密码强度验证
                if (rule.type === 'password') {
                    const passwordResult = validatePassword(value);
                    if (!passwordResult.isValid) {
                        errors.push(...passwordResult.feedback);
                    }
                }
            }

            // 更新错误状态
            if (errors.length > 0) {
                this.errors[name] = errors;
                this.showFieldError(field, errors[0]);
                return false;
            } else {
                delete this.errors[name];
                this.clearFieldError(field);
                return true;
            }
        }

        validateAll() {
            let isValid = true;
            this.errors = {};

            // 验证所有字段
            const fields = this.form.querySelectorAll('input, textarea, select');
            fields.forEach(field => {
                if (!this.validateField(field)) {
                    isValid = false;
                }
            });

            return isValid;
        }

        showFieldError(field, message) {
            field.classList.add('error');
            
            // 移除旧的错误提示
            const oldError = field.parentNode.querySelector('.error-message');
            if (oldError) {
                oldError.remove();
            }

            // 添加新的错误提示
            const errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            errorElement.textContent = message;
            field.parentNode.appendChild(errorElement);
        }

        clearFieldError(field) {
            field.classList.remove('error');
            const errorElement = field.parentNode.querySelector('.error-message');
            if (errorElement) {
                errorElement.remove();
            }
        }

        showErrors() {
            // 滚动到第一个错误字段
            const firstErrorField = this.form.querySelector('.error');
            if (firstErrorField) {
                firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
                firstErrorField.focus();
            }
        }

        getErrors() {
            return this.errors;
        }

        clearErrors() {
            this.errors = {};
            const errorFields = this.form.querySelectorAll('.error');
            errorFields.forEach(field => this.clearFieldError(field));
        }
    }

    // 内容过滤器
    function filterContent(content, options = {}) {
        if (!content) return '';

        let filtered = content;

        // 移除恶意脚本
        filtered = filtered.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        
        // 移除危险属性
        filtered = filtered.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
        filtered = filtered.replace(/javascript:/gi, '');
        
        // 允许的HTML标签
        const allowedTags = options.allowedTags || ['p', 'br', 'strong', 'em', 'u', 'a'];
        const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/gi;
        
        filtered = filtered.replace(tagRegex, (match, tagName) => {
            if (allowedTags.includes(tagName.toLowerCase())) {
                return match;
            }
            return '';
        });

        return filtered;
    }

    // 速率限制器
    class RateLimiter {
        constructor(maxRequests = 10, timeWindow = 60000) {
            this.maxRequests = maxRequests;
            this.timeWindow = timeWindow;
            this.requests = new Map();
        }

        isAllowed(identifier) {
            const now = Date.now();
            const userRequests = this.requests.get(identifier) || [];
            
            // 清理过期的请求记录
            const validRequests = userRequests.filter(time => now - time < this.timeWindow);
            
            if (validRequests.length >= this.maxRequests) {
                return false;
            }
            
            validRequests.push(now);
            this.requests.set(identifier, validRequests);
            return true;
        }

        getRemainingRequests(identifier) {
            const now = Date.now();
            const userRequests = this.requests.get(identifier) || [];
            const validRequests = userRequests.filter(time => now - time < this.timeWindow);
            return Math.max(0, this.maxRequests - validRequests.length);
        }
    }

    // 公开API
    return {
        escapeHtml,
        sanitizeText,
        validateEmail,
        validatePhone,
        validatePassword,
        validateUrl,
        filterContent,
        FormValidator,
        RateLimiter
    };
})();