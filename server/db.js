import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

export const db = new Database(process.env.DB_PATH || 'academy.db');

const SEED_COURSES = [
  {
    title: 'Web Development Bootcamp',
    description: 'Learn HTML, CSS, JavaScript, and React from scratch and build real projects.',
    category: 'Tech',
    price: 299,
    duration: '8 weeks',
    level: 'Beginner',
    syllabus: 'HTML & CSS Fundamentals,JavaScript Essentials,React Basics,Building Your First Project,APIs & Deployment',
  },
  {
    title: 'Python for Beginners',
    description: 'A hands-on introduction to Python programming, covering syntax, data structures, and small projects.',
    category: 'Tech',
    price: 199,
    duration: '6 weeks',
    level: 'Beginner',
    syllabus: 'Python Syntax & Variables,Control Flow,Functions & Modules,Data Structures,Mini Project',
  },
  {
    title: 'English Conversation Mastery',
    description: 'Build fluency and confidence in spoken English through guided conversation practice.',
    category: 'Languages',
    price: 149,
    duration: '4 weeks',
    level: 'All Levels',
    syllabus: 'Everyday Conversation,Pronunciation Practice,Listening Skills,Real-World Role Play',
  },
  {
    title: 'IELTS Exam Preparation',
    description: 'Targeted preparation covering all four IELTS sections with practice tests and feedback.',
    category: 'Exam Prep',
    price: 179,
    duration: '6 weeks',
    level: 'Intermediate',
    syllabus: 'Listening Strategies,Reading Techniques,Writing Task 1 & 2,Speaking Practice,Full Mock Tests',
  },
  {
    title: 'Math Tutoring (Grades 6-12)',
    description: 'Personalized math support covering algebra, geometry, and pre-calculus fundamentals.',
    category: 'Academic Support',
    price: 129,
    duration: 'Ongoing',
    level: 'All Levels',
    syllabus: 'Algebra Foundations,Geometry,Pre-Calculus,Problem Solving Strategies',
  },
];

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
    duration TEXT NOT NULL DEFAULT '',
    level TEXT NOT NULL DEFAULT 'All Levels',
    syllabus TEXT NOT NULL DEFAULT '',
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

// Backfill columns for databases created before duration/level/syllabus existed
for (const migration of [
  "ALTER TABLE courses ADD COLUMN duration TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE courses ADD COLUMN level TEXT NOT NULL DEFAULT 'All Levels'",
  "ALTER TABLE courses ADD COLUMN syllabus TEXT NOT NULL DEFAULT ''",
]) {
  try {
    db.exec(migration);
  } catch {
    // column already exists
  }
}

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
    'INSERT INTO courses (title, description, category, price, duration, level, syllabus, instructor_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );
  for (const course of SEED_COURSES) {
    insertCourse.run(
      course.title,
      course.description,
      course.category,
      course.price,
      course.duration,
      course.level,
      course.syllabus,
      course.title.includes('Web Development') || course.title.includes('Python')
        ? instructor1
        : course.title.includes('English') || course.title.includes('IELTS')
          ? instructor2
          : null
    );
  }

  console.log(`Seeded admin (id ${adminId}), 2 instructors, and ${SEED_COURSES.length} courses.`);
}

// Backfill duration/level/syllabus for courses seeded before these fields existed
const backfill = db.prepare(
  "UPDATE courses SET duration = ?, level = ?, syllabus = ? WHERE title = ? AND duration = ''"
);
for (const course of SEED_COURSES) {
  backfill.run(course.duration, course.level, course.syllabus, course.title);
}
