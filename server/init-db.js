/*
 * @Author: aurson jassimxiong@gmail.com
 * @Date: 2025-09-14 17:33:37
 * @LastEditors: aurson jassimxiong@gmail.com
 * @LastEditTime: 2025-11-06 11:10:46
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

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs-extra');
const bcrypt = require('bcryptjs');

// 确保目录存在
const dbDir = path.join(__dirname, '../database');
const uploadDir = path.join(__dirname, '../uploads');
fs.ensureDirSync(dbDir);
fs.ensureDirSync(uploadDir);
fs.ensureDirSync(path.join(uploadDir, 'firmwares'));
fs.ensureDirSync(path.join(uploadDir, 'test-reports'));

const dbPath = path.join(dbDir, 'firmware.db');
const db = new sqlite3.Database(dbPath);

// 创建表
db.serialize(() => {
    // 用户表
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin', 'developer', 'tester', 'user')),
        email TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // 模块表
    db.run(`CREATE TABLE IF NOT EXISTS modules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(created_by) REFERENCES users(id)
    )`);

    // 项目表
    db.run(`CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(created_by) REFERENCES users(id)
    )`);

    // 固件表
    db.run(`CREATE TABLE IF NOT EXISTS firmwares (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        module_id INTEGER NOT NULL,
        project_id INTEGER NOT NULL,
        version TEXT NOT NULL,
        description TEXT,
        additional_info TEXT,
        file_path TEXT NOT NULL,
        file_size INTEGER,
        md5 TEXT,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'assigned', 'released', 'rejected')),
        environment TEXT DEFAULT 'test' CHECK(environment IN ('test', 'release')),
        uploaded_by INTEGER NOT NULL,
        test_report_path TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(module_id) REFERENCES modules(id),
        FOREIGN KEY(project_id) REFERENCES projects(id),
        FOREIGN KEY(uploaded_by) REFERENCES users(id)
    )`);

    // 固件历史表
    db.run(`CREATE TABLE IF NOT EXISTS firmware_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        firmware_id INTEGER NOT NULL,
        version TEXT NOT NULL,
        action TEXT NOT NULL,
        performed_by INTEGER NOT NULL,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(firmware_id) REFERENCES firmwares(id),
        FOREIGN KEY(performed_by) REFERENCES users(id)
    )`);

    // 插入默认管理员用户
    const hashedPassword = bcrypt.hashSync('admin', 10);
    db.run(`INSERT OR IGNORE INTO users (username, password, role, email) 
            VALUES (?, ?, ?, ?)`, 
            ['admin', hashedPassword, 'admin', 'admin@example.com'], function(err) {
        if (err) {
            console.error('Error creating admin user:', err);
        } else {
            console.log('Admin user created successfully');
        }
    });

    // 插入一些示例模块和项目
    db.run(`INSERT OR IGNORE INTO modules (name, description) VALUES 
            ('WiFi Module', 'Wireless communication module'),
            ('BLE Module', 'Bluetooth Low Energy module'),
            ('GPS Module', 'Global Positioning System module')`);

    db.run(`INSERT OR IGNORE INTO projects (name, description) VALUES 
            ('Smart Home Hub', 'Central control unit for smart home'),
            ('IoT Sensor Node', 'Remote sensor monitoring device'),
            ('Wearable Device', 'Smart wearable technology')`);

    // 为现有数据库添加md5字段（如果不存在）
    db.run(`ALTER TABLE firmwares ADD COLUMN md5 TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
            console.error('Error adding md5 column:', err);
        } else if (!err) {
            console.log('MD5 column added to firmwares table');
        }
    });

    console.log('Database initialized successfully');
});

db.close((err) => {
    if (err) {
        console.error('Error closing database:', err);
    } else {
        console.log('Database connection closed');
    }
});