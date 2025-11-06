/*
 * @Author: aurson jassimxiong@gmail.com
 * @Date: 2025-09-14 17:33:37
 * @LastEditors: aurson jassimxiong@gmail.com
 * @LastEditTime: 2025-11-06 11:09:58
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
const router = express.Router();

const adminRequired = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: '需要管理员权限' });
    }
};

// 获取所有模块
router.get('/', (req, res) => {
    const sql = 'SELECT * FROM modules ORDER BY name';
    req.db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: '数据库错误' });
        }
        res.json(rows);
    });
});

// 创建模块（仅管理员）
router.post('/', adminRequired, (req, res) => {
    const { name, description } = req.body;

    if (!name) {
        return res.status(400).json({ error: '模块名不能为空' });
    }

    const sql = 'INSERT INTO modules (name, description, created_by) VALUES (?, ?, ?)';
    req.db.run(sql, [name, description, req.session.user.id], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ error: '模块名已存在' });
            }
            console.error('Database error:', err);
            return res.status(500).json({ error: '数据库错误' });
        }

        res.json({
            message: '模块创建成功',
            moduleId: this.lastID
        });
    });
});

// 更新模块（仅管理员）
router.put('/:id', adminRequired, (req, res) => {
    const moduleId = req.params.id;
    const { name, description } = req.body;

    if (!name) {
        return res.status(400).json({ error: '模块名不能为空' });
    }

    const sql = 'UPDATE modules SET name = ?, description = ? WHERE id = ?';
    req.db.run(sql, [name, description, moduleId], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ error: '模块名已存在' });
            }
            console.error('Database error:', err);
            return res.status(500).json({ error: '数据库错误' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: '模块不存在' });
        }

        res.json({ message: '模块更新成功' });
    });
});

// 删除模块（仅管理员）
router.delete('/:id', adminRequired, (req, res) => {
    const moduleId = req.params.id;

    // 检查是否有固件使用此模块
    const checkSql = 'SELECT COUNT(*) as count FROM firmwares WHERE module_id = ?';
    req.db.get(checkSql, [moduleId], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: '数据库错误' });
        }

        if (result.count > 0) {
            return res.status(400).json({ error: '该模块下存在固件，无法删除' });
        }

        const sql = 'DELETE FROM modules WHERE id = ?';
        req.db.run(sql, [moduleId], function(err) {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: '数据库错误' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ error: '模块不存在' });
            }

            res.json({ message: '模块删除成功' });
        });
    });
});

module.exports = router;