/*
 * @Author: aurson jassimxiong@gmail.com
 * @Date: 2025-11-08
 * @Description: File upload utilities
 *        ___ ___ _________ ___  ___ 
 *       / _ `/ // / __(_-</ _ \/ _ \
 *       \_,_/\_,_/_/ /___/\___/_//_/
 *      
 * Copyright (c) 2025 by Aurson, All Rights Reserved.
 */

const path = require('path');
const fs = require('fs-extra');

/**
 * 清理上传的文件（如果上传失败）
 * @param {Object} file - multer 文件对象
 */
const cleanupUploadedFile = (file) => {
    if (file && file.path) {
        try {
            const fileDir = path.dirname(file.path);
            fs.removeSync(fileDir); // 删除整个文件夹
            console.log(`Cleaned up uploaded file directory: ${fileDir}`);
        } catch (error) {
            console.error('Error cleaning up uploaded file:', error);
        }
    }
};

/**
 * 验证版本号格式 (vX.Y.Z)
 * @param {string} version - 版本号
 * @returns {boolean}
 */
const isValidVersionFormat = (version) => {
    const versionRegex = /^v\d+\.\d+\.\d+$/;
    return versionRegex.test(version);
};

/**
 * 获取文件扩展名
 * @param {string} filename - 文件名
 * @returns {string}
 */
const getFileExtension = (filename) => {
    return path.extname(filename).toLowerCase();
};

module.exports = {
    cleanupUploadedFile,
    isValidVersionFormat,
    getFileExtension
};
