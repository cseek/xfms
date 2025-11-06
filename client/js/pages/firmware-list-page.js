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
