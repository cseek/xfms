/*
 * @Author: aurson jassimxiong@gmail.com
 * @Date: 2025-11-08
 * @Description: Database utility functions
 *        ___ ___ _________ ___  ___ 
 *       / _ `/ // / __(_-</ _ \/ _ \
 *       \_,_/\_,_/_/ /___/\___/_//_/
 *      
 * Copyright (c) 2025 by Aurson, All Rights Reserved.
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 单例数据库连接
let db = null;

/**
 * 获取数据库连接（单例模式）
 */
const getDatabase = () => {
    if (!db) {
        const dbPath = path.join(__dirname, '../../database/firmware.db');
        db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
            if (err) {
                console.error('Error opening database:', err);
                throw err;
            }
            console.log('Database connection established');
        });
    }
    return db;
};

/**
 * 数据库中间件 - 将数据库连接附加到请求对象
 */
const attachDatabase = (req, res, next) => {
    req.db = getDatabase();
    next();
};

/**
 * 关闭数据库连接（仅在应用关闭时调用）
 */
const closeDatabase = () => {
    if (db) {
        db.close((err) => {
            if (err) {
                console.error('Error closing database:', err);
            } else {
                console.log('Database connection closed');
            }
            db = null;
        });
    }
};

module.exports = {
    getDatabase,
    attachDatabase,
    closeDatabase
};
