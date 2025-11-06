document.addEventListener('DOMContentLoaded', () => {
    dashboard.init({
        pageId: 'firmware-management',
        pageTitle: '固件管理',
        onReady: async () => {
            await firmwareManager.loadModulesForSelect();
            await firmwareManager.loadProjectsForSelect();
            await firmwareManager.loadModules();
            await firmwareManager.loadProjects();

            const tabButtons = document.querySelectorAll('.tab-btn');
            const tabPanes = document.querySelectorAll('.tab-pane');

            const switchTab = (target) => {
                tabButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === target));
                tabPanes.forEach(pane => pane.classList.toggle('active', pane.id === target));

                if (target === 'modules') {
                    firmwareManager.loadModules();
                } else if (target === 'projects') {
                    firmwareManager.loadProjects();
                }
            };

            tabButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const tab = e.currentTarget.dataset.tab;
                    switchTab(tab);
                });
            });

            const uploadForm = document.getElementById('uploadForm');
            uploadForm?.addEventListener('submit', (e) => {
                e.preventDefault();
                firmwareManager.uploadFirmware();
            });

            document.getElementById('addModuleBtn')?.addEventListener('click', () => {
                modalManager.showAddModuleModal();
            });

            document.getElementById('addProjectBtn')?.addEventListener('click', () => {
                modalManager.showAddProjectModal();
            });
        }
    });
});
