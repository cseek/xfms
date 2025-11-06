/*
 * @Author: aurson jassimxiong@gmail.com
 * @Date: 2025-09-14 17:33:37
 * @LastEditors: aurson jassimxiong@gmail.com
 * @LastEditTime: 2025-11-07 01:44:55
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

class Dashboard {
    constructor() {
        this.currentUser = null;
        this.currentPage = 'firmware-list';
        this.init();
    }

    async init() {
        await this.checkAuth();
        await this.loadUserInfo();
        this.setupEventListeners();

        // 在初始化时加载模块和项目数据到过滤器
        await firmwareManager.loadModulesForSelect();
        await firmwareManager.loadProjectsForSelect();

        this.loadCurrentPage();
    }

    async checkAuth() {
        try {
            const response = await fetch('/api/auth/check');
            if (!response.ok) {
                window.location.href = '/';
                return;
            }
            this.currentUser = await response.json();
        } catch (error) {
            console.error('Auth check failed:', error);
            window.location.href = '/';
        }
    }

    async loadUserInfo() {
        if (this.currentUser) {
            document.getElementById('currentUser').textContent = 
                `欢迎，${this.currentUser.username}`;
            document.getElementById('userRole').textContent = 
                this.getRoleDisplayName(this.currentUser.role);
            
            // 根据角色显示/隐藏功能
            this.updateUIByRole();
        }
    }

    getRoleDisplayName(role) {
        const roles = {
            'admin': '管理员',
            'developer': '研发人员',
            'tester': '测试人员',
            'user': '普通用户'
        };
        return roles[role] || role;
    }

    updateUIByRole() {
        const role = this.currentUser.role;
        
        // 显示/隐藏上传按钮
        const uploadBtn = document.getElementById('uploadBtn');
        if (uploadBtn) {
            uploadBtn.style.display = 
                (role === 'admin' || role === 'developer') ? 'block' : 'none';
        }

        // 显示/隐藏系统管理菜单
        const systemManagementItem = document.querySelector('[data-page="system-management"]');
        if (systemManagementItem) {
            systemManagementItem.style.display = 
                role === 'admin' ? 'block' : 'none';
        }
    }

    setupEventListeners() {
        // 侧边栏菜单点击
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.getAttribute('data-page');
                this.switchPage(page);
            });
        });

        // 退出登录
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });

        // 侧边栏切换（移动端）
        document.querySelector('.sidebar-toggle').addEventListener('click', () => {
            this.toggleSidebar();
        });

        // 标签页切换
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.getAttribute('data-tab');
                this.switchTab(tab);
            });
        });

        // 固件搜索
        document.getElementById('searchBtn').addEventListener('click', () => {
            this.searchFirmwares();
        });

        // 上传按钮
        document.getElementById('uploadBtn').addEventListener('click', () => {
            this.switchPage('firmware-management');
            this.switchTab('upload');
        });

        // 添加模块按钮
        document.getElementById('addModuleBtn').addEventListener('click', () => {
            modalManager.showAddModuleModal();
        });

        // 添加项目按钮
        document.getElementById('addProjectBtn').addEventListener('click', () => {
            modalManager.showAddProjectModal();
        });

        // 添加用户按钮
        document.getElementById('addUserBtn').addEventListener('click', () => {
            modalManager.showAddUserModal();
        });

        // 固件上传表单
        document.getElementById('uploadForm').addEventListener('submit', (e) => {
            e.preventDefault();
            firmwareManager.uploadFirmware();
        });

        // 窗口大小变化时调整布局
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }

    switchPage(pageName) {
        // 更新菜单激活状态
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-page="${pageName}"]`).classList.add('active');

        // 更新页面显示
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        document.getElementById(pageName).classList.add('active');

        // 更新页面标题
        const titles = {
            'firmware-list': '固件列表',
            'firmware-management': '固件管理',
            'system-management': '系统管理',
            'about': '关于系统'
        };
        document.getElementById('pageTitle').textContent = titles[pageName] || pageName;

        this.currentPage = pageName;

        // 如果是固件管理页面，默认激活第一个标签页（上传固件）
        if (pageName === 'firmware-management') {
            this.switchTab('upload');
        }

        // 如果是系统管理页面，默认激活第一个标签页（用户管理）
        if (pageName === 'system-management') {
            this.switchTab('users');
        }

        // 加载页面数据
        this.loadPageData(pageName);
    }

    switchTab(tabName) {
        // 更新标签按钮状态
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // 更新标签内容显示
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');

        // 加载标签数据
        this.loadTabData(tabName);
    }

    async loadPageData(pageName) {
        switch (pageName) {
            case 'firmware-list':
                await firmwareManager.loadFirmwares();
                break;
            case 'firmware-management':
                await this.loadManagementData();
                break;
            case 'system-management':
                if (this.currentUser.role === 'admin') {
                    await userManager.loadUsers();
                }
                break;
        }
    }

    async loadTabData(tabName) {
        switch (tabName) {
            case 'modules':
                await firmwareManager.loadModules();
                break;
            case 'projects':
                await firmwareManager.loadProjects();
                break;
        }
    }

    async loadManagementData() {
        await firmwareManager.loadModulesForSelect();
        await firmwareManager.loadProjectsForSelect();
    }

    async searchFirmwares() {
        const moduleFilter = document.getElementById('moduleFilter').value;
        const projectFilter = document.getElementById('projectFilter').value;
        const environmentFilter = document.getElementById('environmentFilter').value;
        
        await firmwareManager.loadFirmwares({
            module_id: moduleFilter,
            project_id: projectFilter,
            environment: environmentFilter
        });
    }

    toggleSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.querySelector('.main-content');
        
        sidebar.classList.toggle('collapsed');
        mainContent.classList.toggle('expanded');
    }

    handleResize() {
        if (window.innerWidth < 768) {
            document.querySelector('.sidebar').classList.add('collapsed');
            document.querySelector('.main-content').classList.add('expanded');
        } else {
            document.querySelector('.sidebar').classList.remove('collapsed');
            document.querySelector('.main-content').classList.remove('expanded');
        }
    }

    async logout() {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            window.location.href = '/';
        } catch (error) {
            console.error('Logout failed:', error);
            window.location.href = '/';
        }
    }

    loadCurrentPage() {
        // 根据URL hash加载页面，如果没有则使用默认页面
        const hash = window.location.hash.replace('#', '');
        if (hash && document.querySelector(`[data-page="${hash}"]`)) {
            this.switchPage(hash);
        } else {
            this.switchPage(this.currentPage);
        }
    }
}

// 工具函数
class Utils {
    static showMessage(message, type = 'info') {
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
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;

        const colors = {
            success: '#4CAF50',
            error: '#f44336',
            warning: '#ff9800',
            info: '#2196F3'
        };

        messageDiv.style.background = colors[type] || colors.info;
        document.body.appendChild(messageDiv);

        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }

    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    static formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('zh-CN');
    }

    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// 初始化仪表板
let dashboard;
document.addEventListener('DOMContentLoaded', () => {
    dashboard = new Dashboard();
});