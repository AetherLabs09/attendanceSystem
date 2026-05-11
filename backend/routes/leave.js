const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { auth, isAdmin } = require('../middleware/auth');

router.get('/', auth, (req, res) => {
  const { employee_id, status, start_date, end_date, page = 1, pageSize = 10 } = req.query;
  
  let sql = `
    SELECT lr.*, e.name as employee_name, e.employee_no, d.name as department_name,
      u.username as approver_name
    FROM leave_requests lr
    LEFT JOIN employees e ON lr.employee_id = e.id
    LEFT JOIN departments d ON e.department_id = d.id
    LEFT JOIN users u ON lr.approver_id = u.id
    WHERE 1=1
  `;
  const params = [];
  
  if (req.user.role === 'employee') {
    sql += ' AND lr.employee_id = ?';
    params.push(req.user.employee_id);
  } else if (employee_id) {
    sql += ' AND lr.employee_id = ?';
    params.push(employee_id);
  }
  
  if (status) {
    sql += ' AND lr.status = ?';
    params.push(status);
  }
  
  if (start_date) {
    sql += ' AND lr.start_date >= ?';
    params.push(start_date);
  }
  
  if (end_date) {
    sql += ' AND lr.end_date <= ?';
    params.push(end_date);
  }
  
  const countSql = sql.replace('SELECT lr.*, e.name as employee_name, e.employee_no, d.name as department_name, u.username as approver_name', 'SELECT COUNT(*) as total');
  const total = db.prepare(countSql).get(...params).total;
  
  sql += ' ORDER BY lr.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));
  
  const leaves = db.prepare(sql).all(...params);
  res.json({ list: leaves, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.get('/:id', auth, (req, res) => {
  const leave = db.prepare(`
    SELECT lr.*, e.name as employee_name, e.employee_no, d.name as department_name
    FROM leave_requests lr
    LEFT JOIN employees e ON lr.employee_id = e.id
    LEFT JOIN departments d ON e.department_id = d.id
    WHERE lr.id = ?
  `).get(req.params.id);
  
  if (!leave) {
    return res.status(404).json({ error: '请假记录不存在' });
  }
  
  if (req.user.role === 'employee' && leave.employee_id !== req.user.employee_id) {
    return res.status(403).json({ error: '权限不足' });
  }
  
  res.json(leave);
});

router.post('/', auth, (req, res) => {
  if (!req.user.employee_id) {
    return res.status(400).json({ error: '未关联员工信息' });
  }
  
  const { leave_type, start_date, end_date, days, reason } = req.body;
  
  const result = db.prepare(`
    INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, days, reason)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(req.user.employee_id, leave_type, start_date, end_date, days, reason);
  
  res.status(201).json({ id: result.lastInsertRowid, message: '请假申请已提交' });
});

router.put('/:id', auth, (req, res) => {
  const leave = db.prepare('SELECT * FROM leave_requests WHERE id = ?').get(req.params.id);
  
  if (!leave) {
    return res.status(404).json({ error: '请假记录不存在' });
  }
  
  if (req.user.role === 'employee' && leave.employee_id !== req.user.employee_id) {
    return res.status(403).json({ error: '权限不足' });
  }
  
  if (leave.status !== 'pending') {
    return res.status(400).json({ error: '只能修改待审批的申请' });
  }
  
  const { leave_type, start_date, end_date, days, reason } = req.body;
  
  db.prepare(`
    UPDATE leave_requests SET 
      leave_type = ?, start_date = ?, end_date = ?, days = ?, reason = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(leave_type, start_date, end_date, days, reason, req.params.id);
  
  res.json({ message: '请假申请已更新' });
});

router.post('/:id/approve', auth, isAdmin, (req, res) => {
  const { status, remark } = req.body;
  
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: '无效的审批状态' });
  }
  
  db.prepare(`
    UPDATE leave_requests SET 
      status = ?, approver_id = ?, approve_time = CURRENT_TIMESTAMP, approve_remark = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status, req.user.id, remark, req.params.id);
  
  res.json({ message: status === 'approved' ? '已批准' : '已拒绝' });
});

router.delete('/:id', auth, (req, res) => {
  const leave = db.prepare('SELECT * FROM leave_requests WHERE id = ?').get(req.params.id);
  
  if (!leave) {
    return res.status(404).json({ error: '请假记录不存在' });
  }
  
  if (req.user.role === 'employee' && leave.employee_id !== req.user.employee_id) {
    return res.status(403).json({ error: '权限不足' });
  }
  
  if (leave.status !== 'pending') {
    return res.status(400).json({ error: '只能删除待审批的申请' });
  }
  
  db.prepare('DELETE FROM leave_requests WHERE id = ?').run(req.params.id);
  res.json({ message: '请假申请已删除' });
});

module.exports = router;
