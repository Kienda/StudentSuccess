const express = require('express');
const router = express.Router();
const db = require('../db'); // assume pg or db connection
const methodOverride = require('method-override');

router.use(methodOverride('_method'));

// INDEX
router.get('/', async (req, res) => {
  const results = await db.query('SELECT * FROM recommendations');
  res.render('recommendations/index', { recommendations: results.rows });
});

// NEW
router.get('/new', (req, res) => {
  res.render('recommendations/new');
});

// CREATE
router.post('/', async (req, res) => {
  const { title, major, type, url, description } = req.body;
  await db.query(
    'INSERT INTO recommendations (title, major, type, url, description) VALUES ($1, $2, $3, $4, $5)',
    [title, major, type, url, description]
  );
  res.redirect('/recommendations');
});

// EDIT
router.get('/:id/edit', async (req, res) => {
  const { id } = req.params;
  const result = await db.query('SELECT * FROM recommendations WHERE id = $1', [id]);
  res.render('recommendations/edit', { recommendation: result.rows[0] });
});

// UPDATE
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { title, major, type, url, description } = req.body;
  await db.query(
    'UPDATE recommendations SET title=$1, major=$2, type=$3, url=$4, description=$5 WHERE id=$6',
    [title, major, type, url, description, id]
  );
  res.redirect('/recommendations');
});

// DELETE
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  await db.query('DELETE FROM recommendations WHERE id=$1', [id]);
  res.redirect('/recommendations');
});

module.exports = router;
