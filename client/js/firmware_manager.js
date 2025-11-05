class FirmwareManager {
    constructor() {
        this.firmwares = [];
        this.modules = [];
        this.projects = [];
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
    
        grid.innerHTML = this.firmwares.map(firmware => `
            <div class="firmware-card" data-id="${firmware.id}">
                <div class="firmware-header">
                    <div class="firmware-info">
                        <div class="firmware-title">${firmware.module_name} - ${firmware.project_name}</div>
                        <div class="firmware-version">${firmware.version}</div>
                    </div>
                    <span class="status-badge ${firmware.status}">${this.getStatusDisplayName(firmware.status)}</span>
                </div>
                <div class="firmware-meta">
                    <div class="meta-item">
                        <i class="fas fa-user"></i>
                        <span>上传者: ${firmware.uploader_name}</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-calendar"></i>
                        <span>上传时间: ${Utils.formatDate(firmware.created_at)}</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-database"></i>
                        <span>文件大小: ${Utils.formatFileSize(firmware.file_size)}</span>
                    </div>
                    ${firmware.description ? `
                    <div class="meta-item">
                        <i class="fas fa-file-alt"></i>
                        <span>发布描述: ${firmware.description}</span>
                    </div>` : ''}
                    ${firmware.additional_info ? `
                    <div class="meta-item">
                        <i class="fas fa-info-circle"></i>
                        <span>补充信息: ${firmware.additional_info}</span>
                    </div>` : ''}
                </div>
                <div class="firmware-actions">
                    ${this.renderActionButtons(firmware)}
                </div>
            </div>
        `).join('');
                    
        // 添加事件监听器
        this.attachFirmwareEventListeners();
    }

    renderActionButtons(firmware) {
        const buttons = [];
        const userRole = dashboard.currentUser.role;

        // 下载按钮 - 所有用户可见
        buttons.push(`
            <button class="action-btn download-btn" data-action="download" data-id="${firmware.id}">
                <i class="fas fa-download"></i> 下载
            </button>
        `);

        // 测试报告相关按钮 - 所有人均可下载
        // if (userRole === 'tester' || userRole === 'admin') {
            if (!firmware.test_report_path && userRole === 'tester') {
                buttons.push(`
                    <button class="action-btn u_test-btn" data-action="upload-test-report" data-id="${firmware.id}">
                        <i class="fas fa-upload"></i> 提交测试报告
                    </button>
                `);
            } else if (firmware.test_report_path) {
                buttons.push(`
                    <button class="action-btn d_test-btn" data-action="download-test-report" data-id="${firmware.id}">
                        <i class="fas fa-file-download"></i> 获取测试报告
                    </button>
                `);
            }
        // }

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

        return buttons.join('');
    }

    attachFirmwareEventListeners() {
        document.querySelectorAll('.firmware-card [data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.getAttribute('data-action');
                const firmwareId = e.target.getAttribute('data-id');
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
                dashboard.switchPage('firmware-list');
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

        list.innerHTML = this.modules.map(module => `
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

        this.attachManagementEventListeners('modules');
    }

    renderProjects() {
        const list = document.getElementById('projectsList');
        if (!list) return;

        if (this.projects.length === 0) {
            list.innerHTML = '<div class="no-data">暂无项目数据</div>';
            return;
        }

        list.innerHTML = this.projects.map(project => `
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

        this.attachManagementEventListeners('projects');
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