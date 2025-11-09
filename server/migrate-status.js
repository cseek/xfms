const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database', 'firmware.db');
const db = new sqlite3.Database(dbPath);

console.log('开始迁移固件状态...');

db.serialize(() => {
    // 1. 创建临时表,使用新的CHECK约束
    db.run(`
        CREATE TABLE firmwares_new (
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
            assigned_to INTEGER,
            assign_note TEXT,
            released_by INTEGER,
            released_at DATETIME,
            FOREIGN KEY(module_id) REFERENCES modules(id),
            FOREIGN KEY(project_id) REFERENCES projects(id),
            FOREIGN KEY(uploaded_by) REFERENCES users(id),
            FOREIGN KEY(assigned_to) REFERENCES users(id),
            FOREIGN KEY(released_by) REFERENCES users(id)
        )
    `, (err) => {
        if (err) {
            console.error('创建新表失败:', err);
            return;
        }
        console.log('✓ 创建新表成功');

        // 2. 迁移数据,映射旧状态到新状态
        // testing, passed, failed -> pending (待委派)
        // released -> released (已发布)
        // obsolete -> rejected (已驳回)
        db.run(`
            INSERT INTO firmwares_new 
            (id, module_id, project_id, version, description, additional_info, 
             file_path, file_size, md5, status, environment, uploaded_by, 
             test_report_path, created_at, updated_at, assigned_to, assign_note, 
             released_by, released_at)
            SELECT 
                id, module_id, project_id, version, description, additional_info,
                file_path, file_size, md5,
                CASE 
                    WHEN status IN ('testing', 'passed', 'failed') THEN 'pending'
                    WHEN status = 'released' THEN 'released'
                    WHEN status = 'obsolete' THEN 'rejected'
                    ELSE status
                END as status,
                environment, uploaded_by, test_report_path, 
                created_at, updated_at, assigned_to, assign_note,
                released_by, released_at
            FROM firmwares
        `, (err) => {
            if (err) {
                console.error('数据迁移失败:', err);
                return;
            }
            console.log('✓ 数据迁移成功');

            // 3. 删除旧表
            db.run('DROP TABLE firmwares', (err) => {
                if (err) {
                    console.error('删除旧表失败:', err);
                    return;
                }
                console.log('✓ 删除旧表成功');

                // 4. 重命名新表
                db.run('ALTER TABLE firmwares_new RENAME TO firmwares', (err) => {
                    if (err) {
                        console.error('重命名表失败:', err);
                        return;
                    }
                    console.log('✓ 重命名表成功');
                    console.log('✓ 迁移完成!');
                    
                    // 验证结果
                    db.all('SELECT status, COUNT(*) as count FROM firmwares GROUP BY status', [], (err, rows) => {
                        if (err) {
                            console.error('验证失败:', err);
                        } else {
                            console.log('\n当前状态分布:');
                            rows.forEach(row => {
                                const statusMap = {
                                    'pending': '待委派',
                                    'assigned': '待发布',
                                    'released': '已发布',
                                    'rejected': '已驳回'
                                };
                                console.log(`  ${statusMap[row.status] || row.status}: ${row.count}`);
                            });
                        }
                        
                        db.close((err) => {
                            if (err) {
                                console.error('关闭数据库失败:', err);
                            } else {
                                console.log('\n数据库连接已关闭');
                            }
                        });
                    });
                });
            });
        });
    });
});
