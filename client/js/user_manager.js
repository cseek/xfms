class UserManager {
    constructor() {
        this.users = [];
    }

    async loadUsers() {
        try {
            const response = await fetch('/api/users');
            if (!response.ok) throw new Error('Failed to load users');
            
            this.users = await response.json();
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
                        ${this.users.map(user => `
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

        this.attachUserEventListeners();
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