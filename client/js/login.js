/*
 * @Author: aurson jassimxiong@gmail.com
 * @Date: 2025-09-14 17:33:37
 * @LastEditors: aurson jassimxiong@gmail.com
 * @LastEditTime: 2025-11-09
 * @Description:
 *        ___ ___ _________ ___  ___ 
 *       / _ `/ // / __(_-</ _ \/ _ \
 *       \_,_/\_,_/_/ /___/\___/_//_/
 *      
 * Copyright (c) 2025 by Aurson, All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// 简单的消息显示函数（因为登录页面不加载 common.js）
function showMessage(message, type = 'info') {
    const existingMessage = document.querySelector('.message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.style.animation = 'messageSlideOut 0.3s ease forwards';
        setTimeout(() => messageDiv.remove(), 300);
    }, 3000);
}

// 输入验证函数
function validateInput(input) {
    const formGroup = input.closest('.form-group');
    if (input.value.trim() === '') {
        formGroup.classList.add('error');
        formGroup.classList.remove('success');
        return false;
    } else {
        formGroup.classList.remove('error');
        formGroup.classList.add('success');
        return true;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const togglePasswordBtn = document.querySelector('.toggle-password');
    
    // 密码显示/隐藏功能
    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            // 切换图标（使用简单的方式）
            if (type === 'text') {
                this.innerHTML = `
                    <svg class="eye-icon" viewBox="0 0 24 24" fill="none">
                        <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M1 12C1 12 5 20 12 20C19 20 23 12 23 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                `;
                this.setAttribute('aria-label', '隐藏密码');
            } else {
                this.innerHTML = `
                    <svg class="eye-icon" viewBox="0 0 24 24" fill="none">
                        <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                `;
                this.setAttribute('aria-label', '显示密码');
            }
        });
    }
    
    // 输入实时验证
    usernameInput.addEventListener('blur', function() {
        validateInput(this);
    });
    
    passwordInput.addEventListener('blur', function() {
        validateInput(this);
    });
    
    // 清除错误状态
    usernameInput.addEventListener('focus', function() {
        this.closest('.form-group').classList.remove('error');
    });
    
    passwordInput.addEventListener('focus', function() {
        this.closest('.form-group').classList.remove('error');
    });
    
    // 表单提交
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        
        // 验证输入
        const isUsernameValid = validateInput(usernameInput);
        const isPasswordValid = validateInput(passwordInput);
        
        if (!isUsernameValid || !isPasswordValid) {
            showMessage('请填写完整的登录信息', 'warning');
            return;
        }
        
        const loginBtn = document.querySelector('.login-btn');
        const originalText = loginBtn.textContent;
        
        try {
            // 显示加载状态
            loginBtn.classList.add('loading');
            loginBtn.disabled = true;
            
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                showMessage('登录成功！正在跳转...', 'success');
                
                // 添加成功动画效果
                loginBtn.classList.remove('loading');
                loginBtn.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="none" style="width: 24px; height: 24px; display: inline-block;">
                        <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                `;
                
                setTimeout(() => {
                    window.location.href = '/firmwares';
                }, 1000);
            } else {
                showMessage(data.error || '登录失败，请检查用户名和密码', 'error');
                
                // 抖动效果
                loginBtn.style.animation = 'shake 0.4s';
                setTimeout(() => {
                    loginBtn.style.animation = '';
                }, 400);
            }
        } catch (error) {
            console.error('Login error:', error);
            showMessage('网络错误，请检查连接后重试', 'error');
        } finally {
            if (!document.querySelector('.login-btn svg')) {
                loginBtn.classList.remove('loading');
                loginBtn.disabled = false;
                loginBtn.innerHTML = `<span class="btn-text">${originalText}</span><span class="btn-loader"></span>`;
            }
        }
    });
    
    // Enter 键快速登录
    passwordInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            loginForm.dispatchEvent(new Event('submit'));
        }
    });
});

// 添加 CSS 动画
const style = document.createElement('style');
style.textContent = `
    @keyframes messageSlideOut {
        to {
            opacity: 0;
            transform: translateX(100px);
        }
    }
`;
document.head.appendChild(style);