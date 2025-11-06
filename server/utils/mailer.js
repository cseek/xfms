/*
 * @Author: aurson jassimxiong@gmail.com
 * @Date: 2025-09-14 17:33:37
 * @LastEditors: aurson jassimxiong@gmail.com
 * @LastEditTime: 2025-11-06 11:10:27
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