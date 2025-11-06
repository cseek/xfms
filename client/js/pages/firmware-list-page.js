document.addEventListener('DOMContentLoaded', () => {
    dashboard.init({
        pageId: 'firmware-list',
        pageTitle: '固件列表',
        onReady: async () => {
            await firmwareManager.loadModulesForSelect();
            await firmwareManager.loadProjectsForSelect();
            await firmwareManager.loadFirmwares();

            const searchBtn = document.getElementById('searchBtn');
            const uploadBtn = document.getElementById('uploadBtn');
            const moduleFilter = document.getElementById('moduleFilter');
            const projectFilter = document.getElementById('projectFilter');
            const environmentFilter = document.getElementById('environmentFilter');

            const triggerSearch = async () => {
                await firmwareManager.loadFirmwares({
                    module_id: moduleFilter?.value || '',
                    project_id: projectFilter?.value || '',
                    environment: environmentFilter?.value || ''
                });
            };

            searchBtn?.addEventListener('click', triggerSearch);
            moduleFilter?.addEventListener('change', triggerSearch);
            projectFilter?.addEventListener('change', triggerSearch);
            environmentFilter?.addEventListener('change', triggerSearch);

            uploadBtn?.addEventListener('click', () => {
                window.location.href = '/manage/firmware';
            });
        }
    });
});
