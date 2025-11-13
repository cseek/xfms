/*
 * @Author: aurson jassimxiong@gmail.com
 * @Date: 2025-09-14 17:33:37
 * @LastEditors: aurson jassimxiong@gmail.com
 * @LastEditTime: 2025-11-07 04:43:47
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

class ModalManager {
    constructor() {
        this.modal = document.getElementById('modal');
        this.modalBody = document.getElementById('modalBody');
        // 不再假设页面初始存在 .close 元素，showModal 会动态注入关闭 X
        this.closeBtn = null;

        this.init();
    }

    init() {
        // 点击模态框外部关闭
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hideModal();
            }
        });

        // ESC键关闭
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.style.display === 'block') {
                this.hideModal();
            }
        });
    }

    showModal(title, content) {
        // 在 modal-content 内注入右上角关闭 X（使用 .close 样式）
        // 仅在 title 非空时渲染标题
        const titleHtml = (title !== null && title !== undefined && String(title).trim() !== '')
            ? `<h2 class="modal-title">${title}</h2>`
            : '';

        const html = `
            <span class="close" aria-label="关闭">&times;</span>
            ${titleHtml}
            ${content}
        `;

        this.modalBody.innerHTML = html;

        // 将 modal 显示，并禁止 body 滚动
        this.modal.style.display = 'block';
        document.body.style.overflow = 'hidden';

        // 绑定动态注入的关闭按钮事件
        const dynamicClose = this.modal.querySelector('.modal-content .close') || this.modal.querySelector('.close');
        if (dynamicClose) {
            // 保存引用以便在 hideModal 中移除事件
            this.closeBtn = dynamicClose;
            this.closeBtn.addEventListener('click', () => this.hideModal());
        }
    }

    // 简单 HTML 转义，防止注入
    escapeHtml(str) {
        if (str == null) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    hideModal() {
        // 隐藏并清理动态事件
        this.modal.style.display = 'none';
        document.body.style.overflow = 'auto';

        if (this.closeBtn) {
            try { this.closeBtn.removeEventListener('click', () => this.hideModal()); } catch (e) { /* ignore */ }
            this.closeBtn = null;
        }

        // 清空 modal body，避免残留 DOM
        if (this.modalBody) this.modalBody.innerHTML = '';
    }
    
    showAddModuleModal() {
        const content = `
            <form id="addModuleForm" class="modal-form">
                <div class="form-group">
                    <label for="moduleName">模块名称 *</label>
                    <input type="text" id="moduleName" name="name" required 
                           placeholder="请输入模块名称"
                           oninput="this.setCustomValidity('')">
                    <div class="validation-message" id="moduleNameValidation"></div>
                </div>
                <div class="form-group">
                    <label for="moduleDescription">模块描述</label>
                    <textarea id="moduleDescription" name="description" rows="3" 
                              placeholder="请输入模块描述..."></textarea>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-cancel" onclick="modalManager.hideModal()">取消</button>
                    <button type="submit" class="btn-submit">确认</button>
                </div>
            </form>
        `;
    
        this.showModal('添加模块', content);
    
        // 添加表单验证
        const form = document.getElementById('addModuleForm');
        const nameInput = document.getElementById('moduleName');
        const validationMessage = document.getElementById('moduleNameValidation');
    
        nameInput.addEventListener('input', function() {
            if (this.value.trim() === '') {
                validationMessage.textContent = '模块名称不能为空';
                validationMessage.style.color = '#f44336';
            } else {
                validationMessage.textContent = '';
            }
        });
    
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const moduleName = nameInput.value.trim();
            if (!moduleName) {
                validationMessage.textContent = '模块名称不能为空';
                validationMessage.style.color = '#f44336';
                nameInput.focus();
                return;
            }
        
            await this.addModule();
        });
    }

    showAddProjectModal() {
        const content = `
            <form id="addProjectForm" class="modal-form">
                <div class="form-group">
                    <label for="projectName">项目名称 *</label>
                    <input type="text" id="projectName" name="name" required 
                           placeholder="请输入项目名称" 
                           oninput="this.setCustomValidity('')">
                    <div class="validation-message" id="projectNameValidation"></div>
                </div>
                <div class="form-group">
                    <label for="projectDescription">项目描述</label>
                    <textarea id="projectDescription" name="description" rows="3" 
                              placeholder="请输入项目描述..."></textarea>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-cancel" onclick="modalManager.hideModal()">取消</button>
                    <button type="submit" class="btn-submit">确认</button>
                </div>
            </form>
        `;

        this.showModal('添加项目', content);

        // 添加表单验证
        const form = document.getElementById('addProjectForm');
        const nameInput = document.getElementById('projectName');
        const validationMessage = document.getElementById('projectNameValidation');

        nameInput.addEventListener('input', function() {
            if (this.value.trim() === '') {
                validationMessage.textContent = '项目名称不能为空';
                validationMessage.style.color = '#f44336';
            } else {
                validationMessage.textContent = '';
            }
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const projectName = nameInput.value.trim();
            if (!projectName) {
                validationMessage.textContent = '项目名称不能为空';
                validationMessage.style.color = '#f44336';
                nameInput.focus();
                return;
            }

            await this.addProject();
        });
    }

    showAddUserModal() {
        const content = `
            <form id="addUserForm" class="modal-form">
                <div class="form-group">
                    <label for="userUsername">用户 *</label>
                    <input type="text" id="userUsername" name="username" required>
                </div>
                <div class="form-group">
                    <label for="userPassword">密码 *</label>
                    <input type="password" id="userPassword" name="password" required>
                </div>
                <div class="form-group">
                    <label for="userRole">角色 *</label>
                    <select id="userRole" name="role" required>
                        <option value="">请选择角色</option>
                        <option value="developer">研发人员</option>
                        <option value="tester">测试人员</option>
                        <option value="user">普通用户</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="userEmail">邮箱</label>
                    <input type="email" id="userEmail" name="email">
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-cancel" onclick="modalManager.hideModal()">取消</button>
                    <button type="submit" class="btn-submit">确认</button>
                </div>
            </form>
        `;

        this.showModal('添加用户', content);

        document.getElementById('addUserForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.addUser();
        });
    }

    showEditModal(type, item) {
        const isModule = type === 'modules';
        const title = isModule ? '编辑模块' : '编辑项目';
        const content = `
            <form id="editForm" class="modal-form">
                <div class="form-group">
                    <label for="editName">${isModule ? '模块' : '项目'}名称 *</label>
                    <input type="text" id="editName" name="name" value="${item.name}" required>
                </div>
                <div class="form-group">
                    <label for="editDescription">${isModule ? '模块' : '项目'}描述</label>
                    <textarea id="editDescription" name="description" rows="3">${item.description || ''}</textarea>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-cancel" onclick="modalManager.hideModal()">取消</button>
                    <button type="submit" class="btn-submit">确认</button>
                </div>
            </form>
        `;

        this.showModal(title, content);

        document.getElementById('editForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.updateItem(type, item.id);
        });
    }

    showEditUserModal(user) {
        const content = `
            <form id="editUserForm" class="modal-form">
                <div class="form-group">
                    <label for="editUserUsername">用户</label>
                    <input type="text" id="editUserUsername" value="${user.username}" disabled>
                    <small>用户不可修改</small>
                </div>
                <div class="form-group">
                    <label for="editUserPassword">新密码</label>
                    <input type="password" id="editUserPassword" name="password" placeholder="留空则不修改密码">
                </div>
                <div class="form-group">
                    <label for="editUserRole">角色 *</label>
                    <select id="editUserRole" name="role" required>
                        <option value="developer" ${user.role === 'developer' ? 'selected' : ''}>研发人员</option>
                        <option value="tester" ${user.role === 'tester' ? 'selected' : ''}>测试人员</option>
                        <option value="user" ${user.role === 'user' ? 'selected' : ''}>普通用户</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="editUserEmail">邮箱</label>
                    <input type="email" id="editUserEmail" name="email" value="${user.email || ''}">
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-cancel" onclick="modalManager.hideModal()">取消</button>
                    <button type="submit" class="btn-submit">确认</button>
                </div>
            </form>
        `;

        this.showModal('编辑用户', content);

        document.getElementById('editUserForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.updateUser(user.id);
        });
    }

    showUploadTestReportModal(firmwareId) {
        const content = `
            <form id="uploadTestReportForm" class="modal-form">
                <div class="form-group">
                    <label for="testReportFile">测试报告文件 *</label>
                    <input type="file" id="testReportFile" name="test_report" accept=".pdf,.doc,.docx,.txt" required>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-cancel" onclick="modalManager.hideModal()">取消</button>
                    <button type="submit" class="btn-submit">确认</button>
                </div>
            </form>
        `;

        this.showModal('上传测试报告', content);

        document.getElementById('uploadTestReportForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.uploadTestReport(firmwareId);
        });
    }

    async showAssignFirmwareModal(firmwareId) {
        try {
            // 获取测试人员列表（使用仅需登录即可访问的接口，避免 admin 权限限制）
            const response = await fetch('/api/users/testers');
            if (!response.ok) throw new Error('获取测试人员列表失败');
            
            // API 返回的就是测试人员列表（id, username, email）
            const testers = await response.json();

            if (!Array.isArray(testers) || testers.length === 0) {
                Utils.showMessage('没有可用的测试人员', 'error');
                return;
            }

            const testersOptions = testers.map(tester => 
                `<option value="${tester.id}">${tester.username} (${tester.email || '无邮箱'})</option>`
            ).join('');
            
            const content = `
                <form id="assignFirmwareForm" class="modal-form">
                    <div class="form-group">
                        <label for="assignedTester">委派给测试人员 *</label>
                        <select id="assignedTester" name="assigned_to" required>
                            <option value="">请选择测试人员</option>
                            ${testersOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="assignNote">委派说明 *</label>
                        <textarea id="assignNote" name="assign_note" rows="3" placeholder="请填写委派说明或测试要求" required oninput="this.setCustomValidity('')"></textarea>
                        <div class="validation-message" id="assignNoteValidation" style="color:#f44336"></div>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn-cancel" onclick="modalManager.hideModal()">取消</button>
                        <button type="submit" class="btn-submit">确认</button>
                    </div>
                </form>
            `;
            
            this.showModal('委派固件', content);
            
            const assignForm = document.getElementById('assignFirmwareForm');
            const assignNoteInput = document.getElementById('assignNote');
            const assignNoteValidation = document.getElementById('assignNoteValidation');

            assignNoteInput.addEventListener('input', function() {
                if (this.value.trim() === '') {
                    assignNoteValidation.textContent = '委派说明不能为空';
                } else {
                    assignNoteValidation.textContent = '';
                }
            });

            assignForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                if (assignNoteInput.value.trim() === '') {
                    assignNoteValidation.textContent = '委派说明不能为空';
                    assignNoteInput.focus();
                    return;
                }
                await this.assignFirmware(firmwareId);
            });
        } catch (error) {
            console.error('Error showing assign modal:', error);
            Utils.showMessage('显示委派对话框失败', 'error');
        }
    }

    async assignFirmware(firmwareId) {
        const form = document.getElementById('assignFirmwareForm');
        const formData = new FormData(form);
        const assignedTo = formData.get('assigned_to');
        const assignNote = formData.get('assign_note');
        
        try {
            const response = await fetch(`/api/firmwares/${firmwareId}/assign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    assigned_to: parseInt(assignedTo),
                    assign_note: assignNote 
                })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || '委派失败');
            }
            
            Utils.showMessage('固件委派成功', 'success');
            this.hideModal();
            
            // 跳转到上传列表-所有固件
            window.location.href = '/uploads?filter=all';
        } catch (error) {
            console.error('Error assigning firmware:', error);
            Utils.showMessage(error.message || '固件委派失败', 'error');
        }
    }

    showReleaseModal(firmwareId) {
        const content = `
            <form id="releaseFirmwareForm" class="modal-form">
                <div class="form-group">
                    <label for="releaseNotes">测后说明 *</label>
                    <textarea id="releaseNotes" name="release_notes" rows="4" placeholder="请填写测后说明..." required></textarea>
                </div>
                <div class="form-group">
                    <label for="testReportFile">测试报告文件（可选）</label>
                    <input type="file" id="testReportFile" name="test_report" accept=".pdf,.doc,.docx,.txt,.zip">
                    <small style="color: #666; margin-top: 4px; display: block;">如果有测试报告，请在此上传</small>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-cancel" onclick="modalManager.hideModal()">取消</button>
                    <button type="submit" class="btn-submit">确认</button>
                </div>
            </form>
        `;

        this.showModal('发布固件', content);

        document.getElementById('releaseFirmwareForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.releaseFirmware(firmwareId);
        });
    }

    async releaseFirmware(firmwareId) {
        const form = document.getElementById('releaseFirmwareForm');
        const formData = new FormData(form);
        const releaseNotes = formData.get('release_notes');
        const testReportFile = formData.get('test_report');

        const submitBtn = form.querySelector('.btn-submit');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = '发布中...';
        submitBtn.disabled = true;

        try {
            // 如果有测试报告文件,先上传测试报告
            if (testReportFile && testReportFile.size > 0) {
                const testReportFormData = new FormData();
                testReportFormData.append('test_report', testReportFile);

                const uploadResponse = await fetch(`/api/firmwares/${firmwareId}/test-report`, {
                    method: 'POST',
                    body: testReportFormData
                });

                if (!uploadResponse.ok) {
                    const error = await uploadResponse.json();
                    throw new Error(error.error || '测试报告上传失败');
                }
            }

            // 然后更新固件状态为已发布
            const releaseResponse = await fetch(`/api/firmwares/${firmwareId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    status: '已发布',
                    release_notes: releaseNotes
                })
            });

            if (!releaseResponse.ok) {
                const error = await releaseResponse.json();
                throw new Error(error.error || '固件发布失败');
            }

            Utils.showMessage('固件发布成功', 'success');
            this.hideModal();

            // 跳转到测试列表-所有固件
            window.location.href = '/tests?filter=all';
        } catch (error) {
            console.error('Error releasing firmware:', error);
            Utils.showMessage(error.message || '固件发布失败', 'error');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    showRejectModal(firmwareId) {
        const content = `
            <form id="rejectFirmwareForm" class="modal-form">
                <div class="form-group">
                    <label for="rejectReason">驳回原因 *</label>
                    <textarea id="rejectReason" name="reject_reason" rows="4" placeholder="请填写驳回原因..." required></textarea>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-cancel" onclick="modalManager.hideModal()">取消</button>
                    <button type="submit" class="btn-submit">确认</button>
                </div>
            </form>
        `;

        this.showModal('驳回固件', content);

        document.getElementById('rejectFirmwareForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.rejectFirmware(firmwareId);
        });
    }

    async rejectFirmware(firmwareId) {
        const form = document.getElementById('rejectFirmwareForm');
        const formData = new FormData(form);
        const rejectReason = formData.get('reject_reason');

        const submitBtn = form.querySelector('.btn-submit');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = '驳回中...';
        submitBtn.disabled = true;

        try {
            const response = await fetch(`/api/firmwares/${firmwareId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    status: '已驳回',
                    reject_reason: rejectReason
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || '固件驳回失败');
            }

            Utils.showMessage('固件驳回成功', 'success');
            this.hideModal();

            // 跳转到测试列表-所有固件
            window.location.href = '/tests?filter=all';
        } catch (error) {
            console.error('Error rejecting firmware:', error);
            Utils.showMessage(error.message || '固件驳回失败', 'error');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    async addModule() {
        await this.submitForm('/api/modules', 'addModuleForm', '模块添加成功');
    }

    async addProject() {
        await this.submitForm('/api/projects', 'addProjectForm', '项目添加成功');
    }

    async addUser() {
        await this.submitForm('/api/users', 'addUserForm', '用户添加成功');
    }

    async updateItem(type, itemId) {
        await this.submitForm(`/api/${type}/${itemId}`, 'editForm', `${type === 'modules' ? '模块' : '项目'}更新成功`, 'PUT');
    }

    async updateUser(userId) {
        await this.submitForm(`/api/users/${userId}`, 'editUserForm', '用户更新成功', 'PUT');
    }

    async uploadTestReport(firmwareId) {
        const form = document.getElementById('uploadTestReportForm');
        const formData = new FormData(form);
        
        try {
            const response = await fetch(`/api/firmwares/${firmwareId}/test-report`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error('Upload failed');

            const data = await response.json();
            Utils.showMessage('测试报告上传成功', 'success');
            this.hideModal();
            
            // 重新加载固件列表
            await firmwareManager.loadFirmwares();
        } catch (error) {
            console.error('Test report upload error:', error);
            Utils.showMessage('测试报告上传失败', 'error');
        }
    }

    async submitForm(url, formId, successMessage, method = 'POST') {
        const form = document.getElementById(formId);
        const submitBtn = form.querySelector('.btn-submit');
        const originalText = submitBtn.textContent;

        try {
            submitBtn.textContent = '处理中...';
            submitBtn.disabled = true;

            // 构建请求数据对象
            const formData = new FormData(form);
            const data = {};

            // 将 FormData 转换为普通对象，便于调试
            for (let [key, value] of formData.entries()) {
                data[key] = value;
                console.log(`表单字段: ${key} = ${value}`);
            }

            console.log('提交的数据:', data);

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Request failed');
            }

            Utils.showMessage(successMessage, 'success');
            this.hideModal();

            // 重新加载相关数据
            if (url.includes('/modules')) {
                await firmwareManager.loadModules();
                await firmwareManager.loadModulesForSelect();
            } else if (url.includes('/projects')) {
                await firmwareManager.loadProjects();
                await firmwareManager.loadProjectsForSelect();
            } else if (url.includes('/users')) {
                await userManager.loadUsers();
            }
        } catch (error) {
            console.error('Form submission error:', error);
            Utils.showMessage(`操作失败: ${error.message}`, 'error');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    showFirmwareDetails(firmware) {
        const fileName = firmware.file_path ? firmware.file_path.split('/').pop() : '未知文件';
        const testReportName = firmware.test_report_path ? firmware.test_report_path.split('/').pop() : null;
        
        // 获取当前页面ID
        const currentPageId = firmwareManager.currentPageId;
        
        // 状态徽章样式
        const statusBadge = {
            '待委派': { class: 'status-pending', text: '待委派' },
            '待发布': { class: 'status-testing', text: '待发布' },
            '已发布': { class: 'status-released', text: '已发布' },
            '已驳回': { class: 'status-rejected', text: '已驳回' }
        };
        const badge = statusBadge[firmware.status] || { class: 'status-pending', text: firmware.status };
        
        let content = `
            <div class="firmware-details-modern">
                <!-- 头部信息卡片 -->
                <div class="details-card header-card">
                    <div class="card-header-row">
                        <div class="firmware-version-info">
                            <h3 class="version-title">${firmware.version_name || '未知版本'}</h3>
                            <div class="project-path">${firmware.module_name || '-'} / ${firmware.project_name || '-'}</div>
                        </div>
                        <span class="status-badge ${badge.class}">${badge.text}</span>
                    </div>
                </div>

                <!-- 基本信息卡片 -->
                <div class="details-card">
                    <div class="card-title">
                        <i class="fas fa-info-circle"></i>
                        基本信息
                    </div>
                    <div class="info-table">
                        <div class="info-row">
                            <span class="info-label">文件名称</span>
                            <span class="info-value">${fileName}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">文件大小</span>
                            <span class="info-value">${firmware.file_size ? Utils.formatFileSize(firmware.file_size) : '-'}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">上传人员</span>
                            <span class="info-value">${firmware.uploader_name || '-'}</span>
                        </div>
        `;
        
    // 测试人员（已驳回时不显示）。在 test-list、release-list、rejected-list、my-related 页面均显示测试人员信息
    if (firmware.status !== '已驳回' && (currentPageId === 'test-list' || currentPageId === 'release-list' || currentPageId === 'rejected-list' || currentPageId === 'my-related') && firmware.tester_name) {
            content += `
                        <div class="info-row">
                            <span class="info-label">测试人员</span>
                            <span class="info-value">${firmware.tester_name}</span>
                        </div>
            `;
        }
        
        content += `
                        <div class="info-row">
                            <span class="info-label">上传时间</span>
                            <span class="info-value">${firmware.uploaded_at ? new Date(firmware.uploaded_at).toLocaleString('zh-CN') : '-'}</span>
                        </div>
        `;

        // 驳回人员（当状态为已驳回时显示）
        if (firmware.status === '已驳回' && firmware.rejecter_name) {
            content += `
                        <div class="info-row">
                            <span class="info-label">驳回人员</span>
                            <span class="info-value">${this.escapeHtml(firmware.rejecter_name)}</span>
                        </div>
            `;
        }
        
        // MD5校验
        if (firmware.md5) {
            content += `
                        <div class="info-row">
                            <span class="info-label">MD5 校验</span>
                            <span class="info-value code-text">${firmware.md5}</span>
                        </div>
            `;
        }
        
        content += `
                    </div>
                </div>
        `;
        
        // 测试报告
        if (currentPageId !== 'upload-list' && testReportName) {
            content += `
                <div class="details-card">
                    <div class="card-title">
                        <i class="fas fa-file-alt"></i>
                        测试报告
                    </div>
                    <a href="/api/firmwares/${firmware.id}/download-test-report" class="file-download-btn">
                        <i class="fas fa-download"></i>
                        <span>${testReportName}</span>
                    </a>
                </div>
            `;
        }
        
        // 委派说明
        if (currentPageId === 'test-list' && firmware.assign_note) {
            content += `
                <div class="details-card">
                    <div class="card-title">
                        <i class="fas fa-comment-dots"></i>
                        委派说明
                    </div>
                    <div class="text-content">${this.escapeHtml(firmware.assign_note).replace(/\r\n|\r|\n/g, '<br/>') || '<span class="empty-text">无</span>'}</div>
                </div>
            `;
        }
        
        // 驳回原因（在 rejected-list 和 my-related 页面显示）
        if ((currentPageId === 'rejected-list' || currentPageId === 'my-related') && firmware.reject_reason) {
            content += `
                <div class="details-card alert-card">
                    <div class="card-title">
                        <i class="fas fa-exclamation-circle"></i>
                        驳回原因
                    </div>
                    <div class="text-content alert-text">${this.escapeHtml(firmware.reject_reason).replace(/\r\n|\r|\n/g, '<br/>') || '<span class="empty-text">无</span>'}</div>
                </div>
            `;
        }
        
    // 测后说明（在 release-list 和 my-related 页面显示）
    if ((currentPageId === 'release-list' || currentPageId === 'my-related') && firmware.test_notes) {
            content += `
                <div class="details-card">
                    <div class="card-title">
                        <i class="fas fa-clipboard-check"></i>
                        测后说明
                    </div>
                    <div class="text-content">${this.escapeHtml(firmware.test_notes).replace(/\r\n|\r|\n/g, '<br/>') || '<span class="empty-text">无</span>'}</div>
                </div>
            `;
        }
        
        // 固件描述
        content += `
                <div class="details-card">
                    <div class="card-title">
                        <i class="fas fa-align-left"></i>
                        固件描述
                    </div>
                    <div class="text-content">${firmware.description ? this.escapeHtml(firmware.description).replace(/\r\n|\r|\n/g, '<br/>') : '<span class="empty-text">暂无描述</span>'}</div>
                </div>
                
                <!-- 底部关闭按钮已移除，使用右上角 X 关闭 -->
            </div>
        `;

        // 传入空标题以避免显示最顶端的“固件详情”文字
        this.showModal('', content);
    }
}

// 初始化模态框管理器
const modalManager = new ModalManager();