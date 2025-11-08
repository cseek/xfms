/*
 * @Author: aurson jassimxiong@gmail.com
 * @Date: 2025-11-08
 * @Description: Application configuration
 *        ___ ___ _________ ___  ___ 
 *       / _ `/ // / __(_-</ _ \/ _ \
 *       \_,_/\_,_/_/ /___/\___/_//_/
 *      
 * Copyright (c) 2025 by Aurson, All Rights Reserved.
 */

require('dotenv').config();

module.exports = {
    // 服务器配置
    server: {
        port: process.env.PORT || 3000,
        host: process.env.HOST || 'localhost'
    },

    // Session 配置
    session: {
        secret: process.env.SESSION_SECRET || 'firmware-management-secret-key-change-in-production',
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.NODE_ENV === 'production', // 生产环境使用 HTTPS
            maxAge: 24 * 60 * 60 * 1000 // 24小时
        }
    },

    // 文件上传配置
    upload: {
        firmwareMaxSize: 1024 * 1024 * 1024, // 1GB
        testReportMaxSize: 50 * 1024 * 1024, // 50MB
        allowedFirmwareExtensions: ['.bin', '.hex', '.elf', '.zip'],
        allowedReportExtensions: ['.pdf', '.html', '.zip', '.doc', '.docx']
    },

    // 邮件配置（可选功能）
    email: {
        enabled: process.env.EMAIL_ENABLED === 'true',
        host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        from: process.env.EMAIL_FROM || '"固件管理系统" <noreply@firmware-system.com>'
    },

    // 数据库配置
    database: {
        path: process.env.DB_PATH || './database/firmware.db'
    },

    // 应用程序元数据
    app: {
        name: 'Firmware Management System',
        version: '1.0.0',
        author: 'Aurson'
    }
};
