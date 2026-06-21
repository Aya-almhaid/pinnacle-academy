import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

export const db = new Database(process.env.DB_PATH || 'academy.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL,
    price REAL NOT NULL DEFAULT 0,
    instructor_id INTEGER REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS enrollments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL REFERENCES users(id),
    course_id INTEGER NOT NULL REFERENCES courses(id),
    enrolled_at TEXT DEFAULT (datetime('now')),
    UNIQUE(student_id, course_id)
  );
`);

const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
if (userCount === 0) {
  const insertUser = db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)');
  const adminId = insertUser.run('Admin', 'admin@pinnacle.academy', bcrypt.hashSync('admin123', 10), 'admin')
    .lastInsertRowid;
  const instructor1 = insertUser.run(
    'Sarah Chen',
    'sarah@pinnacle.academy',
    bcrypt.hashSync('instructor123', 10),
    'instructor'
  ).lastInsertRowid;
  const instructor2 = insertUser.run(
    'James Carter',
    'james@pinnacle.academy',
    bcrypt.hashSync('instructor123', 10),
    'instructor'
  ).lastInsertRowid;

  const insertCourse = db.prepare(
    'INSERT INTO courses (title, description, category, price, instructor_id) VALUES (?, ?, ?, ?, ?)'
  );
  insertCourse.run(
    'Web Development Bootcamp',
    'Learn HTML, CSS, JavaScript, and React from scratch and build real projects.',
    'Tech',
    299,
    instructor1
  );
  insertCourse.run(
    'Python for Beginners',
    'A hands-on introduction to Python programming, covering syntax, data structures, and small projects.',
    'Tech',
    199,
    instructor1
  );
  insertCourse.run(
    'English Conversation Mastery',
    'Build fluency and confidence in spoken English through guided conversation practice.',
    'Languages',
    149,
    instructor2
  );
  insertCourse.run(
    'IELTS Exam Preparation',
    'Targeted preparation covering all four IELTS sections with practice tests and feedback.',
    'Exam Prep',
    179,
    instructor2
  );
  insertCourse.run(
    'Math Tutoring (Grades 6-12)',
    'Personalized math support covering algebra, geometry, and pre-calculus fundamentals.',
    'Academic Support',
    129,
    null
  );

  console.log(`Seeded admin (id ${adminId}), 2 instructors, and 5 courses.`);
}
