/*
 * @Author: aurson jassimxiong@gmail.com
 * @Date: 2025-09-14 17:33:37
 * @LastEditors: aurson jassimxiong@gmail.com
 * @LastEditTime: 2025-11-09 15:49:14
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

class FirmwareManager {
    constructor() {
        this.firmwares = [];
        this.modules = [];
        this.projects = [];
        this.moduleSearchQuery = '';
        this.projectSearchQuery = '';
        // pagination state
        this.pageSize = 20; // 固件服务端分页大小
        this.modulesPageSize = 10; // 模块服务端分页大小
        this.projectsPageSize = this.modulesPageSize; // 项目分页大小
        this.currentPage = 1; // 固件当前页码
        this.totalPages = 1; // 固件总页数
        this.total = 0; // 固件总记录数
        this.modulesPage = 1; // 模块当前页码
        this.modulesTotalPages = 1; // 模块总页数
        this.modulesTotal = 0; // 模块总记录数
        this.projectsPage = 1; // 项目当前页码
        this.currentFilters = {}; // 保存当前的过滤条件
        this.currentPageId = null; // 当前页面ID (upload-list, test-list, release-list)
        this.managementMenuOutsideHandler = null;
    }

    // 设置当前页面ID
    setPageId(pageId) {
        this.currentPageId = pageId;
    }

    // 简单的 HTML 转义，防止插入不安全的内容
    escapeHtml(str) {
        if (!str && str !== 0) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // 截断为单行并以三个点结尾（如果超过长度）
    truncateAndEscape(text, maxChars = 80) {
        if (text == null) return '';
        const s = String(text);
        if (s.length <= maxChars) return this.escapeHtml(s);
        return this.escapeHtml(s.slice(0, Math.max(0, maxChars - 3)) + '...');
    }

    async loadFirmwares(filters = {}, page = 1) {
        try {
            // 保存过滤条件，用于翻页时使用
            this.currentFilters = filters;
            this.currentPage = page;

            // 构建查询参数
            const params = new URLSearchParams();
            params.append('page', page);
            params.append('pageSize', this.pageSize);
            
            Object.keys(filters).forEach(key => {
                if (filters[key]) {
                    params.append(key, filters[key]);
                }
            });

            const response = await fetch(`/api/firmwares?${params}`);
            if (!response.ok) throw new Error('Failed to load firmwares');
            
            const result = await response.json();
            
            // 处理服务端分页响应
            this.firmwares = result.data || [];
            this.currentPage = result.pagination?.page || 1;
            this.totalPages = result.pagination?.totalPages || 1;
            this.total = result.pagination?.total || 0;
            
            this.renderFirmwares();
            
            // 更新过滤器选项
            this.updateFilterOptions();
        } catch (error) {
            console.error('Error loading firmwares:', error);
            Utils.showMessage('加载固件列表失败', 'error');
        }
    }

    renderFirmwares() {
        const grid = document.getElementById('firmwareGrid');
        if (!grid) return;

        if (this.firmwares.length === 0) {
            grid.innerHTML = '<div class="no-data">暂无固件数据</div>';
            // 清除分页控件
            const pageContainer = grid.parentElement;
            const oldPag = pageContainer?.querySelector('.pagination');
            if (oldPag) oldPag.remove();
            return;
        }

        const rowsHtml = this.firmwares.map(firmware => {
            const userRole = dashboard.currentUser?.role;
            const isTestListPage = this.currentPageId === 'test-list';
            const isAssignedToMe = userRole === 'admin' || firmware.assigned_to === dashboard.currentUser?.id;
            const notAssignedClass = (isTestListPage && !isAssignedToMe) ? 'not-assigned-to-me' : '';
            const statusClass = this.getStatusClassName(firmware.status);

            return `
                <tr class="firmware-row ${statusClass} ${notAssignedClass}">
                    <td data-label="模块">
                        <div class="cell-title">${this.escapeHtml(firmware.module_name)}</div>
                    </td>
                    <td data-label="项目">
                        <div class="cell-title">${this.escapeHtml(firmware.project_name)}</div>
                    </td>
                    <td data-label="版本">
                        <span class="version-chip">${this.escapeHtml(firmware.version_name)}</span>
                    </td>
                    <td data-label="状态">
                        <span class="status-chip ${statusClass}">${firmware.status}</span>
                    </td>
                    <td data-label="文件大小">
                        <div class="cell-meta">${Utils.formatFileSize(firmware.file_size)}</div>
                    </td>
                    <td data-label="上传时间">
                        <div class="cell-meta">${Utils.formatDate(firmware.uploaded_at)}</div>
                    </td>
                    <td data-label="其他">
                        <div class="firmware-actions">
                            <div class="action-menu-wrapper">
                                <button class="action-menu-btn" data-action="toggle-menu" data-id="${firmware.id}">
                                    <i class="fas fa-ellipsis-v"></i>
                                    <span>操作</span>
                                </button>
                                <div class="action-menu" data-menu-id="${firmware.id}">
                                    ${this.renderActionButtons(firmware)}
                                </div>
                            </div>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        grid.innerHTML = `
            <div class="firmware-table-wrapper">
                <div class="firmware-table-scroll">
                    <table class="firmware-table">
                        <thead>
                            <tr>
                                <th>模块</th>
                                <th>项目</th>
                                <th>版本</th>
                                <th>状态</th>
                                <th>文件大小</th>
                                <th>上传时间</th>
                                <th>其他</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rowsHtml}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        // 构建分页控件
        let paginationHtml = '<div class="pagination">';
        paginationHtml += `<button class="page-prev" ${this.currentPage === 1 ? 'disabled' : ''}>上一页</button>`;
        paginationHtml += `<span class="page-indicator" style="padding:6px 10px; background:rgba(0,0,0,0.06); border-radius:6px;">第 ${this.currentPage}/${this.totalPages} 页 (共 ${this.total} 条)</span>`;
        paginationHtml += `<button class="page-next" ${this.currentPage === this.totalPages ? 'disabled' : ''}>下一页</button>`;
        paginationHtml += '</div>';

        // 插入分页控件
        const pageContainer = grid.parentElement;
        const oldPag = pageContainer?.querySelector('.pagination');
        if (oldPag) oldPag.remove();
        pageContainer.insertAdjacentHTML('beforeend', paginationHtml);

        // 添加事件监听器
        this.attachFirmwareEventListeners();
        
        // 添加分页按钮事件监听
        const pag = pageContainer.querySelector('.pagination');
        if (pag) {
            const prevBtn = pag.querySelector('.page-prev');
            const nextBtn = pag.querySelector('.page-next');
            
            if (prevBtn) {
                prevBtn.addEventListener('click', () => {
                    if (this.currentPage > 1) {
                        this.loadFirmwares(this.currentFilters, this.currentPage - 1);
                    }
                });
            }
            
            if (nextBtn) {
                nextBtn.addEventListener('click', () => {
                    if (this.currentPage < this.totalPages) {
                        this.loadFirmwares(this.currentFilters, this.currentPage + 1);
                    }
                });
            }
        }
    }

    renderActionButtons(firmware) {
        const buttons = [];
        const userRole = dashboard.currentUser.role;
        const pageId = this.currentPageId;

        // 详情按钮 - 所有页面
        buttons.push(`
            <button class="action-menu-item" data-action="details" data-id="${firmware.id}">
                <i class="fas fa-info-circle"></i>
                <span class="action-menu-item-label">查看详情</span>
            </button>
        `);

        // 下载按钮 - 所有页面都有
        buttons.push(`
            <button class="action-menu-item" data-action="download" data-id="${firmware.id}">
                <i class="fas fa-download"></i>
                <span class="action-menu-item-label">下载固件</span>
            </button>
        `);

        // 根据页面显示不同的操作按钮
        if (pageId === 'upload-list') {
            // 上传列表: 下载固件、委派固件(仅pending状态)、删除固件
            // 只有待委派状态的固件才显示委派按钮
            if (firmware.status === '待委派') {
                buttons.push(`
                    <button class="action-menu-item" data-action="assign" data-id="${firmware.id}">
                        <i class="fas fa-user-check"></i>
                        <span class="action-menu-item-label">委派固件</span>
                    </button>
                `);
            }

            // 删除按钮 - 管理员或上传者
            if (userRole === 'admin' || firmware.uploaded_by === dashboard.currentUser.id) {
                buttons.push(`
                    <button class="action-menu-item delete-item" data-action="delete" data-id="${firmware.id}">
                        <i class="fas fa-trash"></i>
                        <span class="action-menu-item-label">删除固件</span>
                    </button>
                `);
            }
        } else if (pageId === 'test-list') {
            // 测试列表: 下载固件、发布固件、驳回固件
            // 检查是否委派给当前用户(测试人员需要检查权限)
            const isAssignedToMe = userRole === 'admin' || firmware.assigned_to === dashboard.currentUser.id;
            const disabledClass = !isAssignedToMe ? 'disabled' : '';
            const disabledAttr = !isAssignedToMe ? 'disabled' : '';
            const title = !isAssignedToMe ? 'title="此固件未委派给您"' : '';
            
            buttons.push(`
                <button class="action-menu-item release-item ${disabledClass}" data-action="release" data-id="${firmware.id}" ${disabledAttr} ${title}>
                    <i class="fas fa-check"></i>
                    <span class="action-menu-item-label">发布固件</span>
                </button>
            `);
            buttons.push(`
                <button class="action-menu-item reject-item ${disabledClass}" data-action="reject" data-id="${firmware.id}" ${disabledAttr} ${title}>
                    <i class="fas fa-ban"></i>
                    <span class="action-menu-item-label">驳回固件</span>
                </button>
            `);
        } else if (pageId === 'release-list') {
            // 发布列表: 下载固件、下载测试报告
            buttons.push(`
                <button class="action-menu-item" data-action="download-test-report" data-id="${firmware.id}">
                    <i class="fas fa-file-download"></i>
                    <span class="action-menu-item-label">下载报告</span>
                </button>
            `);
        } else {
            // 其他页面保留原有逻辑
            if (userRole === 'admin') {
                buttons.push(`
                    <button class="action-menu-item delete-item" data-action="delete" data-id="${firmware.id}">
                        <i class="fas fa-trash"></i>
                        <span class="action-menu-item-label">删除固件</span>
                    </button>
                `);
            } else if (userRole === 'developer' && firmware.uploaded_by === dashboard.currentUser.id) {
                if (firmware.status !== '已发布') {
                    buttons.push(`
                        <button class="action-menu-item delete-item" data-action="delete" data-id="${firmware.id}">
                            <i class="fas fa-trash"></i>
                            <span class="action-menu-item-label">删除固件</span>
                        </button>
                    `);
                }
            }
        }

        return buttons.join('');
    }

    attachFirmwareEventListeners() {
        const table = document.querySelector('.firmware-table');
        if (!table) return;

        // 菜单切换按钮
        table.querySelectorAll('.action-menu-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const firmwareId = btn.getAttribute('data-id');
                const menu = document.querySelector(`.action-menu[data-menu-id="${firmwareId}"]`);
                
                // 关闭所有其他菜单
                document.querySelectorAll('.action-menu.active').forEach(m => {
                    if (m !== menu) m.classList.remove('active');
                });
                
                // 切换当前菜单
                menu.classList.toggle('active');
            });
        });

        // 菜单项点击事件
        table.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // use currentTarget to avoid clicks on inner <i> or text nodes
                const target = e.currentTarget;
                const action = target.getAttribute('data-action');
                
                // 如果是菜单切换按钮，不执行操作
                if (action === 'toggle-menu') {
                    return;
                }
                
                const firmwareId = target.getAttribute('data-id');
                
                // 关闭菜单
                const menu = target.closest('.action-menu');
                if (menu) {
                    menu.classList.remove('active');
                }
                
                this.handleFirmwareAction(action, firmwareId);
            });
        });

        // 点击外部关闭所有菜单
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.action-menu-wrapper')) {
                document.querySelectorAll('.action-menu.active').forEach(m => {
                    m.classList.remove('active');
                });
            }
        });
    }

    async handleFirmwareAction(action, firmwareId) {
        const firmware = this.firmwares.find(f => f.id == firmwareId);
        if (!firmware) return;

        switch (action) {
            case 'download':
                this.downloadFirmware(firmwareId);
                break;
            case 'download-test-report':
                this.downloadTestReport(firmwareId);
                break;
            case 'upload-test-report':
                modalManager.showUploadTestReportModal(firmwareId);
                break;
            case 'details':
                // 使用 modal 显示完整信息
                modalManager.showFirmwareDetails(firmware);
                break;
            case 'assign':
                // 委派固件
                modalManager.showAssignFirmwareModal(firmwareId);
                break;
            case 'release':
                modalManager.showReleaseModal(firmwareId);
                break;
            case 'reject':
                // 驳回固件
                modalManager.showRejectModal(firmwareId);
                break;
            case 'obsolete':
                await this.updateFirmwareStatus(firmwareId, 'obsolete');
                break;
            case 'delete':
                if (confirm('确定要删除这个固件吗？此操作不可恢复。')) {
                    await this.deleteFirmware(firmwareId);
                }
                break;
        }
    }

    async downloadFirmware(firmwareId) {
        try {
            const response = await fetch(`/api/firmwares/${firmwareId}/download`);
            if (!response.ok) throw new Error('Download failed');

            // 从 Content-Disposition 头中获取原始文件名
            const contentDisposition = response.headers.get('Content-Disposition');
            let fileName = `firmware_${firmwareId}.bin`; // 默认文件名

            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="(.+)"/);
                if (filenameMatch && filenameMatch[1]) {
                    fileName = filenameMatch[1];
                }
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName; // 使用原始文件名
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Download error:', error);
            Utils.showMessage('下载失败', 'error');
        }
    }

    async downloadTestReport(firmwareId) {
        try {
            const response = await fetch(`/api/firmwares/${firmwareId}/download-test-report`);
            
            // 如果返回404，说明没有测试报告
            if (response.status === 404) {
                Utils.showMessage('暂无测试报告', 'warning');
                return;
            }
            
            if (!response.ok) throw new Error('Test report download failed');

            // 从 Content-Disposition 头中获取原始文件名
            const contentDisposition = response.headers.get('Content-Disposition');
            let fileName = `test_report_${firmwareId}.pdf`; // 默认文件名

            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="(.+)"/);
                if (filenameMatch && filenameMatch[1]) {
                    fileName = filenameMatch[1];
                }
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName; // 使用原始文件名
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Test report download error:', error);
            Utils.showMessage('测试报告下载失败', 'error');
        }
    }

    async updateFirmwareStatus(firmwareId, status) {
        try {
            const response = await fetch(`/api/firmwares/${firmwareId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });

            if (!response.ok) throw new Error('Status update failed');

            Utils.showMessage('状态更新成功', 'success');
            // 保持当前过滤条件和页码，避免在特定页面（如上传列表）丢失状态过滤
            await this.loadFirmwares(this.currentFilters, this.currentPage);
        } catch (error) {
            console.error('Status update error:', error);
            Utils.showMessage('状态更新失败', 'error');
        }
    }

    async deleteFirmware(firmwareId) {
        try {
            const response = await fetch(`/api/firmwares/${firmwareId}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Delete failed');

            Utils.showMessage('删除成功', 'success');
            // 删除后保持当前过滤条件和页码，避免默认加载所有状态的固件
            await this.loadFirmwares(this.currentFilters, this.currentPage);
        } catch (error) {
            console.error('Delete error:', error);
            Utils.showMessage('删除失败', 'error');
        }
    }

    async uploadFirmware() {
        const form = document.getElementById('uploadForm');
        const formData = new FormData(form);
        const submitBtn = form.querySelector('.submit-btn');
        const originalText = submitBtn.innerHTML;

        try {
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 上传中...';
            submitBtn.disabled = true;

            const response = await fetch('/api/firmwares/upload', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                Utils.showMessage('固件上传成功', 'success');
                form.reset();
                // 不跳转，停留在当前页面
            } else {
                throw new Error(data.error || 'Upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
            Utils.showMessage(`上传失败: ${error.message}`, 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    async loadModules(page = 1) {
        try {
            const params = new URLSearchParams({
                page: page,
                pageSize: this.modulesPageSize,
                search: this.moduleSearchQuery
            });
            
            const response = await fetch(`/api/modules?${params}`);
            if (!response.ok) throw new Error('Failed to load modules');
            
            const result = await response.json();
            this.modules = result.data || [];
            this.modulesPage = result.pagination?.page || 1;
            this.modulesTotalPages = result.pagination?.totalPages || 1;
            this.modulesTotal = result.pagination?.total || 0;
            
            this.renderModules();
        } catch (error) {
            console.error('Error loading modules:', error);
            Utils.showMessage('加载模块列表失败', 'error');
        }
    }

    async loadProjects(page = 1) {
        try {
            const params = new URLSearchParams({
                page: page,
                pageSize: this.projectsPageSize,
                search: this.projectSearchQuery || ''
            });

            const response = await fetch(`/api/projects?${params}`);
            if (!response.ok) throw new Error('Failed to load projects');

            const result = await response.json();
            this.projects = result.data || [];
            this.projectsPage = result.pagination?.page || 1;
            this.projectsTotalPages = result.pagination?.totalPages || 1;
            this.projectsTotal = result.pagination?.total || 0;

            this.renderProjects();
        } catch (error) {
            console.error('Error loading projects:', error);
            Utils.showMessage('加载项目列表失败', 'error');
        }
    }

    setModuleSearchQuery(query) {
        this.moduleSearchQuery = query ?? '';
        this.loadModules(1); // 重新从服务端加载第一页
    }

    setProjectSearchQuery(query) {
        this.projectSearchQuery = query ?? '';
        this.projectsPage = 1;
        this.loadProjects(1);
    }

    getFilteredProjects() {
        const keyword = this.projectSearchQuery.trim().toLowerCase();
        if (!keyword) {
            return this.projects.slice();
        }

        return this.projects.filter(project => {
            const name = (project.name || '').toLowerCase();
            const description = (project.description || '').toLowerCase();
            return name.includes(keyword) || description.includes(keyword);
        });
    }

    renderModules() {
        const list = document.getElementById('modulesList');
        if (!list) return;

        const pageContainer = document.getElementById('modules') || list.parentElement;
        const searchInput = document.getElementById('moduleSearch');
        if (searchInput && searchInput.value !== this.moduleSearchQuery) {
            searchInput.value = this.moduleSearchQuery;
        }

        if (this.modules.length === 0) {
            const message = this.moduleSearchQuery.trim() ? '未找到匹配的模块' : '暂无模块数据';
            list.innerHTML = `<div class="no-data">${message}</div>`;
            const oldPag = pageContainer?.querySelector('.pagination');
            oldPag?.remove();
            return;
        }

        const rowsHtml = this.modules.map(module => `
            <tr>
                <td data-label="模块名">
                    <div class="table-cell-title">${this.escapeHtml(module.name)}</div>
                </td>
                <td data-label="描述">
                    <div class="table-cell-description">
                        ${module.description ? this.escapeHtml(module.description) : '<span class="muted">暂无描述</span>'}
                    </div>
                </td>
                <td data-label="创建人">
                    ${this.escapeHtml(module.creator_name || '未知')}
                </td>
                <td data-label="创建时间">
                    ${Utils.formatDate(module.created_at)}
                </td>
                <td data-label="其他">
                    <div class="management-table-actions">
                        <button class="management-action-btn" data-action="toggle-menu" data-menu-id="module-${module.id}">
                            <i class="fas fa-ellipsis-v"></i>
                            操作
                        </button>
                        <div class="management-action-menu" data-menu-id="module-${module.id}">
                            ${this.renderManagementMenuItems('modules', module.id)}
                        </div>
                    </div>
                </td>
            </tr>
        `).join('');

        list.innerHTML = `
            <div class="management-table-wrapper">
                <div class="management-table-scroll">
                    <table class="management-table">
                        <thead>
                            <tr>
                                <th>模块名</th>
                                <th>描述</th>
                                <th>创建人</th>
                                <th>创建时间</th>
                                <th>其他</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rowsHtml}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        // 构建分页控件
        let paginationHtml = '<div class="pagination">';
        paginationHtml += `<button class="page-prev" ${this.modulesPage === 1 ? 'disabled' : ''}>上一页</button>`;
        paginationHtml += `<span class="page-indicator" style="padding:6px 10px; background:rgba(0,0,0,0.06); border-radius:6px;">第 ${this.modulesPage}/${this.modulesTotalPages} 页 (共 ${this.modulesTotal} 条)</span>`;
        paginationHtml += `<button class="page-next" ${this.modulesPage === this.modulesTotalPages ? 'disabled' : ''}>下一页</button>`;
        paginationHtml += '</div>';

        // 插入分页控件
        const oldPag = pageContainer.querySelector('.pagination');
        if (oldPag) oldPag.remove();
        pageContainer.insertAdjacentHTML('beforeend', paginationHtml);

        this.attachManagementEventListeners('modules');
        
        // 添加分页按钮事件监听
        const pag = pageContainer.querySelector('.pagination');
        if (pag) {
            const prevBtn = pag.querySelector('.page-prev');
            const nextBtn = pag.querySelector('.page-next');
            
            if (prevBtn) {
                prevBtn.addEventListener('click', () => {
                    if (this.modulesPage > 1) {
                        this.loadModules(this.modulesPage - 1);
                    }
                });
            }
            if (nextBtn) {
                nextBtn.addEventListener('click', () => {
                    if (this.modulesPage < this.modulesTotalPages) {
                        this.loadModules(this.modulesPage + 1);
                    }
                });
            }
        }
    }

    renderProjects() {
        const list = document.getElementById('projectsList');
        if (!list) return;

        const pageContainer = document.getElementById('projects') || list.parentElement;
        const searchInput = document.getElementById('projectSearch');
        if (searchInput && searchInput.value !== this.projectSearchQuery) {
            searchInput.value = this.projectSearchQuery;
        }

        if (!this.projects || this.projects.length === 0) {
            const message = this.projectSearchQuery.trim() ? '未找到匹配的项目' : '暂无项目数据';
            list.innerHTML = `<div class="no-data">${message}</div>`;
            const oldPag = pageContainer?.querySelector('.pagination');
            oldPag?.remove();
            return;
        }

        const rowsHtml = this.projects.map(project => `
            <tr>
                <td data-label="项目名">
                    <div class="table-cell-title">${this.escapeHtml(project.name)}</div>
                </td>
                <td data-label="描述">
                    <div class="table-cell-description">
                        ${project.description ? this.escapeHtml(project.description) : '<span class="muted">暂无描述</span>'}
                    </div>
                </td>
                <td data-label="创建人">
                    ${this.escapeHtml(project.creator_name || '未知')}
                </td>
                <td data-label="创建时间">
                    ${Utils.formatDate(project.created_at)}
                </td>
                <td data-label="其他">
                    <div class="management-table-actions">
                        <button class="management-action-btn" data-action="toggle-menu" data-menu-id="project-${project.id}">
                            <i class="fas fa-ellipsis-v"></i>
                            操作
                        </button>
                        <div class="management-action-menu" data-menu-id="project-${project.id}">
                            ${this.renderManagementMenuItems('projects', project.id)}
                        </div>
                    </div>
                </td>
            </tr>
        `).join('');

        list.innerHTML = `
            <div class="management-table-wrapper">
                <div class="management-table-scroll">
                    <table class="management-table">
                        <thead>
                            <tr>
                                <th>项目名</th>
                                <th>描述</th>
                                <th>创建人</th>
                                <th>创建时间</th>
                                <th>其他</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rowsHtml}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        // pagination controls (use service端 pagination 数据)
        const totalPages = this.projectsTotalPages || 1;
        let paginationHtml = '<div class="pagination">';
        paginationHtml += `<button class="projects-prev" ${this.projectsPage===1? 'disabled':''}>上一页</button>`;
        paginationHtml += `<span class="page-indicator" style="padding:6px 10px; background:rgba(0,0,0,0.06); border-radius:6px;">第 ${this.projectsPage}/${totalPages} 页 (共 ${this.projectsTotal || 0} 条)</span>`;
        paginationHtml += `<button class="projects-next" ${this.projectsPage===totalPages? 'disabled':''}>下一页</button>`;
        paginationHtml += '</div>';

        const oldPag = pageContainer.querySelector('.pagination');
        if (oldPag) oldPag.remove();
        pageContainer.insertAdjacentHTML('beforeend', paginationHtml);

        this.attachManagementEventListeners('projects');
        // pagination listeners (attach inside the projects tab)
        const pagProjects = pageContainer.querySelector('.pagination');
        if (pagProjects) {
            const prev = pagProjects.querySelector('.projects-prev');
            const next = pagProjects.querySelector('.projects-next');
            if (prev) prev.addEventListener('click', () => {
                if (this.projectsPage > 1) {
                    this.loadProjects(this.projectsPage - 1);
                }
            });
            if (next) next.addEventListener('click', () => {
                if (this.projectsPage < totalPages) {
                    this.loadProjects(this.projectsPage + 1);
                }
            });
        }
    }

    attachManagementEventListeners(type) {
        const container = document.getElementById(`${type}List`);
        if (!container) return;

        container.querySelectorAll('.management-action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const menuId = btn.getAttribute('data-menu-id');
                const menu = container.querySelector(`.management-action-menu[data-menu-id="${menuId}"]`);

                container.querySelectorAll('.management-action-menu.active').forEach(m => {
                    if (m !== menu) m.classList.remove('active');
                });

                // 将菜单宽度设置为与操作按钮一致。
                // 这样“模块详情”、“编辑模块”、“删除模块”的宽度将与“操作”按钮匹配。
                if (menu) {
                    // 当菜单与按钮处于同一个容器中时，offsetWidth 可以可靠地返回按钮的显示宽度。
                    // 在移动端(菜单为静态布局)时不应设置宽度。
                    const isMobile = window.matchMedia('(max-width: 960px)').matches;
                    if (!isMobile) {
                        const btnWidth = btn.offsetWidth;
                        menu.style.width = `${btnWidth}px`;
                    } else {
                        // 在移动布局上移除内联宽度，以便响应式规则生效
                        menu.style.width = '';
                    }
                }

                menu?.classList.toggle('active');
            });
        });

        container.querySelectorAll(`[data-management-action][data-management-type="${type}"]`).forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const action = btn.getAttribute('data-management-action');
                const id = btn.getAttribute('data-id');
                const menu = btn.closest('.management-action-menu');
                menu?.classList.remove('active');
                await this.handleManagementAction(type, action, id);
            });
        });

        this.ensureManagementMenuOutsideHandler();
    }

    ensureManagementMenuOutsideHandler() {
        if (this.managementMenuOutsideHandler) return;
        this.managementMenuOutsideHandler = (e) => {
            if (!e.target.closest('.management-table-actions')) {
                document.querySelectorAll('.management-action-menu.active').forEach(menu => {
                    menu.classList.remove('active');
                });
            }
        };
        document.addEventListener('click', this.managementMenuOutsideHandler);
        // resize handler: 保证当窗口大小改变时（例如列宽变化），菜单宽度仍然和按钮一致
        if (!this.managementMenuResizeHandler) {
            this.managementMenuResizeHandler = () => {
                document.querySelectorAll('.management-action-menu.active').forEach(menu => {
                    const menuId = menu.getAttribute('data-menu-id');
                    const btn = document.querySelector(`.management-action-btn[data-menu-id="${menuId}"]`);
                    if (btn) {
                        // 在 mobile 布局下使用 CSS 控制宽度
                        if (!window.matchMedia('(max-width: 960px)').matches) {
                            menu.style.width = `${btn.offsetWidth}px`;
                        } else {
                            menu.style.width = '';
                        }
                    }
                });
            };
            window.addEventListener('resize', this.managementMenuResizeHandler);
        }
    }

    renderManagementMenuItems(type, id) {
        const label = type === 'modules' ? '模块' : '项目';
        return `
            <button class="management-menu-item" data-management-action="details" data-management-type="${type}" data-id="${id}">
                <i class="fas fa-info-circle"></i>
                <span>${label}详情</span>
            </button>
            <button class="management-menu-item" data-management-action="edit" data-management-type="${type}" data-id="${id}">
                <i class="fas fa-edit"></i>
                <span>编辑${label}</span>
            </button>
            <button class="management-menu-item danger" data-management-action="delete" data-management-type="${type}" data-id="${id}">
                <i class="fas fa-trash"></i>
                <span>删除${label}</span>
            </button>
        `;
    }

    async handleManagementAction(type, action, id) {
        const collection = this[type] || [];
        const item = collection.find(entry => entry.id == id);
        if (!item && action !== 'delete') return;

        switch (action) {
            case 'details':
                this.showManagementItemDetails(type, item);
                break;
            case 'edit':
                modalManager.showEditModal(type, item);
                break;
            case 'delete':
                if (confirm(`确定要删除这个${type === 'modules' ? '模块' : '项目'}吗？`)) {
                    await this.deleteManagementItem(type, id);
                }
                break;
        }
    }

    showManagementItemDetails(type, item) {
        const itemType = type === 'modules' ? '模块' : '项目';

        const content = `
            <div class="detail-section">
                <div class="detail-item">
                    <label class="detail-label">名称:</label>
                    <div class="detail-value">${this.escapeHtml(item.name)}</div>
                </div>
                <div class="detail-item">
                    <label class="detail-label">描述:</label>
                    <div class="detail-value">${item.description ? this.escapeHtml(item.description) : '<span style="color: #999;">暂无描述</span>'}</div>
                </div>
                <div class="detail-item">
                    <label class="detail-label">创建人:</label>
                    <div class="detail-value">${item.creator_name || '未知'}</div>
                </div>
                <div class="detail-item">
                    <label class="detail-label">创建时间:</label>
                    <div class="detail-value">${Utils.formatDate(item.created_at)}</div>
                </div>
            </div>
        `;

        // 使用 modalManager 统一显示模态（右上角 X 可关闭）
        modalManager.showModal(`${itemType}详情`, content);
    }

    async deleteManagementItem(type, id) {
        try {
            const response = await fetch(`/api/${type}/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Delete failed');

            Utils.showMessage('删除成功', 'success');
            
            // 重新加载列表
            if (type === 'modules') {
                await this.loadModules();
                await this.loadModulesForSelect();
            } else {
                await this.loadProjects();
                await this.loadProjectsForSelect();
            }
        } catch (error) {
            console.error('Delete error:', error);
            Utils.showMessage('删除失败', 'error');
        }
    }

    async loadModulesForSelect() {
        try {
            // 获取所有模块用于下拉框(不分页,pageSize设置为一个大值)
            const params = new URLSearchParams({
                page: 1,
                pageSize: 1000,
                search: ''
            });
            const response = await fetch(`/api/modules?${params}`);
            if (!response.ok) throw new Error('Failed to load modules');
            
            const result = await response.json();
            const modules = result.data || [];
            
            // 更新上传表单的下拉框
            const moduleSelect = document.getElementById('moduleSelect');
            if (moduleSelect) {
                moduleSelect.innerHTML = '<option value="">请选择模块</option>' +
                    modules.map(module => 
                        `<option value="${module.id}">${module.name}</option>`
                    ).join('');
            }

            // 更新过滤器的下拉框
            const moduleFilter = document.getElementById('moduleFilter');
            if (moduleFilter) {
                moduleFilter.innerHTML = '<option value="">所有模块</option>' +
                    modules.map(module => 
                        `<option value="${module.id}">${module.name}</option>`
                    ).join('');
            }
        } catch (error) {
            console.error('Error loading modules for select:', error);
        }
    }

    async loadProjectsForSelect() {
        try {
            // 请求所有项目用于下拉（请求足够大的 pageSize）
            const params = new URLSearchParams({ page: 1, pageSize: 1000, search: '' });
            const response = await fetch(`/api/projects?${params}`);
            if (!response.ok) throw new Error('Failed to load projects');

            const result = await response.json();
            // 支持返回数组或带 data 的分页对象
            const projects = Array.isArray(result) ? result : (result.data || []);

            // 更新上传表单的下拉框
            const projectSelect = document.getElementById('projectSelect');
            if (projectSelect) {
                projectSelect.innerHTML = '<option value="">请选择项目</option>' +
                    projects.map(project => 
                        `<option value="${project.id}">${project.name}</option>`
                    ).join('');
            }

            // 更新过滤器的下拉框
            const projectFilter = document.getElementById('projectFilter');
            if (projectFilter) {
                projectFilter.innerHTML = '<option value="">所有项目</option>' +
                    projects.map(project => 
                        `<option value="${project.id}">${project.name}</option>`
                    ).join('');
            }
        } catch (error) {
            console.error('Error loading projects for select:', error);
        }
    }

    updateFilterOptions() {
        // 可以在这里添加更复杂的过滤器更新逻辑
    }

    getStatusDisplayName(status) {
        const statusMap = {
            'pending': '待委派',
            'assigned': '待发布',
            'released': '已发布',
            'rejected': '已驳回'
        };
        return statusMap[status] || status;
    }

    // 将中文状态转换为英文CSS类名
    getStatusClassName(status) {
        const classMap = {
            '待委派': 'pending',
            '待发布': 'assigned',
            '已发布': 'released',
            '已驳回': 'rejected'
        };
        return classMap[status] || status;
    }
}

// 初始化固件管理器
const firmwareManager = new FirmwareManager();