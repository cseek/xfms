/*
 * @Author: aurson jassimxiong@gmail.com
 * @Date: 2025-09-14 17:33:37
 * @LastEditors: aurson jassimxiong@gmail.com
 * @LastEditTime: 2025-11-06 11:09:36
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
const router = express.Router();

router.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    const sql = 'SELECT * FROM users WHERE username = ?';
    req.db.get(sql, [username], (err, user) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: '数据库错误' });
        }

        if (!user) {
            return res.status(401).json({ error: '用户名或密码错误' });
        }

        const passwordIsValid = bcrypt.compareSync(password, user.password);
        if (!passwordIsValid) {
            return res.status(401).json({ error: '用户名或密码错误' });
        }

        // 设置session
        req.session.user = {
            id: user.id,
            username: user.username,
            role: user.role,
            email: user.email
        };

        res.json({
            message: '登录成功',
            user: req.session.user
        });
    });
});

router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: '退出登录失败' });
        }
        res.clearCookie('connect.sid');
        res.json({ message: '退出登录成功' });
    });
});

router.get('/check', (req, res) => {
    if (req.session.user) {
        res.json(req.session.user);
    } else {
        res.status(401).json({ error: '未登录' });
    }
});

module.exports = router;