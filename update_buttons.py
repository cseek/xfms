#!/usr/bin/env python3
import re

# 读取文件
with open('/home/aurson/X/xfms/client/js/firmware_manager.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 新的renderActionButtons方法
new_method = '''    renderActionButtons(firmware) {
        const buttons = [];
        const userRole = dashboard.currentUser.role;
        const pageId = this.currentPageId;

        // 下载按钮 - 所有页面都有
        buttons.push(`
            <button class="action-menu-item" data-action="download" data-id="${firmware.id}">
                <i class="fas fa-download"></i> 下载固件
            </button>
        `);

        // 根据页面显示不同的操作按钮
        if (pageId === 'upload-list') {
            // 上传列表: 下载固件、委派固件、删除固件
            buttons.push(`
                <button class="action-menu-item" data-action="assign" data-id="${firmware.id}">
                    <i class="fas fa-user-check"></i> 委派固件
                </button>
            `);

            // 删除按钮 - 管理员或上传者
            if (userRole === 'admin' || firmware.uploaded_by === dashboard.currentUser.id) {
                buttons.push(`
                    <button class="action-menu-item delete-item" data-action="delete" data-id="${firmware.id}">
                        <i class="fas fa-trash"></i> 删除固件
                    </button>
                `);
            }
        } else if (pageId === 'test-list') {
            // 测试列表: 下载固件、发布固件、驳回固件
            buttons.push(`
                <button class="action-menu-item release-item" data-action="release" data-id="${firmware.id}">
                    <i class="fas fa-check"></i> 发布固件
                </button>
            `);
            buttons.push(`
                <button class="action-menu-item reject-item" data-action="reject" data-id="${firmware.id}">
                    <i class="fas fa-ban"></i> 驳回固件
                </button>
            `);
        } else if (pageId === 'release-list') {
            // 发布列表: 只有下载固件 (已经在上面添加了)
        } else {
            // 其他页面保留原有逻辑
            if (firmware.environment === 'test') {
                if (userRole === 'tester' || userRole === 'admin') {
                    if (firmware.status === 'pending' || firmware.status === 'testing') {
                        buttons.push(`
                            <button class="action-menu-item release-item" data-action="release" data-id="${firmware.id}">
                                <i class="fas fa-check"></i> 发布固件
                            </button>
                        `);
                        buttons.push(`
                            <button class="action-menu-item obsolete-item" data-action="obsolete" data-id="${firmware.id}">
                                <i class="fas fa-times"></i> 作废固件
                            </button>
                        `);
                    }
                }
            }

            if (userRole === 'admin') {
                buttons.push(`
                    <button class="action-menu-item delete-item" data-action="delete" data-id="${firmware.id}">
                        <i class="fas fa-trash"></i> 删除固件
                    </button>
                `);
            } else if (userRole === 'developer' && firmware.uploaded_by === dashboard.currentUser.id) {
                if (firmware.status !== 'released') {
                    buttons.push(`
                        <button class="action-menu-item delete-item" data-action="delete" data-id="${firmware.id}">
                            <i class="fas fa-trash"></i> 删除固件
                        </button>
                    `);
                }
            }
        }

        return buttons.join('');
    }'''

# 使用正则表达式替换整个renderActionButtons方法
# 匹配从 renderActionButtons(firmware) 到下一个方法开始之前
pattern = r'    renderActionButtons\(firmware\) \{.*?    \}\s+(?=\s+attachFirmwareEventListeners\(\))'
content = re.sub(pattern, new_method + '\n\n', content, flags=re.DOTALL)

# 写回文件
with open('/home/aurson/X/xfms/client/js/firmware_manager.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully updated renderActionButtons method")
