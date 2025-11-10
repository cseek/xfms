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
        pageId: 'upload-list',
        pageTitle: '上传列表',
        onReady: async () => {
            firmwareManager.setPageId('upload-list');
            
            await firmwareManager.loadModulesForSelect();
            await firmwareManager.loadProjectsForSelect();
            
            // 加载待委派状态的固件
            await loadUploadFirmwares();

            const moduleFilter = document.getElementById('moduleFilter');
            const projectFilter = document.getElementById('projectFilter');
            const searchInput = document.getElementById('searchInput');

            const triggerSearch = async () => {
                const filters = {
                    module_id: moduleFilter?.value || '',
                    project_id: projectFilter?.value || '',
                    search: searchInput?.value.trim() || '',
                    status: '待委派'
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

async function loadUploadFirmwares() {
    const filters = {
        status: '待委派'
    };
    
    await firmwareManager.loadFirmwares(filters);
}
