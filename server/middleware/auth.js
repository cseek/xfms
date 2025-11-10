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
 * 确保用户有管理固件的权限（管理员或开发者）- 用于页面访问
 */
const canManageFirmware = (req, res, next) => {
    const user = req.session.user;
    if (user && (user.role === 'admin' || user.role === 'developer')) {
        next();
    } else {
        res.status(403).send('<h1>403 禁止访问</h1><p>您没有权限访问此页面。只有管理员和开发者可以访问固件管理功能。</p><a href="/releases">返回首页</a>');
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

/**
 * 确保用户有委派固件的权限（管理员或开发者）
 * 注意：开发者只能委派自己上传的固件，需要在具体路由中进一步检查
 */
const canAssignFirmware = (req, res, next) => {
    const user = req.session.user;
    if (user && (user.role === 'admin' || user.role === 'developer')) {
        next();
    } else {
        res.status(403).json({ error: '没有权限委派固件' });
    }
};

/**
 * 确保用户有发布/驳回固件的权限(管理员或测试人员)
 * 注意:测试人员只能发布/驳回委派给自己的固件,需要在具体路由中进一步检查
 */
const canPublishFirmware = (req, res, next) => {
    const user = req.session.user;
    if (user && (user.role === 'admin' || user.role === 'tester')) {
        next();
    } else {
        res.status(403).json({ error: '没有权限发布或驳回固件' });
    }
};

/**
 * 确保用户有管理模块的权限(管理员或开发者)
 * 注意:开发者只能管理自己创建的模块,需要在具体路由中进一步检查
 */
const canManageModule = (req, res, next) => {
    const user = req.session.user;
    if (user && (user.role === 'admin' || user.role === 'developer')) {
        next();
    } else {
        res.status(403).json({ error: '没有权限管理模块' });
    }
};

/**
 * 确保用户有管理项目的权限(管理员或开发者)
 * 注意:开发者只能管理自己创建的项目,需要在具体路由中进一步检查
 */
const canManageProject = (req, res, next) => {
    const user = req.session.user;
    if (user && (user.role === 'admin' || user.role === 'developer')) {
        next();
    } else {
        res.status(403).json({ error: '没有权限管理项目' });
    }
};

module.exports = {
    ensureAuthenticated,
    requireAuth,
    adminRequired,
    canUploadFirmware,
    canManageFirmware,
    canTestFirmware,
    canAssignFirmware,
    canPublishFirmware,
    canManageModule,
    canManageProject
};
