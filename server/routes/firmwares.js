/*
 * @Author: aurson jassimxiong@gmail.com
 * @Date: 2025-11-10
 * @LastEditTime: 2025-11-10 23:26:51
 * @Description: 重构后的固件路由 - 适配新数据库结构
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const crypto = require('crypto');
const config = require('../config');
const { requireAuth, canUploadFirmware, canTestFirmware, canAssignFirmware, canPublishFirmware } = require('../middleware/auth');
const { cleanupUploadedFile, isValidVersionFormat } = require('../utils/file_utils');
const router = express.Router();

// 配置 multer 用于固件文件上传
const firmwareStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const folderName = 'firmware-' + uniqueSuffix;
        const dir = path.join(__dirname, '../../uploads/firmwares', folderName);
        fs.ensureDirSync(dir);
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const uploadFirmware = multer({ 
    storage: firmwareStorage,
    limits: { fileSize: config.upload.firmwareMaxSize }
});

// 配置 multer 用于测试报告上传
const testReportStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const folderName = 'test-report-' + uniqueSuffix;
        const dir = path.join(__dirname, '../../uploads/test-reports', folderName);
        fs.ensureDirSync(dir);
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const uploadTestReport = multer({ 
    storage: testReportStorage,
    limits: { fileSize: config.upload.testReportMaxSize }
});

// 计算文件MD5
function calculateFileMD5(filePath) {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('md5');
        const stream = fs.createReadStream(filePath);
        stream.on('data', (data) => hash.update(data));
        stream.on('end', () => resolve(hash.digest('hex')));
        stream.on('error', (err) => reject(err));
    });
}

// 获取固件列表（支持服务端分页）
router.get('/', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 8;
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE 1=1';
    let params = [];

    // 按模块筛选 - 前端通常传递 module_id（兼容老版 module_name）
    if (req.query.module_id) {
        whereClause += ' AND f.module_id = ?';
        params.push(req.query.module_id);
    } else if (req.query.module_name) {
        whereClause += ' AND m.name = ?';
        params.push(req.query.module_name);
    }

    // 按项目筛选 - 前端通常传递 project_id（兼容老版 project_name）
    if (req.query.project_id) {
        whereClause += ' AND f.project_id = ?';
        params.push(req.query.project_id);
    } else if (req.query.project_name) {
        whereClause += ' AND p.name = ?';
        params.push(req.query.project_name);
    }

    // 按状态筛选 - 支持多个状态用逗号分隔
    if (req.query.status) {
        const statuses = req.query.status.split(',').map(s => s.trim());
        if (statuses.length === 1) {
            whereClause += ' AND f.status = ?';
            params.push(statuses[0]);
        } else {
            const placeholders = statuses.map(() => '?').join(',');
            whereClause += ` AND f.status IN (${placeholders})`;
            params.push(...statuses);
        }
    }

    // 按发布者筛选
    if (req.query.released_by) {
        whereClause += ' AND ru.username = ?';
        params.push(req.query.released_by);
    }

    // 按上传者筛选
    if (req.query.uploaded_by) {
        whereClause += ' AND uu.username = ?';
        params.push(req.query.uploaded_by);
    }

    // 按测试者筛选
    if (req.query.tested_by) {
        whereClause += ' AND (tu.username = ? OR f.assigned_to IN (SELECT id FROM users WHERE username = ?))';
        params.push(req.query.tested_by, req.query.tested_by);
    }

    // 搜索过滤 - 在固件描述中查找关键字
    if (req.query.search) {
        whereClause += ' AND f.description LIKE ?';
        params.push('%' + req.query.search + '%');
    }

    // 和我相关的筛选：只要上传者或测试者中包含当前用户即视为相关（不再依赖具体状态）
    if (req.query.my_related && req.session.user) {
        const username = req.session.user.username;
        whereClause += ` AND (
            uu.username = ? OR
            tu.username = ?
        )`;
        params.push(username, username);
    }

    // 查询总数
    const countSql = `
        SELECT COUNT(*) as total
        FROM firmwares f
        LEFT JOIN users uu ON f.uploaded_by = uu.id
        LEFT JOIN users tu ON f.assigned_to = tu.id
        LEFT JOIN users ru ON f.released_by = ru.id
        LEFT JOIN users rj ON f.rejected_by = rj.id
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
            SELECT 
                f.*,
                f.version as version_name,
                f.created_at as uploaded_at,
                m.name as module_name,
                p.name as project_name,
                uu.username as uploader_name,
                tu.username as tester_name,
                ru.username as releaser_name,
                rj.username as rejecter_name
            FROM firmwares f
            LEFT JOIN modules m ON f.module_id = m.id
            LEFT JOIN projects p ON f.project_id = p.id
            LEFT JOIN users uu ON f.uploaded_by = uu.id
            LEFT JOIN users tu ON f.assigned_to = tu.id
            LEFT JOIN users ru ON f.released_by = ru.id
            LEFT JOIN users rj ON f.rejected_by = rj.id
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
            
            // 根据不同状态过滤返回字段
            const filteredData = rows.map(row => {
                const baseData = {
                    id: row.id,
                    module_id: row.module_id,
                    project_id: row.project_id,
                    version: row.version,
                    version_name: row.version_name,
                    module_name: row.module_name,
                    project_name: row.project_name,
                    description: row.description,
                    file_path: row.file_path,
                    file_size: row.file_size,
                    md5: row.md5,
                    status: row.status,
                    uploaded_by: row.uploaded_by,
                    uploader_name: row.uploader_name,
                    created_at: row.created_at,
                    uploaded_at: row.uploaded_at,
                    updated_at: row.updated_at
                };

                // 待委派 - 只返回基础字段
                if (row.status === '待委派') {
                    return baseData;
                }

                // 待发布 - 添加测试人员和委派说明
                if (row.status === '待发布') {
                    return {
                        ...baseData,
                        assigned_to: row.assigned_to,
                        tester_name: row.tester_name,
                        assign_note: row.assign_note,
                        test_report_path: row.test_report_path
                    };
                }

                // 已发布 - 添加测试人员、测后说明、发布信息
                if (row.status === '已发布') {
                    return {
                        ...baseData,
                        assigned_to: row.assigned_to,
                        tester_name: row.tester_name,
                        test_notes: row.test_notes,
                        test_report_path: row.test_report_path,
                        released_by: row.released_by,
                        releaser_name: row.releaser_name,
                        released_at: row.released_at
                    };
                }

                // 已驳回 - 添加驳回原因、测试人员和测试报告
                if (row.status === '已驳回') {
                    return {
                        ...baseData,
                        assigned_to: row.assigned_to,
                        tester_name: row.tester_name,
                        reject_reason: row.reject_reason,
                        test_report_path: row.test_report_path,
                        rejected_by: row.rejected_by,
                        rejecter_name: row.rejecter_name
                    };
                }

                // 默认返回所有字段(兼容未知状态)
                return row;
            });
            
            res.json({
                data: filteredData,
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
    const { module_id, project_id, version, description } = req.body;

    if (!module_id || !project_id || !version) {
        cleanupUploadedFile(req.file);
        return res.status(400).json({ error: '模块、项目和版本不能为空' });
    }

    // 验证版本号格式
    if (!isValidVersionFormat(version)) {
        cleanupUploadedFile(req.file);
        return res.status(400).json({ error: '版本号格式不正确，应为 v主版本.次版本.修订版本，例如 v1.5.1' });
    }

    if (!req.file) {
        return res.status(400).json({ error: '固件文件不能为空' });
    }

    // 计算文件MD5
    calculateFileMD5(req.file.path)
        .then(md5Hash => {
            const insertSql = `
                INSERT INTO firmwares 
                (module_id, project_id, version, description, file_path, file_size, md5, uploaded_by, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, '待委派')
            `;
            const fileSize = req.file.size;

            req.db.run(insertSql, [module_id, project_id, version, description, req.file.path, fileSize, md5Hash, user.id], function(err) {
                if (err) {
                    cleanupUploadedFile(req.file);
                    console.error('Database error:', err);
                    return res.status(500).json({ error: '数据库错误' });
                }

                res.json({
                    message: '固件上传成功',
                    firmwareId: this.lastID,
                    md5: md5Hash
                });
            });
        })
        .catch(err => {
            cleanupUploadedFile(req.file);
            console.error('Error:', err);
            return res.status(500).json({ error: err.message || '上传失败' });
        });
});

// 下载固件
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

        const fileName = path.basename(filePath);
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.download(filePath, fileName);
    });
});

// 更新固件状态
// 更新固件状态(发布/驳回)
router.put('/:id/status', canPublishFirmware, (req, res) => {
    const user = req.session.user;
    const firmwareId = req.params.id;
    const { status, test_notes, release_notes, reject_reason } = req.body;

    const allowedStatus = ['待委派', '待发布', '已发布', '已驳回'];
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

        // 测试人员只能发布/驳回委派给自己的固件
        if (user.role === 'tester' && firmware.assigned_to !== user.id) {
            return res.status(403).json({ error: '您只能发布或驳回委派给自己的固件' });
        }

        let updateSql = 'UPDATE firmwares SET status = ?';
        let params = [status];

        // 如果状态是已发布，记录发布信息
        if (status === '已发布') {
            updateSql += ', released_by = ?, released_at = CURRENT_TIMESTAMP';
            params.push(user.id);
            
            // 支持 test_notes 和 release_notes 两种参数名
            const notes = test_notes || release_notes;
            if (notes) {
                updateSql += ', test_notes = ?';
                params.push(notes);
            }
        }
        
        // 如果状态是已驳回,保存驳回原因(保留测试人员信息)
        if (status === '已驳回') {
            if (reject_reason) {
                updateSql += ', reject_reason = ?';
                params.push(reject_reason);
            }
            // 记录驳回人员
            updateSql += ', rejected_by = ?';
            params.push(user.id);
        }

        updateSql += ' WHERE id = ?';
        params.push(firmwareId);

        req.db.run(updateSql, params, function(err) {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: '数据库错误' });
            }

            res.json({ message: '固件状态更新成功' });
        });
    });
});

// 委派固件
router.post('/:id/assign', canAssignFirmware, (req, res) => {
    const user = req.session.user;
    const firmwareId = req.params.id;
    const { assigned_to, assign_note } = req.body;

    if (!assigned_to) {
        return res.status(400).json({ error: '请指定委派的测试人员' });
    }

    // 委派说明为必填
    if (!assign_note || String(assign_note).trim() === '') {
        return res.status(400).json({ error: '委派说明不能为空' });
    }

    // 检查被委派人是否为测试人员
    const getUserSql = 'SELECT * FROM users WHERE id = ? AND role = "tester"';
    req.db.get(getUserSql, [assigned_to], (err, tester) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: '数据库错误' });
        }

        if (!tester) {
            return res.status(400).json({ error: '被委派的用户不是测试人员' });
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

            // 开发者只能委派自己上传的固件
            if (user.role === 'developer' && firmware.uploaded_by !== user.id) {
                return res.status(403).json({ error: '您只能委派自己上传的固件' });
            }

            // 更新固件状态为待发布,并记录测试人员和委派说明（assign_note 必填）
            let updateSql = `
                UPDATE firmwares 
                SET status = '待发布', assigned_to = ?, assign_note = ?`;
            let params = [assigned_to, assign_note];
            updateSql += ' WHERE id = ?';
            params.push(firmwareId);
            
            req.db.run(updateSql, params, function(err) {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ error: '数据库错误' });
                }

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

        res.json({ message: '测试报告上传成功' });
    });
});

// 下载测试报告
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

        const fileName = path.basename(filePath);
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
        if (user.role === 'admin') {
            // 管理员有完全删除权限
        } else if (user.role === 'developer') {
            if (firmware.uploaded_by !== user.id) {
                return res.status(403).json({ error: '没有权限删除此固件' });
            }
            if (firmware.status === '已发布') {
                return res.status(403).json({ 
                    error: '不能删除已发布的固件',
                    detail: `当前状态: ${firmware.status}`
                });
            }
        } else {
            return res.status(403).json({ error: '没有权限删除固件' });
        }

        // 删除文件和文件夹
        if (fs.existsSync(firmware.file_path)) {
            const fileDir = path.dirname(firmware.file_path);
            fs.removeSync(fileDir);
        }
        if (firmware.test_report_path && fs.existsSync(firmware.test_report_path)) {
            const testReportDir = path.dirname(firmware.test_report_path);
            fs.removeSync(testReportDir);
        }

        // 删除数据库记录
        const deleteSql = 'DELETE FROM firmwares WHERE id = ?';
        req.db.run(deleteSql, [firmwareId], function(err) {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: '数据库错误' });
            }

            res.json({ message: '固件删除成功' });
        });
    });
});

module.exports = router;
