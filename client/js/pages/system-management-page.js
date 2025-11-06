/*
 * @Author: aurson jassimxiong@gmail.com
 * @Date: 2025-09-14 17:33:37
 * @LastEditors: aurson jassimxiong@gmail.com
 * @LastEditTime: 2025-11-07 01:45:20
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
    const availableSections = ['users', 'settings'];
    let section = searchParams.get('section') || 'users';

    if (!availableSections.includes(section)) {
        section = 'users';
    }

    const sectionTitles = {
        users: '系统管理 - 用户管理',
        settings: '系统管理 - 系统设置'
    };

    dashboard.init({
        pageId: `system-management-${section}`,
        pageTitle: sectionTitles[section] || '系统管理',
        onReady: async () => {
            const paneMap = {
                users: document.getElementById('users'),
                settings: document.getElementById('settings')
            };

            const activateSection = async (target) => {
                Object.entries(paneMap).forEach(([key, pane]) => {
                    pane?.classList.toggle('active', key === target);
                });

                switch (target) {
                    case 'users':
                        dashboard.setPageTitle(sectionTitles.users);
                        if (dashboard.currentUser?.role === 'admin') {
                            await userManager.loadUsers();
                        }
                        break;
                    case 'settings':
                        dashboard.setPageTitle(sectionTitles.settings);
                        break;
                    default:
                        dashboard.setPageTitle('系统管理');
                        break;
                }
            };

            await activateSection(section);

            document.getElementById('addUserBtn')?.addEventListener('click', () => {
                modalManager.showAddUserModal();
            });
        }
    });
});
