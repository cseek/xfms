/*
 * @Author: aurson jassimxiong@gmail.com
 * @Date: 2025-09-14 17:33:37
 * @LastEditors: aurson jassimxiong@gmail.com
 * @LastEditTime: 2025-11-07 01:45:14
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
