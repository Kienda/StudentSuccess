const express = require('express');
const router = express.Router();
const db = require('../db'); // assume pg or db connection
const methodOverride = require('method-override');

router.use(methodOverride('_method'));

// INDEX
router.get('/', async (req, res) => {
  const results = await db.query('SELECT * FROM guidance');
  res.render('guidance/index', { guidance: results.rows });
});

// NEW
router.get('/new', (req, res) => {
  res.render('guidance/new');
});

// CREATE
router.post('/', async (req, res) => {
  const { min_gpa, max_gpa, status_level, major, content } = req.body;
  await db.query(
    'INSERT INTO guidance (min_gpa, max_gpa, status_level, major, content) VALUES ($1, $2, $3, $4, $5)',
    [min_gpa, max_gpa, status_level, major, content]
  );
  res.redirect('/guidance');
});

// EDIT
router.get('/:id/edit', async (req, res) => {
  const { id } = req.params;
  const result = await db.query('SELECT * FROM guidance WHERE id = $1', [id]);
  res.render('guidance/edit', { guidance: result.rows[0] });
});

// UPDATE
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { min_gpa, max_gpa, status_level, major, content } = req.body;
  await db.query(
    'UPDATE guidance SET min_gpa=$1, max_gpa=$2, status_level=$3, major=$4, content=$5 WHERE id=$6',
    [min_gpa, max_gpa, status_level, major, content, id]
  );
  res.redirect('/guidance');
});

// DELETE
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  await db.query('DELETE FROM guidance WHERE id=$1', [id]);
  res.redirect('/guidance');
});

module.exports = router;
