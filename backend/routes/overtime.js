const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { auth, isAdmin } = require('../middleware/auth');

router.get('/', auth, (req, res) => {
  const { employee_id, status, start_date, end_date, page = 1, pageSize = 10 } = req.query;
  
  let sql = `
    SELECT orq.*, e.name as employee_name, e.employee_no, d.name as department_name,
      u.username as approver_name
    FROM overtime_requests orq
    LEFT JOIN employees e ON orq.employee_id = e.id
    LEFT JOIN departments d ON e.department_id = d.id
    LEFT JOIN users u ON orq.approver_id = u.id
    WHERE 1=1
  `;
  const params = [];
  
  if (req.user.role === 'employee') {
    sql += ' AND orq.employee_id = ?';
    params.push(req.user.employee_id);
  } else if (employee_id) {
    sql += ' AND orq.employee_id = ?';
    params.push(employee_id);
  }
  
  if (status) {
    sql += ' AND orq.status = ?';
    params.push(status);
  }
  
  if (start_date) {
    sql += ' AND orq.date >= ?';
    params.push(start_date);
  }
  
  if (end_date) {
    sql += ' AND orq.date <= ?';
    params.push(end_date);
  }
  
  const countSql = sql.replace('SELECT orq.*, e.name as employee_name, e.employee_no, d.name as department_name, u.username as approver_name', 'SELECT COUNT(*) as total');
  const total = db.prepare(countSql).get(...params).total;
  
  sql += ' ORDER BY orq.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));
  
  const overtimes = db.prepare(sql).all(...params);
  res.json({ list: overtimes, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.get('/:id', auth, (req, res) => {
  const overtime = db.prepare(`
    SELECT orq.*, e.name as employee_name, e.employee_no, d.name as department_name
    FROM overtime_requests orq
    LEFT JOIN employees e ON orq.employee_id = e.id
    LEFT JOIN departments d ON e.department_id = d.id
    WHERE orq.id = ?
  `).get(req.params.id);
  
  if (!overtime) {
    return res.status(404).json({ error: '加班记录不存在' });
  }
  
  if (req.user.role === 'employee' && overtime.employee_id !== req.user.employee_id) {
    return res.status(403).json({ error: '权限不足' });
  }
  
  res.json(overtime);
});

router.post('/', auth, (req, res) => {
  if (!req.user.employee_id) {
    return res.status(400).json({ error: '未关联员工信息' });
  }
  
  const { date, start_time, end_time, hours, reason } = req.body;
  
  const result = db.prepare(`
    INSERT INTO overtime_requests (employee_id, date, start_time, end_time, hours, reason)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(req.user.employee_id, date, start_time, end_time, hours, reason);
  
  res.status(201).json({ id: result.lastInsertRowid, message: '加班申请已提交' });
});

router.put('/:id', auth, (req, res) => {
  const overtime = db.prepare('SELECT * FROM overtime_requests WHERE id = ?').get(req.params.id);
  
  if (!overtime) {
    return res.status(404).json({ error: '加班记录不存在' });
  }
  
  if (req.user.role === 'employee' && overtime.employee_id !== req.user.employee_id) {
    return res.status(403).json({ error: '权限不足' });
  }
  
  if (overtime.status !== 'pending') {
    return res.status(400).json({ error: '只能修改待审批的申请' });
  }
  
  const { date, start_time, end_time, hours, reason } = req.body;
  
  db.prepare(`
    UPDATE overtime_requests SET 
      date = ?, start_time = ?, end_time = ?, hours = ?, reason = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(date, start_time, end_time, hours, reason, req.params.id);
  
  res.json({ message: '加班申请已更新' });
});

router.post('/:id/approve', auth, isAdmin, (req, res) => {
  const { status, remark } = req.body;
  
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: '无效的审批状态' });
  }
  
  db.prepare(`
    UPDATE overtime_requests SET 
      status = ?, approver_id = ?, approve_time = CURRENT_TIMESTAMP, approve_remark = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status, req.user.id, remark, req.params.id);
  
  res.json({ message: status === 'approved' ? '已批准' : '已拒绝' });
});

router.delete('/:id', auth, (req, res) => {
  const overtime = db.prepare('SELECT * FROM overtime_requests WHERE id = ?').get(req.params.id);
  
  if (!overtime) {
    return res.status(404).json({ error: '加班记录不存在' });
  }
  
  if (req.user.role === 'employee' && overtime.employee_id !== req.user.employee_id) {
    return res.status(403).json({ error: '权限不足' });
  }
  
  if (overtime.status !== 'pending') {
    return res.status(400).json({ error: '只能删除待审批的申请' });
  }
  
  db.prepare('DELETE FROM overtime_requests WHERE id = ?').run(req.params.id);
  res.json({ message: '加班申请已删除' });
});

module.exports = router;
