/*
 * @Author: aurson jassimxiong@gmail.com
 * @Date: 2025-11-10
 * @Description: 和我相关页面逻辑
 * 显示规则：
 * - 我上传的待委派状态的固件
 * - 我驳回的已驳回状态的固件
 * - 委派给我的待发布状态的固件
 * - 我发布的已发布状态的固件
 */

document.addEventListener('DOMContentLoaded', () => {
    dashboard.init({
        pageId: 'my-related',
        pageTitle: '固件列表 - 和我相关',
        onReady: async () => {
            firmwareManager.setPageId('my-related');
            
            // 加载与我相关的固件
            await loadMyRelatedFirmwares();

            const statusFilter = document.getElementById('statusFilter');
            const searchInput = document.getElementById('searchInput');

            const triggerSearch = async () => {
                const filters = {
                    my_related: true,
                    search: searchInput?.value.trim() || ''
                };

                // 如果选择了特定状态，添加状态筛选
                if (statusFilter?.value) {
                    filters.status = statusFilter.value;
                }
                
                await firmwareManager.loadFirmwares(filters);
            };

            statusFilter?.addEventListener('change', triggerSearch);
            
            searchInput?.addEventListener('input', () => {
                clearTimeout(searchInput.debounceTimer);
                searchInput.debounceTimer = setTimeout(triggerSearch, 300);
            });
        }
    });
});

async function loadMyRelatedFirmwares() {
    const filters = {
        my_related: true  // 特殊标记，后端会根据当前用户筛选相关固件
    };
    
    await firmwareManager.loadFirmwares(filters);
}
