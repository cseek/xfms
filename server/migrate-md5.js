/*
 * @Author: aurson jassimxiong@gmail.com
 * @Date: 2025-11-09
 * @Description: 数据库迁移脚本 - 为现有固件计算并添加MD5
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs-extra');
const crypto = require('crypto');

const dbPath = path.join(__dirname, '../database/firmware.db');
const db = new sqlite3.Database(dbPath);

// 计算文件MD5
function calculateFileMD5(filePath) {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(filePath)) {
            console.log(`文件不存在: ${filePath}`);
            resolve(null);
            return;
        }

        const hash = crypto.createHash('md5');
        const stream = fs.createReadStream(filePath);
        
        stream.on('data', (data) => {
            hash.update(data);
        });
        
        stream.on('end', () => {
            resolve(hash.digest('hex'));
        });
        
        stream.on('error', (err) => {
            console.error(`读取文件错误: ${filePath}`, err);
            resolve(null);
        });
    });
}

console.log('开始迁移数据库...');

db.serialize(() => {
    // 1. 添加md5列（如果不存在）
    db.run(`ALTER TABLE firmwares ADD COLUMN md5 TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
            console.error('添加md5列失败:', err);
        } else if (!err) {
            console.log('✓ MD5列已添加');
        } else {
            console.log('✓ MD5列已存在');
        }
    });

    // 2. 查询所有没有MD5值的固件
    db.all('SELECT id, file_path FROM firmwares WHERE md5 IS NULL OR md5 = ""', async (err, rows) => {
        if (err) {
            console.error('查询固件失败:', err);
            db.close();
            return;
        }

        console.log(`找到 ${rows.length} 个固件需要计算MD5...`);

        if (rows.length === 0) {
            console.log('✓ 所有固件已有MD5值');
            db.close();
            return;
        }

        // 逐个计算MD5并更新
        let completed = 0;
        let failed = 0;

        for (const row of rows) {
            const md5 = await calculateFileMD5(row.file_path);
            
            if (md5) {
                db.run('UPDATE firmwares SET md5 = ? WHERE id = ?', [md5, row.id], (err) => {
                    if (err) {
                        console.error(`更新固件 ${row.id} MD5失败:`, err);
                        failed++;
                    } else {
                        completed++;
                        console.log(`✓ 固件 ${row.id}: ${md5}`);
                    }

                    // 检查是否全部完成
                    if (completed + failed === rows.length) {
                        console.log(`\n迁移完成！成功: ${completed}, 失败: ${failed}`);
                        db.close();
                    }
                });
            } else {
                failed++;
                console.log(`✗ 固件 ${row.id}: 文件不存在或读取失败`);
                
                if (completed + failed === rows.length) {
                    console.log(`\n迁移完成！成功: ${completed}, 失败: ${failed}`);
                    db.close();
                }
            }
        }
    });
});
