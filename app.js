// app.js 
const express = require('express');
const path = require('path');
const { engine } = require('express-handlebars');
const session = require('express-session');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const methodOverride = require('method-override');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const recommendationsRoutes = require('./routes/recommendations');
const guidanceRoutes = require('./routes/guidance');

const app = express();
const PORT = 1800;

// MIDDLEWARE SETUP (CRITICAL ORDER)
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.json());
app.use(express.static('public'));
app.use('/recommendations', recommendationsRoutes);
app.use('/guidance', guidanceRoutes);

// app.use('/', pageRoutes);
// Session
app.use(session({
  secret: process.env.SESSION_SECRET || 'supersecretkey',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, httpOnly: true }
}));

require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD.toString(),
  port: process.env.DB_PORT,
});

// Test the database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('DB connection error:', err);

  } else {
    console.log('DB connected at:', res.rows[0].now);
  }
});


// ======= VIEW ENGINE (Handlebars) ==========
app.engine('hbs', engine({
  extname: '.hbs',
  defaultLayout: 'main',
  layoutsDir: './views/layouts',
  partialsDir: './views/partials',
  helpers: {
    eq: (a, b) => a === b
  }
}));

app.set('view engine', 'hbs');
app.set('views', './views');


// Middleware
function requireAuth(req, res, next) {
  const token = req.cookies.token;

  if (!token) {
    const redirectUrl = encodeURIComponent(req.originalUrl);
    return res.redirect(`/account/login-page?redirect=${redirectUrl}`);
  }

  try {
    const decoded = jwt.verify(token, process.env.SERVER_SECRET || 'supersecretkey');
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Invalid token:', err);
    return res.redirect(`/account/login-page?redirect=${encodeURIComponent(req.originalUrl)}`);
  }
}

// ======= ROUTES ==========

// Homepage
app.get('/', (req, res) => {
  res.render('home', { title: 'Student Success' });
});

// Show form to add student
app.get('/students/new', (req, res) => {
  res.render('new-student');
});

app.get('/login', (req, res) => {
  res.render('login', { title: 'Login' });
});

// Login Page
app.post('/login', async (req, res) => {
  console.log("Hit login post");
  const { email, password } = req.body;
  console.log("Email: " + email);
  try {
    console.log("hit try");
    const result = await pool.query('SELECT * FROM students WHERE email = $1', [email]);
    console.log("Result: " + result);
    const student = result.rows[0];

    console.log("result: " + student);

    if (!student) {
      console.log("Not student");
      return res.status(401).render('login', { error: 'Invalid email' });
    }
    console.log("Hit before Match");
    const match = await bcrypt.compare(password, student.password);
    console.log("Hit After match");
    if (!match) {
      console.log("HIT NOT MATCH");
      return res.status(401).render('login', { error: 'Invalid password' });
    }

    req.session.student = {
      id: student.id,
      email: student.email,
      name: student.name,
      role: student.role
    };

    // ✅ Redirect based on role
    if (student.role === 'admin') {
      res.redirect('/admin');
    } else {
      res.redirect('/dashboard');
    }

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).render('login', { error: 'An error occurred during login' });
  }
});


