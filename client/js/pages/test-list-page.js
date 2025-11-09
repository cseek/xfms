/*
 * @Author: aurson jassimxiong@gmail.com
 * @Date: 2025-11-09
 * @Description: 测试列表页面逻辑
 */

document.addEventListener('DOMContentLoaded', () => {
    dashboard.init({
        pageId: 'test-list',
        pageTitle: '测试列表',
        onReady: async () => {
            await firmwareManager.loadModulesForSelect();
            await firmwareManager.loadProjectsForSelect();
            
            // 获取URL参数中的筛选条件
            const urlParams = new URLSearchParams(window.location.search);
            const filterType = urlParams.get('filter');
            
            // 根据筛选类型加载固件
            await loadTestsByFilter(filterType);

            const moduleFilter = document.getElementById('moduleFilter');
            const projectFilter = document.getElementById('projectFilter');
            const environmentFilter = document.getElementById('environmentFilter');
            const searchInput = document.getElementById('searchInput');

            const triggerSearch = async () => {
                const filters = {
                    module_id: moduleFilter?.value || '',
                    project_id: projectFilter?.value || '',
                    environment: environmentFilter?.value || '',
                    search: searchInput?.value.trim() || ''
                };
                
                // 如果有URL筛选参数，添加到filters中
                if (filterType === 'my-tested') {
                    filters.tested_by = dashboard.currentUser.username;
                }
                
                await firmwareManager.loadFirmwares(filters);
            };

            moduleFilter?.addEventListener('change', triggerSearch);
            projectFilter?.addEventListener('change', triggerSearch);
            environmentFilter?.addEventListener('change', triggerSearch);
            
            // 添加搜索框事件监听器
            searchInput?.addEventListener('input', () => {
                clearTimeout(searchInput.debounceTimer);
                searchInput.debounceTimer = setTimeout(triggerSearch, 300);
            });
        }
    });
});

// 根据筛选类型加载测试固件
async function loadTestsByFilter(filterType) {
    const currentUser = dashboard.currentUser;
    
    if (!filterType || filterType === 'all') {
        // 所有固件
        await firmwareManager.loadFirmwares();
    } else if (filterType === 'my-tested') {
        // 我测试的
        await firmwareManager.loadFirmwares({
            tested_by: currentUser.username
        });
    } else {
        await firmwareManager.loadFirmwares();
    }
}
