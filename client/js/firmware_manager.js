/*
 * @Author: aurson jassimxiong@gmail.com
 * @Date: 2025-09-14 17:33:37
 * @LastEditors: aurson jassimxiong@gmail.com
 * @LastEditTime: 2025-11-06 11:11:30
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
        // pagination state
        this.pageSize = 10; // items per page
        this.currentPage = 1; // firmware list page
        this.modulesPage = 1;
        this.projectsPage = 1;
        // re-render firmwares on resize to recalc columns/rows
        window.addEventListener('resize', () => {
            const grid = document.getElementById('firmwareGrid');
            if (grid) this.renderFirmwares();
        });
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

    async loadFirmwares(filters = {}) {
        try {
            // 构建查询参数
            const params = new URLSearchParams();
            Object.keys(filters).forEach(key => {
                if (filters[key]) {
                    params.append(key, filters[key]);
                }
            });

            const response = await fetch(`/api/firmwares?${params}`);
            if (!response.ok) throw new Error('Failed to load firmwares');
            
            this.firmwares = await response.json();
            this.currentPage = 1; // reset to first page on reload
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
            return;
        }
    // pagination logic: show 2 rows per page (dynamically calculate columns based on container width)
    const total = this.firmwares.length;
    const containerWidth = grid.clientWidth || grid.offsetWidth || 900;
    const cardMinWidth = 300; // matches CSS min width for cards
    const columns = Math.max(1, Math.floor(containerWidth / cardMinWidth));
    const itemsPerPage = columns * 2; // two rows
    const totalPages = Math.max(1, Math.ceil(total / itemsPerPage));
    if (this.currentPage > totalPages) this.currentPage = totalPages;
    const start = (this.currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageItems = this.firmwares.slice(start, end);

        grid.innerHTML = pageItems.map(firmware => `
            <div class="firmware-card ${firmware.status || ''}" data-id="${firmware.id}">
                <div class="firmware-header">
                    <div class="firmware-info">
                        <div class="firmware-title">${firmware.module_name} - ${firmware.project_name}</div>
                        <div style="display:inline-flex; align-items:center; gap:8px;">
                            <div class="version-status ${firmware.status || ''}">
                                <span class="version-text">${firmware.version}</span>
                                <span class="status-text">${this.getStatusDisplayName(firmware.status)}</span>
                            </div>
                            <button class="action-btn details-btn" data-action="details" data-id="${firmware.id}">
                                <i class="fas fa-info-circle"></i> 详情
                            </button>
                        </div>
                    </div>
                </div>
                <div class="firmware-meta">
                    <div class="meta-item">
                        <i class="fas fa-user"></i>
                        <span>上传人员: ${firmware.uploader_name || '未知'}</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-calendar"></i>
                        <span>上传时间: ${Utils.formatDate(firmware.created_at)}</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-database"></i>
                        <span>文件大小: ${Utils.formatFileSize(firmware.file_size)}</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-file-alt"></i>
                        <span class="meta-truncated">固件描述: ${ (firmware.description && String(firmware.description).trim()) ? this.truncateAndEscape(firmware.description, 80) : '无' }</span>
                    </div>
                </div>
                <div class="firmware-actions">
                    ${this.renderActionButtons(firmware)}
                </div>
            </div>
        `).join('');

        // build pagination controls (show current/total)
        let paginationHtml = '<div class="pagination">';
        paginationHtml += `<button class="page-prev" data-page="${Math.max(1, this.currentPage - 1)}" ${this.currentPage===1? 'disabled':''}>上一页</button>`;
        paginationHtml += `<span class="page-indicator" style="padding:6px 10px; background:rgba(0,0,0,0.06); border-radius:6px;">${this.currentPage}/${totalPages}</span>`;
        paginationHtml += `<button class="page-next" data-page="${Math.min(totalPages, this.currentPage + 1)}" ${this.currentPage===totalPages? 'disabled':''}>下一页</button>`;
        paginationHtml += '</div>';

        // 插入到固件列表页面区域底部（不包含侧边栏），先移除旧的分页节点再插入，避免重复
        const pageContainer = document.getElementById('firmware-list') || grid.parentElement;
        const oldPag = pageContainer.querySelector('.pagination');
        if (oldPag) oldPag.remove();
        pageContainer.insertAdjacentHTML('beforeend', paginationHtml);

        // 添加事件监听器
        this.attachFirmwareEventListeners();
        // attach pagination listeners (inside the firmware-list container)
        const pag = pageContainer.querySelector('.pagination');
        if (pag) {
            const prevBtn = pag.querySelector('.page-prev');
            const nextBtn = pag.querySelector('.page-next');
            if (prevBtn) prevBtn.addEventListener('click', () => {
                const page = parseInt(prevBtn.getAttribute('data-page')) || 1;
                this.currentPage = page;
                this.renderFirmwares();
            });
            if (nextBtn) nextBtn.addEventListener('click', () => {
                const page = parseInt(nextBtn.getAttribute('data-page')) || totalPages;
                this.currentPage = page;
                this.renderFirmwares();
            });
        }
    }

    renderActionButtons(firmware) {
        const buttons = [];
        const userRole = dashboard.currentUser.role;

        // 测试报告相关按钮已移至详情页（详情页中会根据权限显示“获取/下载测试报告”或“提交测试报告”）

        // 下载按钮 - 所有用户可见
        buttons.push(`
            <button class="action-btn download-btn" data-action="download" data-id="${firmware.id}">
                <i class="fas fa-download"></i> 下载
            </button>
        `);

        // 测试流程按钮
        if (firmware.environment === 'test') {
            if (userRole === 'tester' || userRole === 'admin') {
                if (firmware.status === 'pending' || firmware.status === 'testing') {
                    buttons.push(`
                        <button class="action-btn release-btn" data-action="release" data-id="${firmware.id}">
                            <i class="fas fa-check"></i> 发布
                        </button>
                    `);
                    buttons.push(`
                        <button class="action-btn obsolete-btn" data-action="obsolete" data-id="${firmware.id}">
                            <i class="fas fa-times"></i> 作废
                        </button>
                    `);
                }
            }
        }

        // 删除按钮 - 管理员和上传者
        if (userRole === 'admin' || firmware.uploaded_by === dashboard.currentUser.id) {
            buttons.push(`
                <button class="action-btn delete-btn" data-action="delete" data-id="${firmware.id}">
                    <i class="fas fa-trash"></i> 删除
                </button>
            `);
        }

        // 详情按钮改为放置在状态后方（在 renderFirmwares 中内联渲染），这里不再加入到按钮组中

        return buttons.join('');
    }

    attachFirmwareEventListeners() {
        document.querySelectorAll('.firmware-card [data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // use currentTarget to avoid clicks on inner <i> or text nodes
                const target = e.currentTarget;
                const action = target.getAttribute('data-action');
                const firmwareId = target.getAttribute('data-id');
                this.handleFirmwareAction(action, firmwareId);
            });
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
            case 'release':
                await this.updateFirmwareStatus(firmwareId, 'released');
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
            await this.loadFirmwares();
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
            await this.loadFirmwares();
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
                await this.loadFirmwares();
                
                // 切换到固件列表页面
                window.location.href = '/firmwares';
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

    async loadModules() {
        try {
            const response = await fetch('/api/modules');
            if (!response.ok) throw new Error('Failed to load modules');
            
            this.modules = await response.json();
            this.modulesPage = 1;
            this.renderModules();
        } catch (error) {
            console.error('Error loading modules:', error);
            Utils.showMessage('加载模块列表失败', 'error');
        }
    }

    async loadProjects() {
        try {
            const response = await fetch('/api/projects');
            if (!response.ok) throw new Error('Failed to load projects');
            
            this.projects = await response.json();
            this.projectsPage = 1;
            this.renderProjects();
        } catch (error) {
            console.error('Error loading projects:', error);
            Utils.showMessage('加载项目列表失败', 'error');
        }
    }

    renderModules() {
        const list = document.getElementById('modulesList');
        if (!list) return;

        if (this.modules.length === 0) {
            list.innerHTML = '<div class="no-data">暂无模块数据</div>';
            return;
        }
        // pagination for modules
        const total = this.modules.length;
        const totalPages = Math.max(1, Math.ceil(total / this.pageSize));
        if (this.modulesPage > totalPages) this.modulesPage = totalPages;
        const start = (this.modulesPage - 1) * this.pageSize;
        const end = start + this.pageSize;
        const pageItems = this.modules.slice(start, end);

        list.innerHTML = pageItems.map(module => `
            <div class="management-item">
                <div>
                    <strong>${module.name}</strong>
                    ${module.description ? `<p>${module.description}</p>` : ''}
                    <small>创建时间: ${Utils.formatDate(module.created_at)}</small>
                </div>
                <div class="item-actions">
                    <button class="edit-btn" data-id="${module.id}">编辑</button>
                    <button class="delete-btn" data-id="${module.id}">删除</button>
                </div>
            </div>
        `).join('');

        // pagination controls (compact current/total) — insert into modules tab container
        let paginationHtml = '<div class="pagination">';
        paginationHtml += `<button class="modules-prev" data-page="${Math.max(1, this.modulesPage - 1)}" ${this.modulesPage===1? 'disabled':''}>上一页</button>`;
        paginationHtml += `<span class="page-indicator" style="padding:6px 10px; background:rgba(0,0,0,0.06); border-radius:6px;">${this.modulesPage}/${totalPages}</span>`;
        paginationHtml += `<button class="modules-next" data-page="${Math.min(totalPages, this.modulesPage + 1)}" ${this.modulesPage===totalPages? 'disabled':''}>下一页</button>`;
        paginationHtml += '</div>';

        // insert pagination into the modules tab (not the whole page bottom)
        const pageContainer = document.getElementById('modules') || list.parentElement;
        const oldPag = pageContainer.querySelector('.pagination');
        if (oldPag) oldPag.remove();
        pageContainer.insertAdjacentHTML('beforeend', paginationHtml);

        this.attachManagementEventListeners('modules');
        // pagination listeners (attach inside the modules tab)
        const pagModules = pageContainer.querySelector('.pagination');
        if (pagModules) {
            const prev = pagModules.querySelector('.modules-prev');
            const next = pagModules.querySelector('.modules-next');
            if (prev) prev.addEventListener('click', () => {
                const p = parseInt(prev.getAttribute('data-page')) || 1;
                this.modulesPage = p;
                this.renderModules();
            });
            if (next) next.addEventListener('click', () => {
                const p = parseInt(next.getAttribute('data-page')) || totalPages;
                this.modulesPage = p;
                this.renderModules();
            });
        }
    }

    renderProjects() {
        const list = document.getElementById('projectsList');
        if (!list) return;

        if (this.projects.length === 0) {
            list.innerHTML = '<div class="no-data">暂无项目数据</div>';
            return;
        }
        // pagination for projects
        const total = this.projects.length;
        const totalPages = Math.max(1, Math.ceil(total / this.pageSize));
        if (this.projectsPage > totalPages) this.projectsPage = totalPages;
        const start = (this.projectsPage - 1) * this.pageSize;
        const end = start + this.pageSize;
        const pageItems = this.projects.slice(start, end);

        list.innerHTML = pageItems.map(project => `
            <div class="management-item">
                <div>
                    <strong>${project.name}</strong>
                    ${project.description ? `<p>${project.description}</p>` : ''}
                    <small>创建时间: ${Utils.formatDate(project.created_at)}</small>
                </div>
                <div class="item-actions">
                    <button class="edit-btn" data-id="${project.id}">编辑</button>
                    <button class="delete-btn" data-id="${project.id}">删除</button>
                </div>
            </div>
        `).join('');

        // pagination controls (compact current/total) — insert into projects tab container
        let paginationHtml = '<div class="pagination">';
        paginationHtml += `<button class="projects-prev" data-page="${Math.max(1, this.projectsPage - 1)}" ${this.projectsPage===1? 'disabled':''}>上一页</button>`;
        paginationHtml += `<span class="page-indicator" style="padding:6px 10px; background:rgba(0,0,0,0.06); border-radius:6px;">${this.projectsPage}/${totalPages}</span>`;
        paginationHtml += `<button class="projects-next" data-page="${Math.min(totalPages, this.projectsPage + 1)}" ${this.projectsPage===totalPages? 'disabled':''}>下一页</button>`;
        paginationHtml += '</div>';

        const pageContainer = document.getElementById('projects') || list.parentElement;
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
                const p = parseInt(prev.getAttribute('data-page')) || 1;
                this.projectsPage = p;
                this.renderProjects();
            });
            if (next) next.addEventListener('click', () => {
                const p = parseInt(next.getAttribute('data-page')) || totalPages;
                this.projectsPage = p;
                this.renderProjects();
            });
        }
    }

    attachManagementEventListeners(type) {
        document.querySelectorAll(`#${type}List .edit-btn`).forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                const item = this[type].find(item => item.id == id);
                modalManager.showEditModal(type, item);
            });
        });

        document.querySelectorAll(`#${type}List .delete-btn`).forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.getAttribute('data-id');
                if (confirm(`确定要删除这个${type === 'modules' ? '模块' : '项目'}吗？`)) {
                    await this.deleteManagementItem(type, id);
                }
            });
        });
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
            const response = await fetch('/api/modules');
            if (!response.ok) throw new Error('Failed to load modules');
            
            const modules = await response.json();
            
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
            const response = await fetch('/api/projects');
            if (!response.ok) throw new Error('Failed to load projects');
            
            const projects = await response.json();
            
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
            'pending': '待测试',
            'testing': '测试中',
            'passed': '测试通过',
            'failed': '测试失败',
            'released': '已发布',
            'obsolete': '已作废'
        };
        return statusMap[status] || status;
    }
}

// 初始化固件管理器
const firmwareManager = new FirmwareManager();