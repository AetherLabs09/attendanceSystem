const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { auth, isAdmin } = require('../middleware/auth');

router.post('/check-in', auth, (req, res) => {
  if (!req.user.employee_id) {
    return res.status(400).json({ error: '未关联员工信息' });
  }
  
  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toTimeString().split(' ')[0];
  const { location } = req.body;
  
  const existing = db.prepare('SELECT * FROM attendance_records WHERE employee_id = ? AND date = ?').get(req.user.employee_id, today);
  
  if (existing && existing.check_in_time) {
    return res.status(400).json({ error: '今日已打卡' });
  }
  
  const rule = db.prepare('SELECT * FROM attendance_rules WHERE id = 1').get();
  let status = 'normal';
  let lateMinutes = 0;
  
  const workStartTime = rule.work_start_time.split(':');
  const checkInTime = now.split(':');
  const workStartMinutes = parseInt(workStartTime[0]) * 60 + parseInt(workStartTime[1]);
  const checkInMinutes = parseInt(checkInTime[0]) * 60 + parseInt(checkInTime[1]);
  
  if (checkInMinutes > workStartMinutes) {
    lateMinutes = checkInMinutes - workStartMinutes;
    if (lateMinutes >= rule.absent_threshold) {
      status = 'absent';
    } else if (lateMinutes >= rule.late_threshold) {
      status = 'late';
    }
  }
  
  if (existing) {
    db.prepare(`
      UPDATE attendance_records SET 
        check_in_time = ?, check_in_location = ?, status = ?, late_minutes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(now, location, status, lateMinutes, existing.id);
  } else {
    db.prepare(`
      INSERT INTO attendance_records (employee_id, date, check_in_time, check_in_location, status, late_minutes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(req.user.employee_id, today, now, location, status, lateMinutes);
  }
  
  res.json({ message: '打卡成功', check_in_time: now, status, late_minutes: lateMinutes });
});

router.post('/check-out', auth, (req, res) => {
  if (!req.user.employee_id) {
    return res.status(400).json({ error: '未关联员工信息' });
  }
  
  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toTimeString().split(' ')[0];
  const { location } = req.body;
  
  const existing = db.prepare('SELECT * FROM attendance_records WHERE employee_id = ? AND date = ?').get(req.user.employee_id, today);
  
  if (!existing) {
    return res.status(400).json({ error: '请先签到' });
  }
  
  if (existing.check_out_time) {
    return res.status(400).json({ error: '今日已签退' });
  }
  
  const rule = db.prepare('SELECT * FROM attendance_rules WHERE id = 1').get();
  let earlyLeaveMinutes = 0;
  
  const workEndTime = rule.work_end_time.split(':');
  const checkOutTime = now.split(':');
  const workEndMinutes = parseInt(workEndTime[0]) * 60 + parseInt(workEndTime[1]);
  const checkOutMinutes = parseInt(checkOutTime[0]) * 60 + parseInt(checkOutTime[1]);
  
  let status = existing.status;
  if (checkOutMinutes < workEndMinutes) {
    earlyLeaveMinutes = workEndMinutes - checkOutMinutes;
    if (earlyLeaveMinutes >= rule.early_leave_threshold) {
      status = status === 'normal' ? 'early_leave' : status + '_early_leave';
    }
  }
  
  db.prepare(`
    UPDATE attendance_records SET 
      check_out_time = ?, check_out_location = ?, status = ?, early_leave_minutes = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(now, location, status, earlyLeaveMinutes, existing.id);
  
  res.json({ message: '签退成功', check_out_time: now, status });
});

router.get('/today', auth, (req, res) => {
  if (!req.user.employee_id) {
    return res.json(null);
  }
  
  const today = new Date().toISOString().split('T')[0];
  const record = db.prepare('SELECT * FROM attendance_records WHERE employee_id = ? AND date = ?').get(req.user.employee_id, today);
  
  res.json(record);
});

router.get('/records', auth, (req, res) => {
  const { employee_id, department_id, start_date, end_date, status, page = 1, pageSize = 20 } = req.query;
  
  let sql = `
    SELECT ar.*, e.name as employee_name, e.employee_no, d.name as department_name
    FROM attendance_records ar
    LEFT JOIN employees e ON ar.employee_id = e.id
    LEFT JOIN departments d ON e.department_id = d.id
    WHERE 1=1
  `;
  const params = [];
  
  if (req.user.role === 'employee') {
    sql += ' AND ar.employee_id = ?';
    params.push(req.user.employee_id);
  } else {
    if (employee_id) {
      sql += ' AND ar.employee_id = ?';
      params.push(employee_id);
    }
    if (department_id) {
      sql += ' AND e.department_id = ?';
      params.push(department_id);
    }
  }
  
  if (start_date) {
    sql += ' AND ar.date >= ?';
    params.push(start_date);
  }
  
  if (end_date) {
    sql += ' AND ar.date <= ?';
    params.push(end_date);
  }
  
  if (status) {
    sql += ' AND ar.status LIKE ?';
    params.push(`%${status}%`);
  }
  
  const countSql = sql.replace('SELECT ar.*, e.name as employee_name, e.employee_no, d.name as department_name', 'SELECT COUNT(*) as total');
  const total = db.prepare(countSql).get(...params).total;
  
  sql += ' ORDER BY ar.date DESC, ar.id DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));
  
  const records = db.prepare(sql).all(...params);
  res.json({ list: records, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.get('/abnormal', auth, isAdmin, (req, res) => {
  const { date, type } = req.query;
  
  let sql = `
    SELECT ar.*, e.name as employee_name, e.employee_no, d.name as department_name
    FROM attendance_records ar
    LEFT JOIN employees e ON ar.employee_id = e.id
    LEFT JOIN departments d ON e.department_id = d.id
    WHERE ar.status != 'normal'
  `;
  const params = [];
  
  if (date) {
    sql += ' AND ar.date = ?';
    params.push(date);
  }
  
  if (type) {
    sql += ' AND ar.status LIKE ?';
    params.push(`%${type}%`);
  }
  
  sql += ' ORDER BY ar.date DESC';
  
  const records = db.prepare(sql).all(...params);
  res.json(records);
});

router.get('/monthly-summary', auth, (req, res) => {
  const { employee_id, year, month } = req.query;
  
  const targetEmployeeId = req.user.role === 'employee' ? req.user.employee_id : employee_id;
  
  if (!targetEmployeeId) {
    return res.status(400).json({ error: '请指定员工' });
  }
  
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
  
  const records = db.prepare(`
    SELECT * FROM attendance_records 
    WHERE employee_id = ? AND date >= ? AND date <= ?
    ORDER BY date
  `).all(targetEmployeeId, startDate, endDate);
  
  const leaves = db.prepare(`
    SELECT SUM(days) as total_days, leave_type
    FROM leave_requests
    WHERE employee_id = ? AND start_date >= ? AND end_date <= ? AND status = 'approved'
    GROUP BY leave_type
  `).all(targetEmployeeId, startDate, endDate);
  
  const overtimes = db.prepare(`
    SELECT SUM(hours) as total_hours
    FROM overtime_requests
    WHERE employee_id = ? AND date >= ? AND date <= ? AND status = 'approved'
  `).get(targetEmployeeId, startDate, endDate);
  
  const summary = {
    total_days: records.length,
    late_count: records.filter(r => r.status.includes('late')).length,
    early_leave_count: records.filter(r => r.status.includes('early_leave')).length,
    absent_count: records.filter(r => r.status === 'absent').length,
    normal_count: records.filter(r => r.status === 'normal').length,
    leave_days: leaves.reduce((sum, l) => sum + (l.total_days || 0), 0),
    leave_details: leaves,
    overtime_hours: overtimes.total_hours || 0,
    records
  };
  
  res.json(summary);
});

module.exports = router;
