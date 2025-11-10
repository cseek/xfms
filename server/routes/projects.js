/*
 * @Author: aurson jassimxiong@gmail.com
 * @Date: 2025-09-14 17:33:37
 * @LastEditors: aurson jassimxiong@gmail.com
 * @LastEditTime: 2025-11-06 11:10:12
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
const { adminRequired, canManageProject } = require('../middleware/auth');
const router = express.Router();

// 获取所有项目
router.get('/', (req, res) => {
    const sql = `
        SELECT p.*, u.username as creator_name 
        FROM projects p 
        LEFT JOIN users u ON p.created_by = u.id 
        ORDER BY p.name
    `;
    req.db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: '数据库错误' });
        }
        res.json(rows);
    });
});

// 创建项目(管理员或开发者)
router.post('/', canManageProject, (req, res) => {
    console.log('收到创建项目请求:', req.body);
    
    const { name, description } = req.body;

    // 更严格的空值检查
    if (!name || name.trim() === '') {
        console.log('项目名称为空');
        return res.status(400).json({ error: '项目名不能为空' });
    }

    const projectName = name.trim();

    // 检查名称长度
    if (projectName.length < 1 || projectName.length > 100) {
        return res.status(400).json({ error: '项目名称长度应在1-100个字符之间' });
    }

    const sql = 'INSERT INTO projects (name, description, created_by) VALUES (?, ?, ?)';
    req.db.run(sql, [projectName, description, req.session.user.id], function(err) {
        if (err) {
            console.error('Database error:', err);
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ error: '项目名已存在' });
            }
            return res.status(500).json({ error: '数据库错误' });
        }

        console.log('项目创建成功，ID:', this.lastID);
        res.json({
            message: '项目创建成功',
            projectId: this.lastID
        });
    });
});

// 更新项目(管理员或开发者,开发者只能更新自己创建的项目)
router.put('/:id', canManageProject, (req, res) => {
    const user = req.session.user;
    const projectId = req.params.id;
    const { name, description } = req.body;

    if (!name) {
        return res.status(400).json({ error: '项目名不能为空' });
    }

    // 获取项目信息
    const getProjectSql = 'SELECT * FROM projects WHERE id = ?';
    req.db.get(getProjectSql, [projectId], (err, project) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: '数据库错误' });
        }

        if (!project) {
            return res.status(404).json({ error: '项目不存在' });
        }

        // 开发者只能更新自己创建的项目
        if (user.role === 'developer' && project.created_by !== user.id) {
            return res.status(403).json({ error: '您只能更新自己创建的项目' });
        }

        const sql = 'UPDATE projects SET name = ?, description = ? WHERE id = ?';
        req.db.run(sql, [name, description, projectId], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(400).json({ error: '项目名已存在' });
                }
                console.error('Database error:', err);
                return res.status(500).json({ error: '数据库错误' });
            }

            res.json({ message: '项目更新成功' });
        });
    });
});

// 删除项目(管理员或开发者,开发者只能删除自己创建的项目)
router.delete('/:id', canManageProject, (req, res) => {
    const user = req.session.user;
    const projectId = req.params.id;

    // 获取项目信息
    const getProjectSql = 'SELECT * FROM projects WHERE id = ?';
    req.db.get(getProjectSql, [projectId], (err, project) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: '数据库错误' });
        }

        if (!project) {
            return res.status(404).json({ error: '项目不存在' });
        }

        // 开发者只能删除自己创建的项目
        if (user.role === 'developer' && project.created_by !== user.id) {
            return res.status(403).json({ error: '您只能删除自己创建的项目' });
        }

        // 检查是否有固件使用此项目
        const checkSql = 'SELECT COUNT(*) as count FROM firmwares WHERE project_id = ?';
        req.db.get(checkSql, [projectId], (err, result) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: '数据库错误' });
            }

            if (result.count > 0) {
                return res.status(400).json({ error: '该项目下存在固件，无法删除' });
            }

            const sql = 'DELETE FROM projects WHERE id = ?';
            req.db.run(sql, [projectId], function(err) {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ error: '数据库错误' });
                }

                res.json({ message: '项目删除成功' });
            });
        });
    });
});

module.exports = router;