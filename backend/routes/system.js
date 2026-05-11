const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { auth, isAdmin, isAdminOnly } = require('../middleware/auth');

router.get('/logs', auth, isAdmin, (req, res) => {
  const { page = 1, pageSize = 20, user_id, action } = req.query;
  
  let sql = `
    SELECT ol.*, u.username
    FROM operation_logs ol
    LEFT JOIN users u ON ol.user_id = u.id
    WHERE 1=1
  `;
  const params = [];
  
  if (user_id) {
    sql += ' AND ol.user_id = ?';
    params.push(user_id);
  }
  
  if (action) {
    sql += ' AND ol.action LIKE ?';
    params.push(`%${action}%`);
  }
  
  const countSql = sql.replace('SELECT ol.*, u.username', 'SELECT COUNT(*) as total');
  const total = db.prepare(countSql).get(...params).total;
  
  sql += ' ORDER BY ol.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));
  
  const logs = db.prepare(sql).all(...params);
  res.json({ list: logs, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.get('/announcements', auth, (req, res) => {
  const announcements = db.prepare(`
    SELECT a.*, u.username as publisher_name
    FROM announcements a
    LEFT JOIN users u ON a.publisher_id = u.id
    WHERE a.status = 'published'
    ORDER BY a.publish_time DESC
  `).all();
  
  res.json(announcements);
});

router.get('/announcements/all', auth, isAdmin, (req, res) => {
  const announcements = db.prepare(`
    SELECT a.*, u.username as publisher_name
    FROM announcements a
    LEFT JOIN users u ON a.publisher_id = u.id
    ORDER BY a.created_at DESC
  `).all();
  
  res.json(announcements);
});

router.post('/announcements', auth, isAdmin, (req, res) => {
  const { title, content, status } = req.body;
  
  const result = db.prepare(`
    INSERT INTO announcements (title, content, publisher_id, publish_time, status)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    title, 
    content, 
    status === 'published' ? req.user.id : null,
    status === 'published' ? new Date().toISOString() : null,
    status
  );
  
  res.status(201).json({ id: result.lastInsertRowid, message: '公告创建成功' });
});

router.put('/announcements/:id', auth, isAdmin, (req, res) => {
  const { title, content, status } = req.body;
  
  const announcement = db.prepare('SELECT * FROM announcements WHERE id = ?').get(req.params.id);
  
  let publishTime = announcement.publish_time;
  let publisherId = announcement.publisher_id;
  
  if (status === 'published' && announcement.status !== 'published') {
    publishTime = new Date().toISOString();
    publisherId = req.user.id;
  }
  
  db.prepare(`
    UPDATE announcements SET 
      title = ?, content = ?, status = ?, publisher_id = ?, publish_time = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(title, content, status, publisherId, publishTime, req.params.id);
  
  res.json({ message: '公告更新成功' });
});

router.delete('/announcements/:id', auth, isAdmin, (req, res) => {
  db.prepare('DELETE FROM announcements WHERE id = ?').run(req.params.id);
  res.json({ message: '公告删除成功' });
});

router.get('/users', auth, isAdminOnly, (req, res) => {
  const users = db.prepare(`
    SELECT u.id, u.username, u.role, u.created_at, e.name as employee_name, e.employee_no
    FROM users u
    LEFT JOIN employees e ON u.employee_id = e.id
    ORDER BY u.id
  `).all();
  
  res.json(users);
});

router.post('/users', auth, isAdminOnly, (req, res) => {
  const { username, password, role, employee_id } = req.body;
  
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    return res.status(400).json({ error: '用户名已存在' });
  }
  
  const bcrypt = require('bcryptjs');
  const hashedPassword = bcrypt.hashSync(password, 10);
  
  const result = db.prepare(
    'INSERT INTO users (username, password, role, employee_id) VALUES (?, ?, ?, ?)'
  ).run(username, hashedPassword, role, employee_id || null);
  
  res.status(201).json({ id: result.lastInsertRowid, message: '用户创建成功' });
});

router.put('/users/:id', auth, isAdminOnly, (req, res) => {
  const { role, employee_id } = req.body;
  
  db.prepare('UPDATE users SET role = ?, employee_id = ? WHERE id = ?').run(role, employee_id || null, req.params.id);
  
  res.json({ message: '用户更新成功' });
});

router.delete('/users/:id', auth, isAdminOnly, (req, res) => {
  if (parseInt(req.params.id) === req.user.id) {
    return res.status(400).json({ error: '不能删除自己的账号' });
  }
  
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ message: '用户删除成功' });
});

router.post('/backup', auth, isAdminOnly, (req, res) => {
  const fs = require('fs');
  const path = require('path');
  
  const backupDir = path.join(__dirname, '../../db/backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `attendance_${timestamp}.db`);
  
  const dbPath = process.env.DB_PATH || path.join(__dirname, '../../db/attendance.db');
  fs.copyFileSync(dbPath, backupFile);
  
  res.json({ message: '备份成功', file: backupFile });
});

module.exports = router;
