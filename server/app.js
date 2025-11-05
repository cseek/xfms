/*
 * @Author: aurson jassimxiong@gmail.com
 * @Date: 2025-11-04 22:29:11
 * @LastEditors: aurson jassimxiong@gmail.com
 * @LastEditTime: 2025-11-04 23:59:16
 * @Description: 
 * Copyright (c) 2025 by Aurson, All Rights Reserved. 
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

app.get('/dashboard', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/');
    }
    res.sendFile(path.join(__dirname, '../client/html/dashboard.html'));
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