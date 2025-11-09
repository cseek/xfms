/*
 * @Author: aurson jassimxiong@gmail.com
 * @Date: 2025-11-09
 * @Description: 发布列表页面逻辑
 */

document.addEventListener('DOMContentLoaded', () => {
    dashboard.init({
        pageId: 'release-list',
        pageTitle: '发布列表',
        onReady: async () => {
            // 设置当前页面ID
            firmwareManager.setPageId('release-list');
            
            await firmwareManager.loadModulesForSelect();
            await firmwareManager.loadProjectsForSelect();
            
            // 获取URL参数中的筛选条件
            const urlParams = new URLSearchParams(window.location.search);
            const filterType = urlParams.get('filter');
            
            // 根据筛选类型加载固件
            await loadReleasesByFilter(filterType);

            const moduleFilter = document.getElementById('moduleFilter');
            const projectFilter = document.getElementById('projectFilter');
            const searchInput = document.getElementById('searchInput');

            const triggerSearch = async () => {
                const filters = {
                    module_id: moduleFilter?.value || '',
                    project_id: projectFilter?.value || '',
                    search: searchInput?.value.trim() || '',
                    status: 'released' // 只显示已发布的固件
                };
                
                // 如果有URL筛选参数，添加到filters中
                if (filterType === 'my-released') {
                    filters.released_by = dashboard.currentUser.username;
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

// 根据筛选类型加载发布的固件
async function loadReleasesByFilter(filterType) {
    const currentUser = dashboard.currentUser;
    
    if (!filterType || filterType === 'all') {
        // 所有已发布的固件
        await firmwareManager.loadFirmwares({ status: 'released' });
    } else if (filterType === 'my-released') {
        // 我发布的（管理员、开发者、测试人员可见）
        if (currentUser.role === 'admin' || currentUser.role === 'developer' || currentUser.role === 'tester') {
            await firmwareManager.loadFirmwares({
                status: 'released',
                released_by: currentUser.username
            });
        } else {
            // 普通用户只能看到所有已发布的固件
            await firmwareManager.loadFirmwares({ status: 'released' });
        }
    } else {
        await firmwareManager.loadFirmwares({ status: 'released' });
    }
}
