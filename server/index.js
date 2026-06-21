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

function sectionsForCourse(courseId) {
  return db
    .prepare(
      `SELECT sections.*, users.name as instructor_name,
        (SELECT COUNT(*) FROM enrollments WHERE enrollments.section_id = sections.id) as enrolled_count
       FROM sections LEFT JOIN users ON sections.instructor_id = users.id
       WHERE sections.course_id = ? ORDER BY sections.id`
    )
    .all(courseId);
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
        (SELECT COUNT(*) FROM enrollments
          JOIN sections ON enrollments.section_id = sections.id
          WHERE sections.course_id = courses.id) as enrolled_count
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

  res.json({ ...course, sections: sectionsForCourse(course.id) });
});

// --- Courses (admin write) ---
app.post('/api/courses', requireAuth, requireRole('admin'), (req, res) => {
  const { title, description, category, price, duration, level, syllabus, instructor_id } = req.body;
  if (!title || !category) return res.status(400).json({ message: 'title and category are required' });

  const { lastInsertRowid } = db
    .prepare(
      'INSERT INTO courses (title, description, category, price, duration, level, syllabus, instructor_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    )
    .run(
      title,
      description || '',
      category,
      price || 0,
      duration || '',
      level || 'All Levels',
      Array.isArray(syllabus) ? syllabus.join(',') : syllabus || '',
      instructor_id || null
    );

  res.status(201).json(db.prepare('SELECT * FROM courses WHERE id = ?').get(lastInsertRowid));
});

app.patch('/api/courses/:id', requireAuth, requireRole('admin'), (req, res) => {
  const existing = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ message: 'Course not found' });

  const { title, description, category, price, duration, level, syllabus, instructor_id } = req.body;
  const syllabusStr = Array.isArray(syllabus) ? syllabus.join(',') : syllabus;

  db.prepare(
    'UPDATE courses SET title = ?, description = ?, category = ?, price = ?, duration = ?, level = ?, syllabus = ?, instructor_id = ? WHERE id = ?'
  ).run(
    title ?? existing.title,
    description ?? existing.description,
    category ?? existing.category,
    price ?? existing.price,
    duration ?? existing.duration,
    level ?? existing.level,
    syllabusStr ?? existing.syllabus,
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

// --- Sections (admin write) ---
app.post('/api/admin/sections', requireAuth, requireRole('admin'), (req, res) => {
  const { course_id, name, instructor_id, schedule } = req.body;
  if (!course_id || !name) return res.status(400).json({ message: 'course_id and name are required' });

  const course = db.prepare('SELECT id FROM courses WHERE id = ?').get(course_id);
  if (!course) return res.status(404).json({ message: 'Course not found' });

  const { lastInsertRowid } = db
    .prepare('INSERT INTO sections (course_id, name, instructor_id, schedule) VALUES (?, ?, ?, ?)')
    .run(course_id, name, instructor_id || null, schedule || '');

  res.status(201).json(db.prepare('SELECT * FROM sections WHERE id = ?').get(lastInsertRowid));
});

app.patch('/api/admin/sections/:id', requireAuth, requireRole('admin'), (req, res) => {
  const existing = db.prepare('SELECT * FROM sections WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ message: 'Section not found' });

  const { name, instructor_id, schedule } = req.body;
  db.prepare('UPDATE sections SET name = ?, instructor_id = ?, schedule = ? WHERE id = ?').run(
    name ?? existing.name,
    instructor_id ?? existing.instructor_id,
    schedule ?? existing.schedule,
    req.params.id
  );

  res.json(db.prepare('SELECT * FROM sections WHERE id = ?').get(req.params.id));
});

app.delete('/api/admin/sections/:id', requireAuth, requireRole('admin'), (req, res) => {
  const result = db.prepare('DELETE FROM sections WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ message: 'Section not found' });
  res.status(204).end();
});

// --- Instructors (public read) ---
app.get('/api/instructors', (req, res) => {
  const instructors = db.prepare("SELECT id, name, bio FROM users WHERE role = 'instructor' ORDER BY name").all();
  const withSections = instructors.map((instructor) => ({
    ...instructor,
    sections: db
      .prepare(
        `SELECT sections.id, sections.name, sections.schedule, courses.id as course_id, courses.title as course_title
         FROM sections JOIN courses ON sections.course_id = courses.id
         WHERE sections.instructor_id = ? ORDER BY courses.title`
      )
      .all(instructor.id),
  }));
  res.json(withSections);
});

// --- Enrollments (student) ---
app.post('/api/enrollments', requireAuth, requireRole('student'), (req, res) => {
  const { section_id } = req.body;
  const section = db.prepare('SELECT id FROM sections WHERE id = ?').get(section_id);
  if (!section) return res.status(404).json({ message: 'Section not found' });

  const existing = db
    .prepare('SELECT id FROM enrollments WHERE student_id = ? AND section_id = ?')
    .get(req.userId, section_id);
  if (existing) return res.status(409).json({ message: 'Already enrolled in this section' });

  db.prepare('INSERT INTO enrollments (student_id, section_id) VALUES (?, ?)').run(req.userId, section_id);
  res.status(201).json({ message: 'Enrolled successfully' });
});

app.get('/api/enrollments/me', requireAuth, requireRole('student'), (req, res) => {
  const enrollments = db
    .prepare(
      `SELECT courses.id as course_id, courses.title, courses.category, courses.description,
        sections.id as section_id, sections.name as section_name, sections.schedule,
        users.name as instructor_name, enrollments.enrolled_at
       FROM enrollments
       JOIN sections ON enrollments.section_id = sections.id
       JOIN courses ON sections.course_id = courses.id
       LEFT JOIN users ON sections.instructor_id = users.id
       WHERE enrollments.student_id = ?
       ORDER BY enrollments.enrolled_at DESC`
    )
    .all(req.userId);
  res.json(enrollments);
});

// --- Instructor ---
app.get('/api/instructor/sections', requireAuth, requireRole('instructor'), (req, res) => {
  const sections = db
    .prepare(
      `SELECT sections.*, courses.title as course_title,
        (SELECT COUNT(*) FROM enrollments WHERE enrollments.section_id = sections.id) as enrolled_count
       FROM sections JOIN courses ON sections.course_id = courses.id
       WHERE sections.instructor_id = ? ORDER BY sections.created_at DESC`
    )
    .all(req.userId);
  res.json(sections);
});

app.get('/api/instructor/sections/:id/students', requireAuth, requireRole('instructor'), (req, res) => {
  const section = db
    .prepare('SELECT * FROM sections WHERE id = ? AND instructor_id = ?')
    .get(req.params.id, req.userId);
  if (!section) return res.status(404).json({ message: 'Section not found' });

  const students = db
    .prepare(
      `SELECT users.id, users.name, users.email, enrollments.enrolled_at
       FROM enrollments JOIN users ON enrollments.student_id = users.id
       WHERE enrollments.section_id = ? ORDER BY enrollments.enrolled_at DESC`
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

app.get('/api/admin/sections', requireAuth, requireRole('admin'), (req, res) => {
  const { course_id } = req.query;
  const sections = course_id
    ? sectionsForCourse(course_id)
    : db
        .prepare(
          `SELECT sections.*, courses.title as course_title, users.name as instructor_name
           FROM sections
           JOIN courses ON sections.course_id = courses.id
           LEFT JOIN users ON sections.instructor_id = users.id
           ORDER BY courses.title, sections.name`
        )
        .all();
  res.json(sections);
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
