/*
 * @Author: aurson jassimxiong@gmail.com
 * @Date: 2025-09-14 17:33:37
 * @LastEditors: aurson jassimxiong@gmail.com
 * @LastEditTime: 2025-11-06 11:11:45
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
        this.closeBtn = document.querySelector('.close');
        
        this.init();
    }

    init() {
        // 关闭模态框事件
        this.closeBtn.addEventListener('click', () => {
            this.hideModal();
        });

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
        this.modalBody.innerHTML = `
            <h2 class="modal-title">${title}</h2>
            ${content}
        `;
        this.modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    hideModal() {
        this.modal.style.display = 'none';
        document.body.style.overflow = 'auto';
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
                    <button type="submit" class="btn-submit">添加模块</button>
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
                    <button type="submit" class="btn-submit">添加项目</button>
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
                    <label for="userUsername">用户名 *</label>
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
                    <button type="submit" class="btn-submit">添加用户</button>
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
                    <button type="submit" class="btn-submit">保存修改</button>
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
                    <label for="editUserUsername">用户名</label>
                    <input type="text" id="editUserUsername" value="${user.username}" disabled>
                    <small>用户名不可修改</small>
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
                    <button type="submit" class="btn-submit">保存修改</button>
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
                    <button type="submit" class="btn-submit">上传测试报告</button>
                </div>
            </form>
        `;

        this.showModal('上传测试报告', content);

        document.getElementById('uploadTestReportForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.uploadTestReport(firmwareId);
        });
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

        const content = `
            <div class="firmware-details">
                <div class="detail-row"><strong>模块 / 项目：</strong> ${firmware.module_name || '-'} / ${firmware.project_name || '-'}</div>
                <div class="detail-row"><strong>版本：</strong> ${firmware.version || '-'}</div>
                <div class="detail-row"><strong>文件：</strong> ${fileName} ${firmware.file_size ? '(' + Utils.formatFileSize(firmware.file_size) + ')' : ''}</div>
                <div class="detail-row"><strong>状态：</strong> ${firmware.status || '-'}</div>
                <div class="detail-row"><strong>环境：</strong> ${firmware.environment || '-'}</div>
                <div class="detail-row"><strong>上传者：</strong> ${firmware.uploader_name || '-'}</div>
                <div class="detail-row"><strong>上传时间：</strong> ${firmware.created_at ? new Date(firmware.created_at).toLocaleString('zh-CN') : '-'}</div>
                <hr />
                <div class="detail-row"><strong>发布描述：</strong></div>
                <div class="detail-block">${firmware.description ? firmware.description.replace(/\n/g, '<br/>') : '<em>无</em>'}</div>
                <div class="detail-row"><strong>补充信息：</strong></div>
                <div class="detail-block">${firmware.additional_info ? firmware.additional_info.replace(/\n/g, '<br/>') : '<em>无</em>'}</div>
                <div class="modal-actions" style="margin-top:12px; display:flex; gap:8px; align-items:center;">
                    ${testReportName ? `<a class="btn-submit" href="/api/firmwares/${firmware.id}/download-test-report" style="text-decoration:none; display:inline-block; padding:8px 12px;">下载测试报告</a>` : ''}
                </div>
            </div>
        `;

        this.showModal(`固件详情 - ${firmware.version || ''}`, content);
    }
}

// 初始化模态框管理器
const modalManager = new ModalManager();