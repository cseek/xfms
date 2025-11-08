/*
 * @Author: aurson jassimxiong@gmail.com
 * @Date: 2025-11-08
 * @Description: Common middleware functions
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

/**
 * 确保用户已登录（用于页面路由，失败时重定向）
 */
const ensureAuthenticated = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/');
    }
    next();
};

/**
 * 确保用户已登录（用于 API 路由，失败时返回 JSON）
 */
const requireAuth = (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).json({ error: '请先登录' });
    }
    next();
};

/**
 * 确保用户是管理员
 */
const adminRequired = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: '需要管理员权限' });
    }
};

/**
 * 确保用户有上传固件的权限（管理员或开发者）
 */
const canUploadFirmware = (req, res, next) => {
    const user = req.session.user;
    if (user && (user.role === 'admin' || user.role === 'developer')) {
        next();
    } else {
        res.status(403).json({ error: '没有权限上传固件' });
    }
};

/**
 * 确保用户有测试权限（管理员或测试人员）
 */
const canTestFirmware = (req, res, next) => {
    const user = req.session.user;
    if (user && (user.role === 'admin' || user.role === 'tester')) {
        next();
    } else {
        res.status(403).json({ error: '没有权限执行测试操作' });
    }
};

module.exports = {
    ensureAuthenticated,
    requireAuth,
    adminRequired,
    canUploadFirmware,
    canTestFirmware
};
