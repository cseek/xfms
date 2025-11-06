/*
 * @Author: aurson jassimxiong@gmail.com
 * @Date: 2025-09-14 17:33:37
 * @LastEditors: aurson jassimxiong@gmail.com
 * @LastEditTime: 2025-11-06 11:10:35
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
const path = require('path');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const firmwareRoutes = require('./routes/firmwares');
const moduleRoutes = require('./routes/modules');
const projectRoutes = require('./routes/projects');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件配置
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../client')));

// 添加请求日志中间件
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    if (req.method === 'POST' || req.method === 'PUT') {
        console.log('请求体:', req.body);
    }
    next();
});

// Session配置
app.use(session({
    secret: 'firmware-management-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24小时
}));

// 数据库连接中间件
app.use((req, res, next) => {
    const dbPath = path.join(__dirname, '../database/firmware.db');
    req.db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
        if (err) {
            console.error('Error opening database:', err);
            return res.status(500).json({ error: 'Database error' });
        }
    });
    next();
});

const ensureAuthenticated = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/');
    }
    next();
};

// 路由配置
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/firmwares', firmwareRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/projects', projectRoutes);

// 静态文件服务
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/html/login.html'));
});

app.get('/firmwares', ensureAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, '../client/html/firmware-list.html'));
});

app.get('/manage/firmware', ensureAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, '../client/html/firmware-management.html'));
});

app.get('/system', ensureAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, '../client/html/system-management.html'));
});

app.get('/about', ensureAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, '../client/html/about.html'));
});

app.get('/dashboard', (req, res) => {
    res.redirect('/firmwares');
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// 关闭数据库连接
app.use((req, res, next) => {
    if (req.db) {
        req.db.close((err) => {
            if (err) {
                console.error('Error closing database:', err);
            }
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});