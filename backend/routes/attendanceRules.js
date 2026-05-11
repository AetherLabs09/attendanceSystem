const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { auth, isAdmin } = require('../middleware/auth');

router.get('/', auth, (req, res) => {
  const rules = db.prepare('SELECT * FROM attendance_rules ORDER BY id').all();
  res.json(rules);
});

router.get('/:id', auth, (req, res) => {
  const rule = db.prepare('SELECT * FROM attendance_rules WHERE id = ?').get(req.params.id);
  
  if (!rule) {
    return res.status(404).json({ error: '规则不存在' });
  }
  
  res.json(rule);
});

router.post('/', auth, isAdmin, (req, res) => {
  const {
    name, work_start_time, work_end_time, late_threshold, early_leave_threshold,
    absent_threshold, overtime_start_time, monthly_cycle_start,
    annual_leave_days, sick_leave_days
  } = req.body;
  
  const result = db.prepare(`
    INSERT INTO attendance_rules (
      name, work_start_time, work_end_time, late_threshold, early_leave_threshold,
      absent_threshold, overtime_start_time, monthly_cycle_start,
      annual_leave_days, sick_leave_days
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    name, work_start_time, work_end_time, late_threshold, early_leave_threshold,
    absent_threshold, overtime_start_time, monthly_cycle_start,
    annual_leave_days, sick_leave_days
  );
  
  res.status(201).json({ id: result.lastInsertRowid, message: '规则创建成功' });
});

router.put('/:id', auth, isAdmin, (req, res) => {
  const {
    name, work_start_time, work_end_time, late_threshold, early_leave_threshold,
    absent_threshold, overtime_start_time, monthly_cycle_start,
    annual_leave_days, sick_leave_days
  } = req.body;
  
  db.prepare(`
    UPDATE attendance_rules SET
      name = ?, work_start_time = ?, work_end_time = ?, late_threshold = ?,
      early_leave_threshold = ?, absent_threshold = ?, overtime_start_time = ?,
      monthly_cycle_start = ?, annual_leave_days = ?, sick_leave_days = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    name, work_start_time, work_end_time, late_threshold, early_leave_threshold,
    absent_threshold, overtime_start_time, monthly_cycle_start,
    annual_leave_days, sick_leave_days, req.params.id
  );
  
  res.json({ message: '规则更新成功' });
});

router.delete('/:id', auth, isAdmin, (req, res) => {
  const count = db.prepare('SELECT COUNT(*) as count FROM attendance_rules').get().count;
  
  if (count <= 1) {
    return res.status(400).json({ error: '至少保留一条考勤规则' });
  }
  
  db.prepare('DELETE FROM attendance_rules WHERE id = ?').run(req.params.id);
  res.json({ message: '规则删除成功' });
});

module.exports = router;
