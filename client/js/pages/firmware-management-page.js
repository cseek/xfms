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
    const searchParams = new URLSearchParams(window.location.search);
    const availableSections = ['upload', 'modules', 'projects'];
    let section = searchParams.get('section') || 'upload';

    if (!availableSections.includes(section)) {
        section = 'upload';
    }

    const sectionTitles = {
        upload: '固件管理 - 上传固件',
        modules: '固件管理 - 模块管理',
        projects: '固件管理 - 项目管理'
    };

    dashboard.init({
        pageId: `firmware-management-${section}`,
        pageTitle: sectionTitles[section] || '固件管理',
        onReady: async () => {
            await firmwareManager.loadModulesForSelect();
            await firmwareManager.loadProjectsForSelect();

            const paneMap = {
                upload: document.getElementById('upload'),
                modules: document.getElementById('modules'),
                projects: document.getElementById('projects')
            };

            const activateSection = (target) => {
                const resolved = availableSections.includes(target) ? target : 'upload';

                Object.entries(paneMap).forEach(([key, pane]) => {
                    pane?.classList.toggle('active', key === resolved);
                });

                dashboard.setPageTitle(sectionTitles[resolved] || '固件管理');

                switch (resolved) {
                    case 'modules':
                        firmwareManager.loadModules();
                        break;
                    case 'projects':
                        firmwareManager.loadProjects();
                        break;
                    default:
                        break;
                }
            };

            activateSection(section);

            const uploadForm = document.getElementById('uploadForm');
            uploadForm?.addEventListener('submit', (e) => {
                e.preventDefault();
                firmwareManager.uploadFirmware();
            });

            const fileInput = document.getElementById('firmwareFile');
            const fileLabel = document.querySelector('.file-upload-label');
            const fileNameEl = document.getElementById('fileName');

            fileInput?.addEventListener('change', () => {
                if (fileInput.files.length > 0) {
                    fileNameEl.textContent = `已选择文件: ${fileInput.files[0].name}`;
                }
            });

            fileLabel?.addEventListener('dragover', (e) => {
                e.preventDefault();
                fileLabel.classList.add('dragover');
            });

            fileLabel?.addEventListener('dragleave', () => {
                fileLabel.classList.remove('dragover');
            });

            fileLabel?.addEventListener('drop', (e) => {
                e.preventDefault();
                fileLabel.classList.remove('dragover');
                if (e.dataTransfer.files.length > 0) {
                    fileInput.files = e.dataTransfer.files;
                    fileNameEl.textContent = `已选择文件: ${e.dataTransfer.files[0].name}`;
                }
            });

            uploadForm?.addEventListener('reset', () => {
                fileNameEl.textContent = '';
            });

            document.getElementById('addModuleBtn')?.addEventListener('click', () => {
                modalManager.showAddModuleModal();
            });

            document.getElementById('addProjectBtn')?.addEventListener('click', () => {
                modalManager.showAddProjectModal();
            });

            const moduleSearchInput = document.getElementById('moduleSearch');
            moduleSearchInput?.addEventListener('input', (event) => {
                firmwareManager.setModuleSearchQuery(event.target.value);
            });

            moduleSearchInput?.addEventListener('search', (event) => {
                firmwareManager.setModuleSearchQuery(event.target.value);
            });

            const projectSearchInput = document.getElementById('projectSearch');
            projectSearchInput?.addEventListener('input', (event) => {
                firmwareManager.setProjectSearchQuery(event.target.value);
            });

            projectSearchInput?.addEventListener('search', (event) => {
                firmwareManager.setProjectSearchQuery(event.target.value);
            });
        }
    });
});
