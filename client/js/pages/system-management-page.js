document.addEventListener('DOMContentLoaded', () => {
    dashboard.init({
        pageId: 'system-management',
        pageTitle: '系统管理',
        onReady: async () => {
            const tabButtons = document.querySelectorAll('.tab-btn');
            const tabPanes = document.querySelectorAll('.tab-pane');

            const switchTab = (target) => {
                tabButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === target));
                tabPanes.forEach(pane => pane.classList.toggle('active', pane.id === target));
            };

            tabButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const tab = e.currentTarget.dataset.tab;
                    switchTab(tab);
                });
            });

            document.getElementById('addUserBtn')?.addEventListener('click', () => {
                modalManager.showAddUserModal();
            });

            if (dashboard.currentUser?.role === 'admin') {
                await userManager.loadUsers();
            }
        }
    });
});
