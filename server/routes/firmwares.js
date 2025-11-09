/*
 * @Author: aurson jassimxiong@gmail.com
 * @Date: 2025-09-14 17:33:37
 * @LastEditors: aurson jassimxiong@gmail.com
 * @LastEditTime: 2025-11-08 21:21:29
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

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const crypto = require('crypto');
const config = require('../config');
const { requireAuth, canUploadFirmware, canTestFirmware } = require('../middleware/auth');
const { cleanupUploadedFile, isValidVersionFormat } = require('../utils/fileUtils');
const router = express.Router();

// 配置 multer 用于固件文件上传
const firmwareStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        // 生成唯一文件夹名
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const folderName = 'firmware-' + uniqueSuffix;
        const dir = path.join(__dirname, '../../uploads/firmwares', folderName);
        fs.ensureDirSync(dir);
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        // 保留原始文件名
        cb(null, file.originalname);
    }
});

const uploadFirmware = multer({ 
    storage: firmwareStorage,
    limits: {
        fileSize: config.upload.firmwareMaxSize
    }
});

// 配置 multer 用于测试报告上传
const testReportStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        // 生成唯一文件夹名
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const folderName = 'test-report-' + uniqueSuffix;
        const dir = path.join(__dirname, '../../uploads/test-reports', folderName);
        fs.ensureDirSync(dir);
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        // 保留原始文件名
        cb(null, file.originalname);
    }
});

const uploadTestReport = multer({ 
    storage: testReportStorage,
    limits: {
        fileSize: config.upload.testReportMaxSize
    }
});

// 计算文件MD5
function calculateFileMD5(filePath) {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('md5');
        const stream = fs.createReadStream(filePath);
        
        stream.on('data', (data) => {
            hash.update(data);
        });
        
        stream.on('end', () => {
            resolve(hash.digest('hex'));
        });
        
        stream.on('error', (err) => {
            reject(err);
        });
    });
}

// 获取固件列表（支持服务端分页）
router.get('/', (req, res) => {
    // 分页参数
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 8; // 默认每页8条
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE 1=1';
    let params = [];

    // 过滤条件
    if (req.query.module_id) {
        whereClause += ' AND f.module_id = ?';
        params.push(req.query.module_id);
    }

    if (req.query.project_id) {
        whereClause += ' AND f.project_id = ?';
        params.push(req.query.project_id);
    }

    if (req.query.environment) {
        whereClause += ' AND f.environment = ?';
        params.push(req.query.environment);
    }

    // 按状态筛选
    if (req.query.status) {
        whereClause += ' AND f.status = ?';
        params.push(req.query.status);
    }

    // 按发布者筛选 - 只能看到自己发布的固件
    if (req.query.released_by) {
        whereClause += ` AND f.id IN (
            SELECT DISTINCT fh.firmware_id 
            FROM firmware_history fh
            JOIN users ru ON fh.performed_by = ru.id
            WHERE ru.username = ? 
            AND fh.action = 'update_status'
            AND fh.new_value = 'released'
        )`;
        params.push(req.query.released_by);
    }

    // 按上传者筛选 - 只能看到自己上传的固件
    if (req.query.uploaded_by) {
        whereClause += ' AND u.username = ?';
        params.push(req.query.uploaded_by);
    }

    // 按测试者筛选 - 包括委派给当前用户的固件和已经测试过的固件
    if (req.query.tested_by) {
        whereClause += ` AND (
            f.assigned_to IN (SELECT id FROM users WHERE username = ?)
            OR f.id IN (
                SELECT DISTINCT fh.firmware_id 
                FROM firmware_history fh
                JOIN users tu ON fh.performed_by = tu.id
                WHERE tu.username = ? 
                AND fh.action IN ('update_status', 'upload_test_report')
            )
        )`;
        params.push(req.query.tested_by);
        params.push(req.query.tested_by);
    }

    // 搜索过滤 - 在固件描述中查找关键字
    if (req.query.search) {
        whereClause += ' AND f.description LIKE ?';
        params.push('%' + req.query.search + '%');
    }

    // 先查询总数
    const countSql = `
        SELECT COUNT(*) as total
        FROM firmwares f
        LEFT JOIN modules m ON f.module_id = m.id
        LEFT JOIN projects p ON f.project_id = p.id
        LEFT JOIN users u ON f.uploaded_by = u.id
        ${whereClause}
    `;

    req.db.get(countSql, params, (err, countResult) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: '数据库错误' });
        }

        const total = countResult.total;
        const totalPages = Math.ceil(total / pageSize);

        // 查询分页数据
        const dataSql = `
            SELECT f.*, m.name as module_name, p.name as project_name, u.username as uploader_name
            FROM firmwares f
            LEFT JOIN modules m ON f.module_id = m.id
            LEFT JOIN projects p ON f.project_id = p.id
            LEFT JOIN users u ON f.uploaded_by = u.id
            ${whereClause}
            ORDER BY f.created_at DESC
            LIMIT ? OFFSET ?
        `;

        const dataParams = [...params, pageSize, offset];

        req.db.all(dataSql, dataParams, (err, rows) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: '数据库错误' });
            }
            
            // 返回分页信息和数据
            res.json({
                data: rows,
                pagination: {
                    page: page,
                    pageSize: pageSize,
                    total: total,
                    totalPages: totalPages
                }
            });
        });
    });
});

// 上传固件
router.post('/upload', canUploadFirmware, uploadFirmware.single('firmware'), (req, res) => {
    const user = req.session.user;
    const { module_id, project_id, version, description, additional_info } = req.body;

    if (!module_id || !project_id || !version) {
        cleanupUploadedFile(req.file);
        return res.status(400).json({ error: '模块、项目和版本号不能为空' });
    }

    // 验证版本号格式
    if (!isValidVersionFormat(version)) {
        cleanupUploadedFile(req.file);
        return res.status(400).json({ error: '版本号格式不正确，应为 v主版本.次版本.修订版本，例如 v1.5.1' });
    }

    if (!req.file) {
        return res.status(400).json({ error: '固件文件不能为空' });
    }

    // 检查模块和项目是否存在
    req.db.get('SELECT COUNT(*) as module_count FROM modules WHERE id = ?', [module_id], (err, moduleResult) => {
        if (err) {
            cleanupUploadedFile(req.file);
            console.error('Database error:', err);
            return res.status(500).json({ error: '数据库错误' });
        }

        if (moduleResult.module_count === 0) {
            cleanupUploadedFile(req.file);
            return res.status(400).json({ error: '模块不存在' });
        }

        req.db.get('SELECT COUNT(*) as project_count FROM projects WHERE id = ?', [project_id], (err, projectResult) => {
            if (err) {
                cleanupUploadedFile(req.file);
                console.error('Database error:', err);
                return res.status(500).json({ error: '数据库错误' });
            }

            if (projectResult.project_count === 0) {
                cleanupUploadedFile(req.file);
                return res.status(400).json({ error: '项目不存在' });
            }

            // 计算文件MD5
            calculateFileMD5(req.file.path)
                .then(md5Hash => {
                    // 插入固件记录
                    const insertSql = `
                        INSERT INTO firmwares 
                        (module_id, project_id, version, description, additional_info, file_path, file_size, md5, uploaded_by, environment, status)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'test', 'pending')
                    `;
                    const fileSize = req.file.size;

                    req.db.run(insertSql, [module_id, project_id, version, description, additional_info, req.file.path, fileSize, md5Hash, user.id], function(err) {
                        if (err) {
                            cleanupUploadedFile(req.file);
                            console.error('Database error:', err);
                            return res.status(500).json({ error: '数据库错误' });
                        }

                        // 记录历史
                        const historySql = `
                            INSERT INTO firmware_history (firmware_id, version, action, performed_by, notes)
                            VALUES (?, ?, 'upload', ?, ?)
                        `;
                        const notes = `上传固件，文件: ${req.file.originalname}, MD5: ${md5Hash}`;
                        req.db.run(historySql, [this.lastID, version, user.id, notes], function(err) {
                            if (err) {
                                console.error('Failed to record history:', err);
                            }
                        });

                        res.json({
                            message: '固件上传成功',
                            firmwareId: this.lastID,
                            md5: md5Hash
                        });
                    });
                })
                .catch(err => {
                    cleanupUploadedFile(req.file);
                    console.error('Error calculating MD5:', err);
                    return res.status(500).json({ error: '计算MD5失败' });
                });
        });
    });
});

// 下载固件（所有已登录用户都可以下载）
router.get('/:id/download', requireAuth, (req, res) => {
    const firmwareId = req.params.id;

    const sql = 'SELECT file_path FROM firmwares WHERE id = ?';
    req.db.get(sql, [firmwareId], (err, row) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: '数据库错误' });
        }

        if (!row) {
            return res.status(404).json({ error: '固件不存在' });
        }

        const filePath = row.file_path;
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: '固件文件不存在' });
        }

        // 获取原始文件名
        const fileName = path.basename(filePath);
        // 设置 Content-Disposition 头，指定文件名
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.download(filePath, fileName);
    });
});

// 更新固件状态
router.put('/:id/status', canTestFirmware, (req, res) => {
    const user = req.session.user;
    const firmwareId = req.params.id;
    const { status } = req.body;

    const allowedStatus = ['testing', 'passed', 'failed', 'released', 'obsolete'];
    if (!allowedStatus.includes(status)) {
        return res.status(400).json({ error: '状态不合法' });
    }

    // 获取当前固件信息
    const getSql = 'SELECT * FROM firmwares WHERE id = ?';
    req.db.get(getSql, [firmwareId], (err, firmware) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: '数据库错误' });
        }

        if (!firmware) {
            return res.status(404).json({ error: '固件不存在' });
        }

        let updateSql = 'UPDATE firmwares SET status = ?, updated_at = CURRENT_TIMESTAMP';
        let params = [status];

        // 如果状态是 released，则环境改为 release
        if (status === 'released') {
            updateSql += ', environment = ?';
            params.push('release');
        }

        updateSql += ' WHERE id = ?';
        params.push(firmwareId);

        req.db.run(updateSql, params, function(err) {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: '数据库错误' });
            }

            // 记录历史
            const historySql = `
                INSERT INTO firmware_history (firmware_id, version, action, performed_by, notes)
                VALUES (?, ?, ?, ?, ?)
            `;
            const notes = `状态变更为: ${status}`;
            req.db.run(historySql, [firmwareId, firmware.version, 'status_change', user.id, notes], function(err) {
                if (err) {
                    console.error('Failed to record history:', err);
                }
            });

            res.json({ message: '状态更新成功' });
        });
    });
});

// 委派固件给测试人员 - 允许开发者和管理员委派
router.post('/:id/assign', canUploadFirmware, (req, res) => {
    const user = req.session.user;
    const firmwareId = req.params.id;
    const { assigned_to, assign_note } = req.body;

    if (!assigned_to) {
        return res.status(400).json({ error: '请选择委派对象' });
    }

    // 验证被委派人是否为测试人员
    const checkUserSql = 'SELECT id, username, role FROM users WHERE id = ?';
    req.db.get(checkUserSql, [assigned_to], (err, tester) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: '数据库错误' });
        }

        if (!tester) {
            return res.status(404).json({ error: '测试人员不存在' });
        }

        if (tester.role !== 'tester') {
            return res.status(400).json({ error: '只能委派给测试人员' });
        }

        // 获取固件信息
        const getFirmwareSql = 'SELECT * FROM firmwares WHERE id = ?';
        req.db.get(getFirmwareSql, [firmwareId], (err, firmware) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: '数据库错误' });
            }

            if (!firmware) {
                return res.status(404).json({ error: '固件不存在' });
            }

            // 更新固件状态为 assigned (待发布)，并记录委派信息
            const updateSql = `
                UPDATE firmwares 
                SET status = 'assigned', assigned_to = ?, assign_note = ?, updated_at = CURRENT_TIMESTAMP 
                WHERE id = ?
            `;
            req.db.run(updateSql, [assigned_to, assign_note || null, firmwareId], function(err) {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ error: '数据库错误' });
                }

                // 记录历史
                const historySql = `
                    INSERT INTO firmware_history (firmware_id, version, action, performed_by, notes)
                    VALUES (?, ?, ?, ?, ?)
                `;
                const notes = `固件委派给测试人员: ${tester.username}${assign_note ? ', 说明: ' + assign_note : ''}`;
                req.db.run(historySql, [firmwareId, firmware.version, 'assign', user.id, notes], function(err) {
                    if (err) {
                        console.error('Failed to record history:', err);
                    }
                });

                res.json({ 
                    message: '固件委派成功',
                    assigned_to: tester.username
                });
            });
        });
    });
});

// 上传测试报告
router.post('/:id/test-report', canTestFirmware, uploadTestReport.single('test_report'), (req, res) => {
    const user = req.session.user;
    const firmwareId = req.params.id;

    if (!req.file) {
        return res.status(400).json({ error: '测试报告文件不能为空' });
    }

    const updateSql = 'UPDATE firmwares SET test_report_path = ? WHERE id = ?';
    req.db.run(updateSql, [req.file.path, firmwareId], function(err) {
        if (err) {
            cleanupUploadedFile(req.file);
            console.error('Database error:', err);
            return res.status(500).json({ error: '数据库错误' });
        }

        if (this.changes === 0) {
            cleanupUploadedFile(req.file);
            return res.status(404).json({ error: '固件不存在' });
        }

        // 记录历史
        const historySql = `
            INSERT INTO firmware_history (firmware_id, version, action, performed_by, notes)
            SELECT id, version, 'upload_test_report', ?, ? FROM firmwares WHERE id = ?
        `;
        const notes = `上传测试报告: ${req.file.originalname}`;
        req.db.run(historySql, [user.id, notes, firmwareId], function(err) {
            if (err) {
                console.error('Failed to record history:', err);
            }
        });

        res.json({ message: '测试报告上传成功' });
    });
});

// 下载测试报告（所有已登录用户都可以下载）
router.get('/:id/download-test-report', requireAuth, (req, res) => {
    const firmwareId = req.params.id;

    const sql = 'SELECT test_report_path FROM firmwares WHERE id = ?';
    req.db.get(sql, [firmwareId], (err, row) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: '数据库错误' });
        }

        if (!row || !row.test_report_path) {
            return res.status(404).json({ error: '测试报告不存在' });
        }

        const filePath = row.test_report_path;
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: '测试报告文件不存在' });
        }

        // 获取原始文件名
        const fileName = path.basename(filePath);
        // 设置 Content-Disposition 头，指定文件名
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.download(filePath, fileName);
    });
});

// 删除固件
router.delete('/:id', (req, res) => {
    const user = req.session.user;
    if (!user) {
        return res.status(401).json({ error: '未登录' });
    }

    const firmwareId = req.params.id;

    // 获取固件信息
    const getSql = 'SELECT * FROM firmwares WHERE id = ?';
    req.db.get(getSql, [firmwareId], (err, firmware) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: '数据库错误' });
        }

        if (!firmware) {
            return res.status(404).json({ error: '固件不存在' });
        }

        // 权限检查
        // 1. 管理员可以删除任何固件
        // 2. 开发者只能删除自己上传的固件
        // 3. 开发者不能删除已发布(released)或作废(obsolete)状态的固件
        if (user.role === 'admin') {
            // 管理员有完全删除权限
        } else if (user.role === 'developer') {
            // 检查是否是上传者
            if (firmware.uploaded_by !== user.id) {
                return res.status(403).json({ error: '没有权限删除此固件' });
            }
            // 检查固件状态
            if (firmware.status === 'released') {
                return res.status(403).json({ 
                    error: '不能删除已发布的固件',
                    detail: `当前状态: ${firmware.status}`
                });
            }
        } else {
            // 其他角色无删除权限
            return res.status(403).json({ error: '没有权限删除固件' });
        }

        // 删除文件和文件夹
        if (fs.existsSync(firmware.file_path)) {
            const fileDir = path.dirname(firmware.file_path);
            fs.removeSync(fileDir); // 删除整个文件夹
        }
        if (firmware.test_report_path && fs.existsSync(firmware.test_report_path)) {
            const testReportDir = path.dirname(firmware.test_report_path);
            fs.removeSync(testReportDir); // 删除整个文件夹
        }

        // 删除数据库记录
        const deleteSql = 'DELETE FROM firmwares WHERE id = ?';
        req.db.run(deleteSql, [firmwareId], function(err) {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: '数据库错误' });
            }

            // 删除历史记录
            const deleteHistorySql = 'DELETE FROM firmware_history WHERE firmware_id = ?';
            req.db.run(deleteHistorySql, [firmwareId], function(err) {
                if (err) {
                    console.error('Failed to delete history:', err);
                }
            });

            res.json({ message: '固件删除成功' });
        });
    });
});

module.exports = router;