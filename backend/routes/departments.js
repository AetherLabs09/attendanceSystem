const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { auth, isAdmin } = require('../middleware/auth');

router.get('/', auth, (req, res) => {
  const departments = db.prepare(`
    SELECT d.*, 
      (SELECT COUNT(*) FROM employees WHERE department_id = d.id) as employee_count,
      pd.name as parent_name
    FROM departments d
    LEFT JOIN departments pd ON d.parent_id = pd.id
    ORDER BY d.level, d.id
  `).all();
  res.json(departments);
});

router.get('/:id', auth, (req, res) => {
  const department = db.prepare(`
    SELECT d.*, pd.name as parent_name
    FROM departments d
    LEFT JOIN departments pd ON d.parent_id = pd.id
    WHERE d.id = ?
  `).get(req.params.id);
  
  if (!department) {
    return res.status(404).json({ error: '部门不存在' });
  }
  
  res.json(department);
});

router.post('/', auth, isAdmin, (req, res) => {
  const { name, parent_id, level } = req.body;
  
  const result = db.prepare(
    'INSERT INTO departments (name, parent_id, level) VALUES (?, ?, ?)'
  ).run(name, parent_id || null, level || 1);
  
  res.status(201).json({ id: result.lastInsertRowid, message: '部门创建成功' });
});

router.put('/:id', auth, isAdmin, (req, res) => {
  const { name, parent_id, level } = req.body;
  
  db.prepare(
    'UPDATE departments SET name = ?, parent_id = ?, level = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).run(name, parent_id || null, level || 1, req.params.id);
  
  res.json({ message: '部门更新成功' });
});

router.delete('/:id', auth, isAdmin, (req, res) => {
  const employees = db.prepare('SELECT COUNT(*) as count FROM employees WHERE department_id = ?').get(req.params.id);
  
  if (employees.count > 0) {
    return res.status(400).json({ error: '该部门下还有员工，无法删除' });
  }
  
  const children = db.prepare('SELECT COUNT(*) as count FROM departments WHERE parent_id = ?').get(req.params.id);
  if (children.count > 0) {
    return res.status(400).json({ error: '该部门下还有子部门，无法删除' });
  }
  
  db.prepare('DELETE FROM departments WHERE id = ?').run(req.params.id);
  res.json({ message: '部门删除成功' });
});

router.get('/tree/list', auth, (req, res) => {
  const departments = db.prepare('SELECT * FROM departments ORDER BY level, id').all();
  
  const buildTree = (items, parentId = null) => {
    return items
      .filter(item => item.parent_id === parentId)
      .map(item => ({
        ...item,
        children: buildTree(items, item.id)
      }));
  };
  
  res.json(buildTree(departments));
});

module.exports = router;
