/*
 * @Author: aurson jassimxiong@gmail.com
 * @Date: 2025-09-14 17:33:37
 * @LastEditors: aurson jassimxiong@gmail.com
 * @LastEditTime: 2025-11-08
 * @Description: Email notification utilities (OPTIONAL - Currently not in use)
 * 
 * 注意：此模块为可选功能，当前未启用。
 * 若要启用邮件通知功能，请按以下步骤操作：
 * 1. 在 .env 文件中设置 EMAIL_ENABLED=true
 * 2. 配置正确的 SMTP 服务器信息
 * 3. 在需要的路由中引入并调用相应的邮件发送函数
 * 
 * NOTE: This module is optional and currently not enabled.
 * To enable email notifications:
 * 1. Set EMAIL_ENABLED=true in .env file
 * 2. Configure correct SMTP server settings
 * 3. Import and call email functions in routes as needed
 *        ___ ___ _________ ___  ___ 
 *       / _ `/ // / __(_-</ _ \/ _ \
 *       \_,_/\_,_/_/ /___/\___/_//_/
 *      
 * Copyright (c) 2025 by Aurson, All Rights Reserved.
 */

const nodemailer = require('nodemailer');
const config = require('../config');

// 只在启用邮件功能时创建传输器
let transporter = null;

if (config.email.enabled) {
    transporter = nodemailer.createTransport({
        host: config.email.host,
        port: config.email.port,
        secure: config.email.secure,
        auth: config.email.auth
    });
}

class Mailer {
    static async sendFirmwareUploadNotification(firmwareInfo) {
        if (!config.email.enabled || !transporter) {
            console.log('Email notifications are disabled');
            return;
        }

        const mailOptions = {
            from: config.email.from,
            to: 'admin@example.com', // 这里可以配置管理员的邮箱，或者从数据库读取
            subject: `新固件上传 - ${firmwareInfo.module_name} ${firmwareInfo.project_name} ${firmwareInfo.version}`,
            html: `
                <h2>新固件已上传</h2>
                <p><strong>模块：</strong> ${firmwareInfo.module_name}</p>
                <p><strong>项目：</strong> ${firmwareInfo.project_name}</p>
                <p><strong>版本：</strong> ${firmwareInfo.version}</p>
                <p><strong>上传者：</strong> ${firmwareInfo.uploader_name}</p>
                <p><strong>上传时间：</strong> ${firmwareInfo.created_at}</p>
                <p>请及时处理。</p>
            `
        };

        try {
            let info = await transporter.sendMail(mailOptions);
            console.log('Message sent: %s', info.messageId);
            console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        } catch (error) {
            console.error('Error sending email:', error);
        }
    }

    static async sendFirmwareStatusChangeNotification(firmwareInfo, oldStatus, newStatus) {
        if (!config.email.enabled || !transporter) {
            console.log('Email notifications are disabled');
            return;
        }

        const mailOptions = {
            from: config.email.from,
            to: 'admin@example.com', // 这里可以配置相关人员的邮箱
            subject: `固件状态更新 - ${firmwareInfo.module_name} ${firmwareInfo.project_name} ${firmwareInfo.version}`,
            html: `
                <h2>固件状态已更新</h2>
                <p><strong>模块：</strong> ${firmwareInfo.module_name}</p>
                <p><strong>项目：</strong> ${firmwareInfo.project_name}</p>
                <p><strong>版本：</strong> ${firmwareInfo.version}</p>
                <p><strong>状态：</strong> ${oldStatus} → ${newStatus}</p>
                <p><strong>操作者：</strong> ${firmwareInfo.performed_by_name}</p>
                <p><strong>时间：</strong> ${new Date().toLocaleString()}</p>
            `
        };

        try {
            let info = await transporter.sendMail(mailOptions);
            console.log('Message sent: %s', info.messageId);
            console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        } catch (error) {
            console.error('Error sending email:', error);
        }
    }
}

module.exports = Mailer;