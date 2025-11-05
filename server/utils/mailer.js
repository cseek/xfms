/*
 * @Author: aurson jassimxiong@gmail.com
 * @Date: 2025-11-04 22:59:48
 * @LastEditors: aurson jassimxiong@gmail.com
 * @LastEditTime: 2025-11-04 22:59:52
 * @Description: 
 * Copyright (c) 2025 by Aurson, All Rights Reserved. 
 */
const nodemailer = require('nodemailer');

// 创建邮件传输器（这里使用 Ethereal 测试邮件服务，实际使用时请配置真实的SMTP）
const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: 'your-email@ethereal.email', // 替换为你的 Ethereal 邮箱
        pass: 'your-password' // 替换为你的 Ethereal 密码
    }
});

// 或者使用 Gmail（注意：需要开启两步验证并使用应用专用密码）
// const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//         user: 'your-email@gmail.com',
//         pass: 'your-app-password'
//     }
// });

class Mailer {
    static async sendFirmwareUploadNotification(firmwareInfo) {
        const mailOptions = {
            from: '"固件管理系统" <noreply@firmware-system.com>',
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
        const mailOptions = {
            from: '"固件管理系统" <noreply@firmware-system.com>',
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