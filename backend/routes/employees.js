const express = require('express');
const router = express.Router();
const db = require('../database/db');
const bcrypt = require('bcryptjs');
const { auth, isAdmin } = require('../middleware/auth');

router.get('/', auth, isAdmin, (req, res) => {
  const { department_id, status, keyword, page = 1, pageSize = 10 } = req.query;
  
  let sql = `
    SELECT e.*, d.name as department_name 
    FROM employees e 
    LEFT JOIN departments d ON e.department_id = d.id 
    WHERE 1=1
  `;
  const params = [];
  
  if (department_id) {
    sql += ' AND e.department_id = ?';
    params.push(department_id);
  }
  
  if (status) {
    sql += ' AND e.status = ?';
    params.push(status);
  }
  
  if (keyword) {
    sql += ' AND (e.name LIKE ? OR e.employee_no LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  
  const countSql = sql.replace('SELECT e.*, d.name as department_name', 'SELECT COUNT(*) as total');
  const total = db.prepare(countSql).get(...params).total;
  
  sql += ' ORDER BY e.id DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));
  
  const employees = db.prepare(sql).all(...params);
  res.json({ list: employees, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.get('/my-info', auth, (req, res) => {
  if (!req.user.employee_id) {
    return res.status(404).json({ error: '未关联员工信息' });
  }
  
  const employee = db.prepare(`
    SELECT e.*, d.name as department_name 
    FROM employees e 
    LEFT JOIN departments d ON e.department_id = d.id 
    WHERE e.id = ?
  `).get(req.user.employee_id);
  
  res.json(employee);
});

router.get('/:id', auth, (req, res) => {
  if (req.user.role === 'employee' && req.user.employee_id !== parseInt(req.params.id)) {
    return res.status(403).json({ error: '权限不足' });
  }
  
  const employee = db.prepare(`
    SELECT e.*, d.name as department_name 
    FROM employees e 
    LEFT JOIN departments d ON e.department_id = d.id 
    WHERE e.id = ?
  `).get(req.params.id);
  
  if (!employee) {
    return res.status(404).json({ error: '员工不存在' });
  }
  
  res.json(employee);
});

router.post('/', auth, isAdmin, (req, res) => {
  const { name, employee_no, position, department_id, hire_date, status, phone, email, create_account } = req.body;
  
  const existing = db.prepare('SELECT id FROM employees WHERE employee_no = ?').get(employee_no);
  if (existing) {
    return res.status(400).json({ error: '工号已存在' });
  }
  
  const result = db.prepare(
    'INSERT INTO employees (name, employee_no, position, department_id, hire_date, status, phone, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(name, employee_no, position, department_id, hire_date, status || 'active', phone, email);
  
  if (create_account) {
    const hashedPassword = bcrypt.hashSync('123456', 10);
    db.prepare('INSERT INTO users (username, password, role, employee_id) VALUES (?, ?, ?, ?)').run(employee_no, hashedPassword, 'employee', result.lastInsertRowid);
  }
  
  res.status(201).json({ id: result.lastInsertRowid, message: '员工创建成功' });
});

router.put('/:id', auth, isAdmin, (req, res) => {
  const { name, employee_no, position, department_id, hire_date, status, phone, email } = req.body;
  
  const existing = db.prepare('SELECT id FROM employees WHERE employee_no = ? AND id != ?').get(employee_no, req.params.id);
  if (existing) {
    return res.status(400).json({ error: '工号已存在' });
  }
  
  db.prepare(
    'UPDATE employees SET name = ?, employee_no = ?, position = ?, department_id = ?, hire_date = ?, status = ?, phone = ?, email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).run(name, employee_no, position, department_id, hire_date, status, phone, email, req.params.id);
  
  res.json({ message: '员工更新成功' });
});

router.delete('/:id', auth, isAdmin, (req, res) => {
  db.prepare('DELETE FROM users WHERE employee_id = ?').run(req.params.id);
  db.prepare('DELETE FROM employees WHERE id = ?').run(req.params.id);
  res.json({ message: '员工删除成功' });
});

router.put('/:id/status', auth, isAdmin, (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE employees SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, req.params.id);
  res.json({ message: '状态更新成功' });
});

module.exports = router;
