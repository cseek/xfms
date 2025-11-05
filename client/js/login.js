/*
 * @Author: aurson jassimxiong@gmail.com
 * @Date: 2025-11-04 22:40:44
 * @LastEditors: aurson jassimxiong@gmail.com
 * @LastEditTime: 2025-11-04 22:40:49
 * @Description: 
 * Copyright (c) 2025 by Aurson, All Rights Reserved. 
 */
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        const loginBtn = document.querySelector('.login-btn');
        const originalText = loginBtn.textContent;
        
        try {
            loginBtn.textContent = '登录中...';
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
                showMessage('登录成功！', 'success');
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 1000);
            } else {
                showMessage(data.error || '登录失败', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            showMessage('网络错误，请稍后重试', 'error');
        } finally {
            loginBtn.textContent = originalText;
            loginBtn.disabled = false;
        }
    });
    
    function showMessage(message, type) {
        // 移除现有的消息
        const existingMessage = document.querySelector('.message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 5px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        
        if (type === 'success') {
            messageDiv.style.background = '#4CAF50';
        } else {
            messageDiv.style.background = '#f44336';
        }
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }
});