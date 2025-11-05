const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();

router.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    const sql = 'SELECT * FROM users WHERE username = ?';
    req.db.get(sql, [username], (err, user) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: '数据库错误' });
        }

        if (!user) {
            return res.status(401).json({ error: '用户名或密码错误' });
        }

        const passwordIsValid = bcrypt.compareSync(password, user.password);
        if (!passwordIsValid) {
            return res.status(401).json({ error: '用户名或密码错误' });
        }

        // 设置session
        req.session.user = {
            id: user.id,
            username: user.username,
            role: user.role,
            email: user.email
        };

        res.json({
            message: '登录成功',
            user: req.session.user
        });
    });
});

router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: '退出登录失败' });
        }
        res.clearCookie('connect.sid');
        res.json({ message: '退出登录成功' });
    });
});

router.get('/check', (req, res) => {
    if (req.session.user) {
        res.json(req.session.user);
    } else {
        res.status(401).json({ error: '未登录' });
    }
});

module.exports = router;