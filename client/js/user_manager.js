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
        this.pageSize = 10;
        this.currentPage = 1;
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

    renderUsers() {
        const table = document.getElementById('usersTable');
        if (!table) return;

        if (this.users.length === 0) {
            table.innerHTML = '<div class="no-data">暂无用户数据</div>';
            return;
        }
        // pagination for users
        const total = this.users.length;
        const totalPages = Math.max(1, Math.ceil(total / this.pageSize));
        if (this.currentPage > totalPages) this.currentPage = totalPages;
        const start = (this.currentPage - 1) * this.pageSize;
        const end = start + this.pageSize;
        const pageItems = this.users.slice(start, end);

        table.innerHTML = `
            <div class="table-container">
                <table class="users-table">
                    <thead>
                        <tr>
                            <th>用户名</th>
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
                                <td><span class="role-badge ${user.role}">${this.getRoleDisplayName(user.role)}</span></td>
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

        // pagination controls (compact current/total at bottom center)
        let paginationHtml = '<div class="pagination" style="position:fixed; bottom:16px; left:50%; transform:translateX(-50%); display:flex; gap:8px; align-items:center; justify-content:center; z-index:999;">';
        paginationHtml += `<button class="users-prev" data-page="${Math.max(1, this.currentPage - 1)}" ${this.currentPage===1? 'disabled':''}>上一页</button>`;
        paginationHtml += `<span class="page-indicator" style="padding:6px 10px; background:rgba(0,0,0,0.06); border-radius:6px;">${this.currentPage}/${totalPages}</span>`;
        paginationHtml += `<button class="users-next" data-page="${Math.min(totalPages, this.currentPage + 1)}" ${this.currentPage===totalPages? 'disabled':''}>下一页</button>`;
        paginationHtml += '</div>';
        table.innerHTML += paginationHtml;

        this.attachUserEventListeners();
        // pagination listeners
        const pagUsers = document.querySelector('.pagination');
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