const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/db');
const { auth, JWT_SECRET } = require('../middleware/auth');

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  
  if (!user) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }
  
  const isValidPassword = bcrypt.compareSync(password, user.password);
  if (!isValidPassword) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }
  
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
  
  let employee = null;
  if (user.employee_id) {
    employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(user.employee_id);
  }
  
  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      employee
    }
  });
});

router.post('/change-password', auth, (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  
  if (!bcrypt.compareSync(oldPassword, user.password)) {
    return res.status(400).json({ error: '原密码错误' });
  }
  
  const hashedPassword = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(hashedPassword, req.user.id);
  
  res.json({ message: '密码修改成功' });
});

router.get('/me', auth, (req, res) => {
  let employee = null;
  if (req.user.employee_id) {
    employee = db.prepare(`
      SELECT e.*, d.name as department_name 
      FROM employees e 
      LEFT JOIN departments d ON e.department_id = d.id 
      WHERE e.id = ?
    `).get(req.user.employee_id);
  }
  
  res.json({
    user: {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role,
      employee
    }
  });
});

module.exports = router;
