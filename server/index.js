import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from './db.js';
import { requireAuth, requireRole } from './auth.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

function signToken(user) {
  return jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// --- Auth ---
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'All fields are required' });

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ message: 'Email already registered' });

  const passwordHash = await bcrypt.hash(password, 10);
  const { lastInsertRowid } = db
    .prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)')
    .run(name, email, passwordHash, 'student');

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(lastInsertRowid);
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  res.json({ token: signToken(user), user: publicUser(user) });
});

// --- Courses (public read) ---
app.get('/api/courses', (req, res) => {
  const { category } = req.query;
  let courses = db
    .prepare(
      `SELECT courses.*, users.name as instructor_name,
        (SELECT COUNT(*) FROM enrollments WHERE enrollments.course_id = courses.id) as enrolled_count
       FROM courses LEFT JOIN users ON courses.instructor_id = users.id
       ORDER BY courses.created_at DESC`
    )
    .all();

  if (category) courses = courses.filter((c) => c.category === category);
  res.json(courses);
});

app.get('/api/courses/:id', (req, res) => {
  const course = db
    .prepare(
      `SELECT courses.*, users.name as instructor_name
       FROM courses LEFT JOIN users ON courses.instructor_id = users.id
       WHERE courses.id = ?`
    )
    .get(req.params.id);
  if (!course) return res.status(404).json({ message: 'Course not found' });
  res.json(course);
});

// --- Courses (admin write) ---
app.post('/api/courses', requireAuth, requireRole('admin'), (req, res) => {
  const { title, description, category, price, instructor_id } = req.body;
  if (!title || !category) return res.status(400).json({ message: 'title and category are required' });

  const { lastInsertRowid } = db
    .prepare('INSERT INTO courses (title, description, category, price, instructor_id) VALUES (?, ?, ?, ?, ?)')
    .run(title, description || '', category, price || 0, instructor_id || null);

  res.status(201).json(db.prepare('SELECT * FROM courses WHERE id = ?').get(lastInsertRowid));
});

app.patch('/api/courses/:id', requireAuth, requireRole('admin'), (req, res) => {
  const existing = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ message: 'Course not found' });

  const { title, description, category, price, instructor_id } = req.body;
  db.prepare('UPDATE courses SET title = ?, description = ?, category = ?, price = ?, instructor_id = ? WHERE id = ?').run(
    title ?? existing.title,
    description ?? existing.description,
    category ?? existing.category,
    price ?? existing.price,
    instructor_id ?? existing.instructor_id,
    req.params.id
  );

  res.json(db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id));
});

app.delete('/api/courses/:id', requireAuth, requireRole('admin'), (req, res) => {
  const result = db.prepare('DELETE FROM courses WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ message: 'Course not found' });
  res.status(204).end();
});

// --- Enrollments (student) ---
app.post('/api/enrollments', requireAuth, requireRole('student'), (req, res) => {
  const { course_id } = req.body;
  const course = db.prepare('SELECT id FROM courses WHERE id = ?').get(course_id);
  if (!course) return res.status(404).json({ message: 'Course not found' });

  const existing = db
    .prepare('SELECT id FROM enrollments WHERE student_id = ? AND course_id = ?')
    .get(req.userId, course_id);
  if (existing) return res.status(409).json({ message: 'Already enrolled in this course' });

  db.prepare('INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)').run(req.userId, course_id);
  res.status(201).json({ message: 'Enrolled successfully' });
});

app.get('/api/enrollments/me', requireAuth, requireRole('student'), (req, res) => {
  const enrollments = db
    .prepare(
      `SELECT courses.*, users.name as instructor_name, enrollments.enrolled_at
       FROM enrollments
       JOIN courses ON enrollments.course_id = courses.id
       LEFT JOIN users ON courses.instructor_id = users.id
       WHERE enrollments.student_id = ?
       ORDER BY enrollments.enrolled_at DESC`
    )
    .all(req.userId);
  res.json(enrollments);
});

// --- Instructor ---
app.get('/api/instructor/courses', requireAuth, requireRole('instructor'), (req, res) => {
  const courses = db
    .prepare(
      `SELECT courses.*, (SELECT COUNT(*) FROM enrollments WHERE enrollments.course_id = courses.id) as enrolled_count
       FROM courses WHERE instructor_id = ? ORDER BY created_at DESC`
    )
    .all(req.userId);
  res.json(courses);
});

app.get('/api/instructor/courses/:id/students', requireAuth, requireRole('instructor'), (req, res) => {
  const course = db.prepare('SELECT * FROM courses WHERE id = ? AND instructor_id = ?').get(req.params.id, req.userId);
  if (!course) return res.status(404).json({ message: 'Course not found' });

  const students = db
    .prepare(
      `SELECT users.id, users.name, users.email, enrollments.enrolled_at
       FROM enrollments JOIN users ON enrollments.student_id = users.id
       WHERE enrollments.course_id = ? ORDER BY enrollments.enrolled_at DESC`
    )
    .all(req.params.id);
  res.json(students);
});

// --- Admin ---
app.get('/api/admin/users', requireAuth, requireRole('admin'), (req, res) => {
  const users = db.prepare('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC').all();
  res.json(users);
});

app.get('/api/admin/instructors', requireAuth, requireRole('admin'), (req, res) => {
  const instructors = db.prepare("SELECT id, name, email FROM users WHERE role = 'instructor'").all();
  res.json(instructors);
});

app.patch('/api/admin/users/:id/role', requireAuth, requireRole('admin'), (req, res) => {
  const { role } = req.body;
  if (!['student', 'instructor', 'admin'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }
  const result = db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, req.params.id);
  if (result.changes === 0) return res.status(404).json({ message: 'User not found' });
  res.json(db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(req.params.id));
});

const PORT = process.env.PORT || 5005;
app.listen(PORT, () => console.log(`Pinnacle Academy server running on port ${PORT}`));
