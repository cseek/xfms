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
            // 设置当前页面ID
            firmwareManager.setPageId('test-list');
            
            await firmwareManager.loadModulesForSelect();
            await firmwareManager.loadProjectsForSelect();
            
            // 获取URL参数中的筛选条件
            const urlParams = new URLSearchParams(window.location.search);
            const filterType = urlParams.get('filter');
            
            // 根据筛选类型加载固件
            await loadTestsByFilter(filterType);

            const moduleFilter = document.getElementById('moduleFilter');
            const projectFilter = document.getElementById('projectFilter');
            const searchInput = document.getElementById('searchInput');

            const triggerSearch = async () => {
                const filters = {
                    module_id: moduleFilter?.value || '',
                    project_id: projectFilter?.value || '',
                    search: searchInput?.value.trim() || '',
                    status: 'assigned' // 测试列表只显示待发布状态的固件
                };
                
                // 如果有URL筛选参数,添加到filters中
                if (filterType === 'my-tested') {
                    filters.tested_by = dashboard.currentUser.username;
                }
                
                await firmwareManager.loadFirmwares(filters);
            };

            moduleFilter?.addEventListener('change', triggerSearch);
            projectFilter?.addEventListener('change', triggerSearch);
            
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
    
    // 测试列表只显示待发布状态的固件
    const baseFilters = { status: 'assigned' };
    
    if (!filterType || filterType === 'all') {
        // 所有待发布固件
        await firmwareManager.loadFirmwares(baseFilters);
    } else if (filterType === 'my-tested') {
        // 我测试的待发布固件
        await firmwareManager.loadFirmwares({
            ...baseFilters,
            tested_by: currentUser.username
        });
    } else {
        await firmwareManager.loadFirmwares(baseFilters);
    }
}
