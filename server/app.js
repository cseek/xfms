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

const config = require('./config');
const { attachDatabase, closeDatabase } = require('./utils/database');
const { ensureAuthenticated } = require('./middleware/auth');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const firmwareRoutes = require('./routes/firmwares');
const moduleRoutes = require('./routes/modules');
const projectRoutes = require('./routes/projects');

const app = express();
const PORT = config.server.port;

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
app.use(session(config.session));

// 数据库连接中间件（使用单例模式）
app.use(attachDatabase);

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

// 优雅关闭
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    closeDatabase();
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    closeDatabase();
    process.exit(0);
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});