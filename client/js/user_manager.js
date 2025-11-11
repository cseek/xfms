/*
 * @Author: aurson jassimxiong@gmail.com
 * @Date: 2025-09-14 17:33:37
 * @LastEditors: aurson jassimxiong@gmail.com
 * @LastEditTime: 2025-11-06 11:11:52
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

class UserManager {
    constructor() {
        this.users = [];
    this.pageSize = 7;
        this.currentPage = 1;
        this.searchQuery = '';
    }

    async loadUsers() {
        try {
            const response = await fetch('/api/users');
            if (!response.ok) throw new Error('Failed to load users');
            
            this.users = await response.json();
            this.currentPage = 1;
            this.renderUsers();
        } catch (error) {
            console.error('Error loading users:', error);
            Utils.showMessage('加载用户列表失败', 'error');
        }
    }

    setSearchQuery(query) {
        this.searchQuery = query ?? '';
        this.currentPage = 1;
        this.renderUsers();
    }

    getFilteredUsers() {
        const keyword = this.searchQuery.trim().toLowerCase();
        if (!keyword) {
            return this.users.slice();
        }

        return this.users.filter(user => {
            const username = (user.username || '').toLowerCase();
            const email = (user.email || '').toLowerCase();
            const role = (user.role || '').toLowerCase();
            const roleLabel = (this.getRoleDisplayName(user.role) || '').toLowerCase();
            return username.includes(keyword) ||
                email.includes(keyword) ||
                role.includes(keyword) ||
                roleLabel.includes(keyword);
        });
    }

    renderUsers() {
        const table = document.getElementById('usersTable');
        if (!table) return;

        const pageContainer = document.getElementById('users') || table.parentElement;
        const searchInput = document.getElementById('userSearch');
        if (searchInput && searchInput.value !== this.searchQuery) {
            searchInput.value = this.searchQuery;
        }

        const filteredUsers = this.getFilteredUsers();

        if (filteredUsers.length === 0) {
            const message = this.searchQuery.trim() ? '未找到匹配的用户' : '暂无用户数据';
            table.innerHTML = `<div class="no-data">${message}</div>`;
            const oldPag = pageContainer?.querySelector('.pagination');
            oldPag?.remove();
            return;
        }

        // pagination for users
        const total = filteredUsers.length;
        const totalPages = Math.max(1, Math.ceil(total / this.pageSize));
        if (this.currentPage > totalPages) this.currentPage = totalPages;
        const start = (this.currentPage - 1) * this.pageSize;
        const end = start + this.pageSize;
        const pageItems = filteredUsers.slice(start, end);

        table.innerHTML = `
            <div class="table-container">
                <table class="users-table">
                    <thead>
                        <tr>
                            <th>用户</th>
                            <th>角色</th>
                            <th>邮箱</th>
                            <th>创建时间</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${pageItems.map(user => `
                            <tr>
                                <td>${user.username}</td>
                                <td><span class="role-badge role-${user.role}">${this.getRoleDisplayName(user.role)}</span></td>
                                <td>${user.email || '-'}</td>
                                <td>${Utils.formatDate(user.created_at)}</td>
                                <td>
                                    <div class="user-actions">
                                        ${this.renderUserActions(user)}
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        // pagination controls (compact current/total) - insert into users tab container
        let paginationHtml = '<div class="pagination">';
        paginationHtml += `<button class="users-prev" data-page="${Math.max(1, this.currentPage - 1)}" ${this.currentPage===1? 'disabled':''}>上一页</button>`;
        paginationHtml += `<span class="page-indicator" style="padding:6px 10px; background:rgba(0,0,0,0.06); border-radius:6px;">${this.currentPage}/${totalPages}</span>`;
        paginationHtml += `<button class="users-next" data-page="${Math.min(totalPages, this.currentPage + 1)}" ${this.currentPage===totalPages? 'disabled':''}>下一页</button>`;
        paginationHtml += '</div>';

        // insert pagination into the users tab container
        const oldPag = pageContainer.querySelector('.pagination');
        if (oldPag) oldPag.remove();
        pageContainer.insertAdjacentHTML('beforeend', paginationHtml);

        this.attachUserEventListeners();
        // pagination listeners (attach inside users tab)
        const pagUsers = pageContainer.querySelector('.pagination');
        if (pagUsers) {
            const prev = pagUsers.querySelector('.users-prev');
            const next = pagUsers.querySelector('.users-next');
            if (prev) prev.addEventListener('click', () => {
                const p = parseInt(prev.getAttribute('data-page')) || 1;
                this.currentPage = p;
                this.renderUsers();
            });
            if (next) next.addEventListener('click', () => {
                const p = parseInt(next.getAttribute('data-page')) || totalPages;
                this.currentPage = p;
                this.renderUsers();
            });
        }
    }

    renderUserActions(user) {
        const currentUser = dashboard.currentUser;
        
        // 只有管理员可以编辑和删除用户，且不能删除自己
        if (currentUser.role !== 'admin') {
            return '-';
        }

        const actions = [];
        
        if (user.id !== currentUser.id) {
            actions.push(`
                <button class="edit-btn" data-id="${user.id}">编辑</button>
            `);
            actions.push(`
                <button class="delete-btn" data-id="${user.id}">删除</button>
            `);
        } else {
            actions.push(`
                <span class="current-user">当前用户</span>
            `);
        }

        return actions.join('');
    }

    attachUserEventListeners() {
        document.querySelectorAll('.users-table .edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = e.target.getAttribute('data-id');
                const user = this.users.find(u => u.id == userId);
                modalManager.showEditUserModal(user);
            });
        });

        document.querySelectorAll('.users-table .delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const userId = e.target.getAttribute('data-id');
                const user = this.users.find(u => u.id == userId);
                
                if (confirm(`确定要删除用户 "${user.username}" 吗？此操作不可恢复。`)) {
                    await this.deleteUser(userId);
                }
            });
        });
    }

    async deleteUser(userId) {
        try {
            const response = await fetch(`/api/users/${userId}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Delete failed');

            Utils.showMessage('用户删除成功', 'success');
            await this.loadUsers();
        } catch (error) {
            console.error('Delete user error:', error);
            Utils.showMessage('用户删除失败', 'error');
        }
    }

    getRoleDisplayName(role) {
        return dashboard.getRoleDisplayName(role);
    }
}

// 初始化用户管理器
const userManager = new UserManager();