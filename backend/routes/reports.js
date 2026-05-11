const express = require('express');
const router = express.Router();
const db = require('../database/db');
const XLSX = require('xlsx');
const { auth, isAdmin } = require('../middleware/auth');

router.get('/monthly', auth, isAdmin, (req, res) => {
  const { department_id, year, month } = req.query;
  
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
  
  let employeeSql = `
    SELECT e.id, e.name, e.employee_no, d.name as department_name
    FROM employees e
    LEFT JOIN departments d ON e.department_id = d.id
    WHERE e.status = 'active'
  `;
  const params = [];
  
  if (department_id) {
    employeeSql += ' AND e.department_id = ?';
    params.push(department_id);
  }
  
  const employees = db.prepare(employeeSql).all(...params);
  
  const reportData = employees.map(emp => {
    const records = db.prepare(`
      SELECT * FROM attendance_records 
      WHERE employee_id = ? AND date >= ? AND date <= ?
    `).all(emp.id, startDate, endDate);
    
    const leaves = db.prepare(`
      SELECT SUM(days) as total_days, leave_type
      FROM leave_requests
      WHERE employee_id = ? AND start_date >= ? AND end_date <= ? AND status = 'approved'
      GROUP BY leave_type
    `).all(emp.id, startDate, endDate);
    
    const overtimes = db.prepare(`
      SELECT SUM(hours) as total_hours
      FROM overtime_requests
      WHERE employee_id = ? AND date >= ? AND date <= ? AND status = 'approved'
    `).get(emp.id, startDate, endDate);
    
    const leaveMap = {};
    leaves.forEach(l => {
      leaveMap[l.leave_type] = l.total_days || 0;
    });
    
    return {
      '工号': emp.employee_no,
      '姓名': emp.name,
      '部门': emp.department_name || '',
      '应出勤天数': records.length,
      '正常打卡天数': records.filter(r => r.status === 'normal').length,
      '迟到次数': records.filter(r => r.status.includes('late')).length,
      '早退次数': records.filter(r => r.status.includes('early_leave')).length,
      '旷工天数': records.filter(r => r.status === 'absent').length,
      '事假天数': leaveMap['事假'] || 0,
      '病假天数': leaveMap['病假'] || 0,
      '年假天数': leaveMap['年假'] || 0,
      '其他假期': Object.entries(leaveMap).filter(([k]) => !['事假', '病假', '年假'].includes(k)).reduce((sum, [, v]) => sum + v, 0),
      '加班时长(小时)': overtimes.total_hours || 0
    };
  });
  
  const worksheet = XLSX.utils.json_to_sheet(reportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '考勤汇总');
  
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=attendance_${year}_${month}.xlsx`);
  res.send(buffer);
});

router.get('/daily', auth, isAdmin, (req, res) => {
  const { department_id, start_date, end_date } = req.query;
  
  let sql = `
    SELECT ar.date, e.employee_no, e.name, d.name as department_name,
      ar.check_in_time, ar.check_out_time, ar.status, ar.late_minutes, ar.early_leave_minutes
    FROM attendance_records ar
    LEFT JOIN employees e ON ar.employee_id = e.id
    LEFT JOIN departments d ON e.department_id = d.id
    WHERE ar.date >= ? AND ar.date <= ?
  `;
  const params = [start_date, end_date];
  
  if (department_id) {
    sql += ' AND e.department_id = ?';
    params.push(department_id);
  }
  
  sql += ' ORDER BY ar.date, e.employee_no';
  
  const records = db.prepare(sql).all(...params);
  
  const reportData = records.map(r => ({
    '日期': r.date,
    '工号': r.employee_no,
    '姓名': r.name,
    '部门': r.department_name || '',
    '签到时间': r.check_in_time || '',
    '签退时间': r.check_out_time || '',
    '状态': r.status === 'normal' ? '正常' : r.status === 'absent' ? '旷工' : r.status,
    '迟到分钟': r.late_minutes || 0,
    '早退分钟': r.early_leave_minutes || 0
  }));
  
  const worksheet = XLSX.utils.json_to_sheet(reportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '考勤明细');
  
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=attendance_detail_${start_date}_${end_date}.xlsx`);
  res.send(buffer);
});

module.exports = router;
