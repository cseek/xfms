/*
 * @Author: aurson jassimxiong@gmail.com
 * @Date: 2025-09-14 17:33:37
 * @LastEditors: aurson jassimxiong@gmail.com
 * @LastEditTime: 2025-11-06 11:10:18
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
const bcrypt = require('bcryptjs');
const { adminRequired, requireAuth } = require('../middleware/auth');
const router = express.Router();

// 获取所有用户（所有登录用户可查看，但只有管理员能进行增删改操作）
router.get('/', requireAuth, (req, res) => {
    const sql = 'SELECT id, username, role, email, created_at FROM users ORDER BY created_at DESC';
    req.db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: '数据库错误' });
        }
        res.json(rows);
    });
});

// 获取所有测试人员（开发者或管理员在委派时使用）
router.get('/testers', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: '请先登录' });
    }

    const sql = 'SELECT id, username, email FROM users WHERE role = ? ORDER BY username';
    req.db.all(sql, ['tester'], (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: '数据库错误' });
        }
        res.json(rows);
    });
});

// 创建用户（仅管理员）
router.post('/', adminRequired, (req, res) => {
    const { username, password, role, email } = req.body;

    if (!username || !password || !role) {
        return res.status(400).json({ error: '用户、密码和角色不能为空' });
    }

    const allowedRoles = ['developer', 'tester', 'user'];
    if (!allowedRoles.includes(role)) {
        return res.status(400).json({ error: '角色不合法' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const sql = 'INSERT INTO users (username, password, role, email) VALUES (?, ?, ?, ?)';
    req.db.run(sql, [username, hashedPassword, role, email], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ error: '用户已存在' });
            }
            console.error('Database error:', err);
            return res.status(500).json({ error: '数据库错误' });
        }

        res.json({
            message: '用户创建成功',
            userId: this.lastID
        });
    });
});

// 更新用户（仅管理员）
router.put('/:id', adminRequired, (req, res) => {
    const userId = req.params.id;
    const { password, role, email } = req.body;

    // 检查用户是否存在
    const checkSql = 'SELECT * FROM users WHERE id = ?';
    req.db.get(checkSql, [userId], (err, user) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: '数据库错误' });
        }

        if (!user) {
            return res.status(404).json({ error: '用户不存在' });
        }

        let updateSql = 'UPDATE users SET role = ?, email = ?';
        let params = [role, email];

        if (password) {
            updateSql += ', password = ?';
            const hashedPassword = bcrypt.hashSync(password, 10);
            params.push(hashedPassword);
        }

        updateSql += ' WHERE id = ?';
        params.push(userId);

        req.db.run(updateSql, params, function(err) {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: '数据库错误' });
            }

            res.json({ message: '用户更新成功' });
        });
    });
});

// 删除用户（仅管理员）
router.delete('/:id', adminRequired, (req, res) => {
    const userId = req.params.id;

    // 不能删除自己
    if (req.session.user.id == userId) {
        return res.status(400).json({ error: '不能删除当前登录的用户' });
    }

    const sql = 'DELETE FROM users WHERE id = ?';
    req.db.run(sql, [userId], function(err) {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: '数据库错误' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: '用户不存在' });
        }

        res.json({ message: '用户删除成功' });
    });
});

module.exports = router;