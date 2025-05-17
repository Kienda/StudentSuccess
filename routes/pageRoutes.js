
// 2. routes/pageRoutes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// // Home page
// router.get('/', (req, res) => {
//   res.render('home');
// });

// Sign In
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const userQuery = await pool.query('SELECT * FROM students WHERE email = $1', [email]);
    if (userQuery.rows.length === 0) return res.send('User not found');

    const student = userQuery.rows[0];
    const valid = await bcrypt.compare(password, student.password);
    if (!valid) return res.send('Invalid password');

    req.session.student = student;


    // Get relevant guidance and recommendations
    const guidanceQuery = await pool.query(`
      SELECT * FROM guidance
      WHERE (major = $1 OR major = 'All')
      AND (status_level = $2 OR status_level = 'All')
      AND $3 BETWEEN min_gpa AND max_gpa
    `, [student.major, student.status, student.gpa]);

    const recQuery = await pool.query(`
      SELECT * FROM recommendations
      WHERE major = $1
    `, [student.major]);
    // ✅ Redirect based on role
    if (student.role === 'admin') {
      res.redirect('/admin');
    } else {
      res.render('dashboard', {
        student,
        guidance: guidanceQuery.rows,
        recommendations: recQuery.rows
      });
    }

  } catch (err) {
    res.status(500).send(err.message);
  }
});



module.exports = router;