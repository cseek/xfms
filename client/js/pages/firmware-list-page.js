/*
 * @Author: aurson jassimxiong@gmail.com
 * @Date: 2025-09-14 17:33:37
 * @LastEditors: aurson jassimxiong@gmail.com
 * @LastEditTime: 2025-11-07 01:45:08
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

document.addEventListener('DOMContentLoaded', () => {
    dashboard.init({
        pageId: 'firmware-list',
        pageTitle: '固件列表',
        onReady: async () => {
            await firmwareManager.loadModulesForSelect();
            await firmwareManager.loadProjectsForSelect();
            
            // 获取URL参数中的筛选条件
            const urlParams = new URLSearchParams(window.location.search);
            const filterType = urlParams.get('filter');
            
            // 根据筛选类型加载固件
            await loadFirmwaresByFilter(filterType);

            const uploadBtn = document.getElementById('uploadBtn');
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
                if (filterType) {
                    filters.filterType = filterType;
                }
                
                await firmwareManager.loadFirmwares(filters);
            };

            moduleFilter?.addEventListener('change', triggerSearch);
            projectFilter?.addEventListener('change', triggerSearch);
            environmentFilter?.addEventListener('change', triggerSearch);
            
            // 添加搜索框事件监听器
            searchInput?.addEventListener('input', () => {
                // 使用防抖，避免频繁触发搜索
                clearTimeout(searchInput.debounceTimer);
                searchInput.debounceTimer = setTimeout(triggerSearch, 300);
            });

            uploadBtn?.addEventListener('click', () => {
                window.location.href = '/manage/firmware';
            });
        }
    });
});

// 根据筛选类型加载固件
async function loadFirmwaresByFilter(filterType) {
    const currentUser = dashboard.currentUser;
    
    if (!filterType || filterType === 'all') {
        // 所有固件
        await firmwareManager.loadFirmwares();
    } else if (filterType === 'my-uploaded') {
        // 我上传的（仅管理员和开发者）
        if (currentUser.role === 'admin' || currentUser.role === 'developer') {
            await firmwareManager.loadFirmwares({
                uploaded_by: currentUser.username
            });
        } else {
            await firmwareManager.loadFirmwares();
        }
    } else if (filterType === 'my-tested') {
        // 我测试的（仅测试人员）
        if (currentUser.role === 'tester') {
            await firmwareManager.loadFirmwares({
                tested_by: currentUser.username
            });
        } else {
            await firmwareManager.loadFirmwares();
        }
    } else {
        await firmwareManager.loadFirmwares();
    }
}