// Student Creation (should be separate from login)
app.post('/students', requireAuth, async (req, res) => {
  const { name, email, student_id, major, status, gpa, semester, password } = req.body;

  if (!name || !email || !student_id || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO students (name, email, student_id, major, status, gpa, semester, password, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       RETURNING *`,
      [name, email, student_id, major, status, gpa, semester, hashedPassword]
    );
    res.redirect('/students');
  } catch (error) {
    console.error('Insert Error:', error);
    res.status(500).send(error.message);
  }
});

// Student List (should be separate)
app.get('/students', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM students ORDER BY name');
    res.render('students', { students: result.rows });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Dashboard
app.get('/dashboard', async (req, res) => {
  if (!req.session.student) {
    return res.redirect('/login');
  }

  try {
    const studentResult = await pool.query(
      'SELECT * FROM students WHERE id = $1',
      [req.session.student.id]
    );
    const student = studentResult.rows[0];

    // Get relevant guidance
    const guidanceResult = await pool.query(
      `SELECT * FROM guidance
       WHERE (major = $1 OR major = 'All')
       AND (status_level = $2 OR status_level = 'All')
       AND $3 BETWEEN min_gpa AND max_gpa`,
      [student.major, student.status, student.gpa]
    );

    // Get relevant recommendations
    const recResult = await pool.query(
      `SELECT * FROM recommendations WHERE major = $1`,
      [student.major]
    );

    res.render('dashboard', {
      student: {
        name: student.name,
        email: student.email
      },
      guidance: guidanceResult.rows,
      recommendations: recResult.rows
    });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// DELETE Student Route
app.delete('/students/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`DELETE request for student ID: ${id}`);

    // Verify student exists
    const studentExists = await pool.query('SELECT id FROM students WHERE id = $1', [id]);
    if (studentExists.rows.length === 0) {
      return res.status(404).send('Student not found');
    }

    // Perform deletion
    const result = await pool.query('DELETE FROM students WHERE id = $1 RETURNING *', [id]);

    if (result.rowCount === 1) {
      console.log(`Successfully deleted student with ID: ${id}`);
      return res.redirect('/students');
    }
    return res.status(404).send('Student not found');
  } catch (error) {
    console.error('DELETE Error:', error);
    return res.status(500).send('Server error during deletion');
  }
});

app.get('/students/:id/edit', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Fetching student with ID: ${id}`);

    const result = await pool.query('SELECT * FROM students WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      console.log(`Student ${id} not found`);
      return res.status(404).send('Student not found');
    }

    console.log(`Rendering edit form for student ${id}`);
    res.render('edit-student', {
      student: result.rows[0],
      title: 'Edit Student'
    });
  } catch (error) {
    console.error('Edit Form Error:', error);
    res.status(500).send(error.message);
  }
});

app.put('/students/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, student_id, major, status, gpa, semester } = req.body;

    console.log(`Updating student with ID: ${id}`);

    const result = await pool.query(
      `UPDATE students
       SET name = $1,
           email = $2,
           student_id = $3,
           major = $4,
           status = $5,
           gpa = $6,
           semester = $7
       WHERE id = $8
       RETURNING *`,
      [name, email, student_id, major, status, gpa, semester, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).send('Student not found');
    }

    console.log(`Student ${id} updated successfully`);
    res.redirect('/students');
  } catch (error) {
    console.error('Update Error:', error);
    res.status(500).send(error.message);
  }
});

function requireAdmin(req, res, next) {
  if (req.session.student && req.session.student.role === 'admin') {
    return next();
  }
  return res.status(403).render('error', { message: 'Access denied. Admins only.' });
}


// Admin-only routes

app.get('/admin', requireAdmin, (req, res) => {
  res.render('admin', {
    title: 'Admin Dashboard',
    student: req.session.student  // optionally used for greeting/admin info
  });
});

app.get('/students', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM students ORDER BY name');
    res.render('students', { students: result.rows });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.get('/recommendPages', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM recommendations');
    res.render('recommendPages', { recommendations: result.rows });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.get('/guidePage', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM guidance');
    res.render('guidePage', { guidance: result.rows });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

//guidance route
app.get('/guidePages', async (req, res) => {
  const { major, status, gpa } = req.query;

  try {
    const result = await pool.query(
      `SELECT * FROM guidance
      WHERE major IN ($1, 'All') 
      AND status_level IN ($2, 'All')
      AND $3 BETWEEN min_gpa AND max_gpa`,
      [major, status, gpa]
    );

    res.render('guidePages', { guidance: result.rows });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

//recommendations route
app.get('/recommendPage', async (req, res) => {
  const { major } = req.query;

  try {
    const result = await pool.query(
      `SELECT * FROM recommendations WHERE major = $1`,
      [major]
    );

    res.render('recommendPage', { recommendations: result.rows });
  } catch (error) {
    res.status(500).send(error.message);
  }
});


// Logout
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});
// ======= SERVER ==========
app.listen(PORT, () => {
  console.log(`The server of the final project is running on http://localhost:${PORT}`);
});
