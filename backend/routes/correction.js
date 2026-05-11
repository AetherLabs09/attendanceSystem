const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { auth, isAdmin } = require('../middleware/auth');

router.get('/', auth, (req, res) => {
  const { employee_id, status, start_date, end_date, page = 1, pageSize = 10 } = req.query;
  
  let sql = `
    SELECT cr.*, e.name as employee_name, e.employee_no, d.name as department_name,
      u.username as approver_name
    FROM correction_requests cr
    LEFT JOIN employees e ON cr.employee_id = e.id
    LEFT JOIN departments d ON e.department_id = d.id
    LEFT JOIN users u ON cr.approver_id = u.id
    WHERE 1=1
  `;
  const params = [];
  
  if (req.user.role === 'employee') {
    sql += ' AND cr.employee_id = ?';
    params.push(req.user.employee_id);
  } else if (employee_id) {
    sql += ' AND cr.employee_id = ?';
    params.push(employee_id);
  }
  
  if (status) {
    sql += ' AND cr.status = ?';
    params.push(status);
  }
  
  if (start_date) {
    sql += ' AND cr.date >= ?';
    params.push(start_date);
  }
  
  if (end_date) {
    sql += ' AND cr.date <= ?';
    params.push(end_date);
  }
  
  const countSql = sql.replace('SELECT cr.*, e.name as employee_name, e.employee_no, d.name as department_name, u.username as approver_name', 'SELECT COUNT(*) as total');
  const total = db.prepare(countSql).get(...params).total;
  
  sql += ' ORDER BY cr.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));
  
  const corrections = db.prepare(sql).all(...params);
  res.json({ list: corrections, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.get('/:id', auth, (req, res) => {
  const correction = db.prepare(`
    SELECT cr.*, e.name as employee_name, e.employee_no, d.name as department_name
    FROM correction_requests cr
    LEFT JOIN employees e ON cr.employee_id = e.id
    LEFT JOIN departments d ON e.department_id = d.id
    WHERE cr.id = ?
  `).get(req.params.id);
  
  if (!correction) {
    return res.status(404).json({ error: '补卡记录不存在' });
  }
  
  if (req.user.role === 'employee' && correction.employee_id !== req.user.employee_id) {
    return res.status(403).json({ error: '权限不足' });
  }
  
  res.json(correction);
});

router.post('/', auth, (req, res) => {
  if (!req.user.employee_id) {
    return res.status(400).json({ error: '未关联员工信息' });
  }
  
  const { date, type, reason } = req.body;
  
  const result = db.prepare(`
    INSERT INTO correction_requests (employee_id, date, type, reason)
    VALUES (?, ?, ?, ?)
  `).run(req.user.employee_id, date, type, reason);
  
  res.status(201).json({ id: result.lastInsertRowid, message: '补卡申请已提交' });
});

router.post('/:id/approve', auth, isAdmin, (req, res) => {
  const { status, remark } = req.body;
  
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: '无效的审批状态' });
  }
  
  const correction = db.prepare('SELECT * FROM correction_requests WHERE id = ?').get(req.params.id);
  
  if (!correction) {
    return res.status(404).json({ error: '补卡记录不存在' });
  }
  
  db.prepare(`
    UPDATE correction_requests SET 
      status = ?, approver_id = ?, approve_time = CURRENT_TIMESTAMP, approve_remark = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status, req.user.id, remark, req.params.id);
  
  if (status === 'approved') {
    const record = db.prepare('SELECT * FROM attendance_records WHERE employee_id = ? AND date = ?').get(correction.employee_id, correction.date);
    
    const now = new Date().toTimeString().split(' ')[0];
    const rule = db.prepare('SELECT * FROM attendance_rules WHERE id = 1').get();
    
    if (record) {
      if (correction.type === 'check_in' && !record.check_in_time) {
        db.prepare('UPDATE attendance_records SET check_in_time = ?, status = "normal", late_minutes = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(rule.work_start_time, record.id);
      } else if (correction.type === 'check_out' && !record.check_out_time) {
        db.prepare('UPDATE attendance_records SET check_out_time = ?, early_leave_minutes = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(rule.work_end_time, record.id);
      }
    } else {
      db.prepare('INSERT INTO attendance_records (employee_id, date, check_in_time, check_out_time, status) VALUES (?, ?, ?, ?, ?)').run(
        correction.employee_id,
        correction.date,
        correction.type === 'check_in' ? rule.work_start_time : null,
        correction.type === 'check_out' ? rule.work_end_time : null,
        'normal'
      );
    }
  }
  
  res.json({ message: status === 'approved' ? '已批准并修正考勤记录' : '已拒绝' });
});

router.delete('/:id', auth, (req, res) => {
  const correction = db.prepare('SELECT * FROM correction_requests WHERE id = ?').get(req.params.id);
  
  if (!correction) {
    return res.status(404).json({ error: '补卡记录不存在' });
  }
  
  if (req.user.role === 'employee' && correction.employee_id !== req.user.employee_id) {
    return res.status(403).json({ error: '权限不足' });
  }
  
  if (correction.status !== 'pending') {
    return res.status(400).json({ error: '只能删除待审批的申请' });
  }
  
  db.prepare('DELETE FROM correction_requests WHERE id = ?').run(req.params.id);
  res.json({ message: '补卡申请已删除' });
});

module.exports = router;
