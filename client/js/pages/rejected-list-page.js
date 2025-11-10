/*
 * @Author: aurson jassimxiong@gmail.com
 * @Date: 2025-11-10
 * @Description: 驳回列表页面逻辑
 */

document.addEventListener('DOMContentLoaded', () => {
    dashboard.init({
        pageId: 'rejected-list',
        pageTitle: '驳回列表',
        onReady: async () => {
            firmwareManager.setPageId('rejected-list');
            
            // 加载模块和项目下拉选项
            await firmwareManager.loadModulesForSelect();
            await firmwareManager.loadProjectsForSelect();
            
            // 加载已驳回状态的固件
            await loadRejectedFirmwares();

            const moduleFilter = document.getElementById('moduleFilter');
            const projectFilter = document.getElementById('projectFilter');
            const searchInput = document.getElementById('searchInput');

            const triggerSearch = async () => {
                const filters = {
                    module_id: moduleFilter?.value || '',
                    project_id: projectFilter?.value || '',
                    search: searchInput?.value.trim() || '',
                    status: '已驳回'
                };
                
                await firmwareManager.loadFirmwares(filters);
            };

            moduleFilter?.addEventListener('change', triggerSearch);
            projectFilter?.addEventListener('change', triggerSearch);
            
            searchInput?.addEventListener('input', () => {
                clearTimeout(searchInput.debounceTimer);
                searchInput.debounceTimer = setTimeout(triggerSearch, 300);
            });
        }
    });
});

async function loadRejectedFirmwares() {
    const filters = {
        status: '已驳回'
    };
    
    await firmwareManager.loadFirmwares(filters);
}
