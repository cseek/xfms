/*
 * @Author: aurson jassimxiong@gmail.com
 * @Date: 2025-09-14 17:33:37
 * @LastEditors: aurson jassimxiong@gmail.com
 * @LastEditTime: 2025-11-07 01:45:28
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

class DashboardApp {
    constructor() {
        this.currentUser = null;
        this.sidebarLoaded = false;
        this.headerLoaded = false;
        this.currentPageId = null;
        this.isLoadingAbout = false;
        this.handleResize = this.handleResize.bind(this);
    }

    async init({ pageId, pageTitle, onReady } = {}) {
        if (!pageId) {
            throw new Error('pageId is required when initializing dashboard');
        }

        this.currentPageId = pageId;

        await this.ensureAuth();
        await this.injectLayout();
        this.ensurePagePermission(pageId);
        this.setPageTitle(pageTitle);
        this.updateUserInfo();
        this.applyRoleVisibility();
        this.highlightActiveNav(pageId);
        this.bindGlobalEvents();
        this.handleResize();
        window.addEventListener('resize', this.handleResize);

        if (typeof onReady === 'function') {
            await onReady();
        }
    }

    async ensureAuth() {
        if (this.currentUser) {
            return this.currentUser;
        }

        try {
            const response = await fetch('/api/auth/check');
            if (!response.ok) {
                window.location.href = '/';
                return null;
            }
            this.currentUser = await response.json();
            return this.currentUser;
        } catch (error) {
            console.error('Auth check failed:', error);
            window.location.href = '/';
            return null;
        }
    }

    async injectLayout() {
        const sidebarContainer = document.getElementById('sidebarContainer');
        const headerContainer = document.getElementById('headerContainer');

        if (!sidebarContainer || !headerContainer) {
            console.warn('Missing layout containers for sidebar/header.');
            return;
        }

        if (!this.sidebarLoaded) {
            const sidebarHtml = await this.fetchPartial('/html/partials/sidebar.html');
            sidebarContainer.innerHTML = sidebarHtml;
            this.sidebarLoaded = true;
        }

        this.bindSidebarNavigation();

        if (!this.headerLoaded) {
            const headerHtml = await this.fetchPartial('/html/partials/header.html');
            headerContainer.innerHTML = headerHtml;
            this.headerLoaded = true;
        }
    }

    async fetchPartial(path) {
        try {
            const response = await fetch(path);
            if (!response.ok) {
                throw new Error(`Failed to load partial: ${path}`);
            }
            return await response.text();
        } catch (error) {
            console.error(error);
            return '';
        }
    }

    ensurePagePermission(pageId) {
        if (!this.currentUser) {
            return;
        }

        if (pageId.startsWith('system-management') && this.currentUser.role !== 'admin') {
            Utils.showMessage('您没有权限访问系统管理页面', 'warning');
            window.location.href = '/firmwares';
        }
    }

    setPageTitle(title) {
        const titleEl = document.getElementById('pageTitle');
        if (titleEl) {
            titleEl.textContent = title || '';
        }
    }

    updateUserInfo() {
        if (!this.currentUser) {
            return;
        }

        const currentUserEl = document.getElementById('currentUser');
        const userRoleEl = document.getElementById('userRole');

        if (currentUserEl) {
            currentUserEl.textContent = `欢迎，${this.currentUser.username}`;
        }

        if (userRoleEl) {
            userRoleEl.textContent = this.getRoleDisplayName(this.currentUser.role);
        }
    }

    getRoleDisplayName(role) {
        const roles = {
            admin: '管理员',
            developer: '研发人员',
            tester: '测试人员',
            user: '普通用户'
        };
        return roles[role] || role;
    }

    applyRoleVisibility() {
        if (!this.currentUser) {
            return;
        }

        const role = this.currentUser.role;
        const sidebarEl = document.querySelector('.sidebar');

        if (sidebarEl) {
            sidebarEl.querySelectorAll('[data-requires-role]').forEach(item => {
                const requiredRoles = item.getAttribute('data-requires-role')
                    .split(',')
                    .map(r => r.trim());
                item.style.display = requiredRoles.includes(role) ? '' : 'none';
            });
        }
    }

    highlightActiveNav(pageId) {
        const sidebar = document.querySelector('.sidebar');
        if (!sidebar) {
            return;
        }

        sidebar.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });

        sidebar.querySelectorAll('.has-submenu').forEach(parent => {
            parent.classList.remove('open');
            const toggle = parent.querySelector('.submenu-toggle');
            if (toggle) {
                toggle.setAttribute('aria-expanded', 'false');
            }
        });

        const activeItem = sidebar.querySelector(`.menu-item[data-page="${pageId}"]`);
        if (!activeItem) {
            return;
        }

        activeItem.classList.add('active');

        const parentSubmenu = activeItem.closest('.has-submenu');
        if (parentSubmenu) {
            parentSubmenu.classList.add('open');
            const toggle = parentSubmenu.querySelector('.submenu-toggle');
            if (toggle) {
                toggle.classList.add('active');
                toggle.setAttribute('aria-expanded', 'true');
            }
        }
    }

    bindGlobalEvents() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn && !logoutBtn.dataset.bound) {
            logoutBtn.addEventListener('click', () => this.logout());
            logoutBtn.dataset.bound = 'true';
        }

        const toggleBtn = document.querySelector('.sidebar-toggle');
        if (toggleBtn && !toggleBtn.dataset.bound) {
            toggleBtn.addEventListener('click', () => this.toggleSidebar());
            toggleBtn.dataset.bound = 'true';
        }
    }

    bindSidebarNavigation() {
        const sidebar = document.querySelector('.sidebar');
        if (!sidebar) {
            return;
        }

        const aboutLink = sidebar.querySelector('.menu-item[data-page="about"]');

        if (aboutLink && !aboutLink.dataset.boundAboutNav) {
            aboutLink.addEventListener('click', (event) => {
                event.preventDefault();
                this.handleAboutNavigation();
            });
            aboutLink.dataset.boundAboutNav = 'true';
        }

        sidebar.querySelectorAll('.submenu-toggle').forEach(toggle => {
            if (toggle.dataset.boundSubmenuToggle) {
                return;
            }

            const parentItem = toggle.closest('.has-submenu');

            const setExpanded = (expanded) => {
                toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
            };

            toggle.addEventListener('click', () => {
                const isOpen = parentItem?.classList.toggle('open');
                setExpanded(Boolean(isOpen));
            });

            setExpanded(parentItem?.classList.contains('open'));
            toggle.dataset.boundSubmenuToggle = 'true';
        });
    }

    async handleAboutNavigation() {
        if (this.isLoadingAbout) {
            return;
        }

        try {
            this.isLoadingAbout = true;
            await this.loadAboutContent();
        } finally {
            this.isLoadingAbout = false;
        }
    }

    async loadAboutContent() {
        const targetContainer = document.querySelector('.main-content .content-area');
        if (!targetContainer) {
            console.warn('Content area not found when loading About page.');
            return;
        }

        try {
            const response = await fetch('/about', {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to load /about: ${response.status}`);
            }

            const htmlText = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, 'text/html');
            const aboutContent = doc.querySelector('.content-area');

            if (!aboutContent) {
                throw new Error('About page template missing .content-area block');
            }

            targetContainer.innerHTML = aboutContent.innerHTML;

            this.ensureStylesheet('/css/about.css');
            this.setPageTitle('关于系统');
            this.highlightActiveNav('about');
            this.currentPageId = 'about';
        } catch (error) {
            console.error('Failed to load About page content:', error);
            Utils.showMessage('加载关于页面失败，请稍后重试', 'error');
        }
    }

    ensureStylesheet(href) {
        const existing = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
            .some(link => link.getAttribute('href') === href);

        if (!existing) {
            const linkEl = document.createElement('link');
            linkEl.rel = 'stylesheet';
            linkEl.href = href;
            document.head.appendChild(linkEl);
        }
    }

    toggleSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.querySelector('.main-content');

        if (!sidebar || !mainContent) {
            return;
        }

        sidebar.classList.toggle('collapsed');
        mainContent.classList.toggle('expanded');
    }

    handleResize() {
        if (window.innerWidth < 768) {
            document.querySelector('.sidebar')?.classList.add('collapsed');
            document.querySelector('.main-content')?.classList.add('expanded');
        } else {
            document.querySelector('.sidebar')?.classList.remove('collapsed');
            document.querySelector('.main-content')?.classList.remove('expanded');
        }
    }

    async logout() {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            window.location.href = '/';
        }
    }
}

window.dashboard = new DashboardApp();
