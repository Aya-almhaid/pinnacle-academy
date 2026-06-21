import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

export const db = new Database(process.env.DB_PATH || 'academy.db');

const INSTRUCTORS = [
  {
    email: 'sarah@pinnacle.academy',
    name: 'Sarah Chen',
    bio: 'Sarah is a full-stack engineer with 8 years of industry experience, passionate about helping beginners break into tech.',
  },
  {
    email: 'james@pinnacle.academy',
    name: 'James Carter',
    bio: 'James is a certified language coach with a decade of experience helping students achieve fluency and ace standardized tests.',
  },
  {
    email: 'maria@pinnacle.academy',
    name: 'Maria Lopez',
    bio: 'Maria is a graphic designer and brand consultant with 6 years of experience teaching visual design fundamentals.',
  },
  {
    email: 'omar@pinnacle.academy',
    name: 'Omar Haddad',
    bio: 'Omar is a marketing strategist and former math teacher who loves making practical, numbers-driven skills approachable.',
  },
];

const SEED_COURSES = [
  {
    title: 'Web Development Bootcamp',
    description: 'Learn HTML, CSS, JavaScript, and React from scratch and build real projects.',
    category: 'Tech',
    price: 299,
    duration: '8 weeks',
    level: 'Beginner',
    syllabus: 'HTML & CSS Fundamentals,JavaScript Essentials,React Basics,Building Your First Project,APIs & Deployment',
    sections: [
      { name: 'Section A', instructorEmail: 'sarah@pinnacle.academy', schedule: 'Mon/Wed/Fri 6:00-8:00 PM' },
      { name: 'Section B', instructorEmail: 'sarah@pinnacle.academy', schedule: 'Sat/Sun 10:00 AM-1:00 PM' },
    ],
  },
  {
    title: 'Python for Beginners',
    description: 'A hands-on introduction to Python programming, covering syntax, data structures, and small projects.',
    category: 'Tech',
    price: 199,
    duration: '6 weeks',
    level: 'Beginner',
    syllabus: 'Python Syntax & Variables,Control Flow,Functions & Modules,Data Structures,Mini Project',
    sections: [
      { name: 'Section A', instructorEmail: 'sarah@pinnacle.academy', schedule: 'Tue/Thu 6:00-7:30 PM' },
      { name: 'Section B', instructorEmail: 'sarah@pinnacle.academy', schedule: 'Sat 2:00-4:00 PM' },
    ],
  },
  {
    title: 'English Conversation Mastery',
    description: 'Build fluency and confidence in spoken English through guided conversation practice.',
    category: 'Languages',
    price: 149,
    duration: '4 weeks',
    level: 'All Levels',
    syllabus: 'Everyday Conversation,Pronunciation Practice,Listening Skills,Real-World Role Play',
    sections: [
      { name: 'Section A', instructorEmail: 'james@pinnacle.academy', schedule: 'Mon/Wed 5:00-6:00 PM' },
      { name: 'Section B', instructorEmail: 'james@pinnacle.academy', schedule: 'Sat 9:00-11:00 AM' },
    ],
  },
  {
    title: 'IELTS Exam Preparation',
    description: 'Targeted preparation covering all four IELTS sections with practice tests and feedback.',
    category: 'Exam Prep',
    price: 179,
    duration: '6 weeks',
    level: 'Intermediate',
    syllabus: 'Listening Strategies,Reading Techniques,Writing Task 1 & 2,Speaking Practice,Full Mock Tests',
    sections: [
      { name: 'Section A', instructorEmail: 'james@pinnacle.academy', schedule: 'Tue/Thu 7:00-9:00 PM' },
      { name: 'Section B', instructorEmail: 'james@pinnacle.academy', schedule: 'Sun 3:00-5:00 PM' },
    ],
  },
  {
    title: 'Math Tutoring (Grades 6-12)',
    description: 'Personalized math support covering algebra, geometry, and pre-calculus fundamentals.',
    category: 'Academic Support',
    price: 129,
    duration: 'Ongoing',
    level: 'All Levels',
    syllabus: 'Algebra Foundations,Geometry,Pre-Calculus,Problem Solving Strategies',
    sections: [
      { name: 'Section A', instructorEmail: 'omar@pinnacle.academy', schedule: 'Tue/Fri 4:00-5:30 PM' },
      { name: 'Section B', instructorEmail: null, schedule: 'Flexible scheduling' },
    ],
  },
  {
    title: 'Graphic Design Fundamentals',
    description: 'Learn the core principles of visual design — color, typography, and layout — and build a small portfolio.',
    category: 'Design',
    price: 169,
    duration: '5 weeks',
    level: 'Beginner',
    syllabus: 'Color Theory,Typography,Layout & Composition,Design Tools,Portfolio Project',
    sections: [
      { name: 'Section A', instructorEmail: 'maria@pinnacle.academy', schedule: 'Wed 6:00-8:00 PM' },
      { name: 'Section B', instructorEmail: 'maria@pinnacle.academy', schedule: 'Sat 1:00-3:00 PM' },
    ],
  },
  {
    title: 'Digital Marketing Basics',
    description: 'A practical introduction to social media, content, and ad strategy for small businesses and creators.',
    category: 'Business',
    price: 159,
    duration: '4 weeks',
    level: 'Beginner',
    syllabus: 'Social Media Strategy,Content Planning,Intro to Paid Ads,Analytics Basics',
    sections: [{ name: 'Section A', instructorEmail: 'omar@pinnacle.academy', schedule: 'Mon/Thu 7:00-8:30 PM' }],
  },
];

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student',
    bio TEXT NOT NULL DEFAULT '',
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

  CREATE TABLE IF NOT EXISTS sections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL REFERENCES courses(id),
    name TEXT NOT NULL,
    instructor_id INTEGER REFERENCES users(id),
    schedule TEXT NOT NULL DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS enrollments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL REFERENCES users(id),
    section_id INTEGER REFERENCES sections(id),
    enrolled_at TEXT DEFAULT (datetime('now'))
  );
`);

// --- Backward-compatible migrations for databases created before these fields existed ---
for (const migration of [
  "ALTER TABLE courses ADD COLUMN duration TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE courses ADD COLUMN level TEXT NOT NULL DEFAULT 'All Levels'",
  "ALTER TABLE courses ADD COLUMN syllabus TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE users ADD COLUMN bio TEXT NOT NULL DEFAULT ''",
  'ALTER TABLE enrollments ADD COLUMN section_id INTEGER REFERENCES sections(id)',
]) {
  try {
    db.exec(migration);
  } catch {
    // column already exists
  }
}

// Older enrollments referenced course_id directly (pre-sections). If that column
// still exists and has rows with no section_id yet, point them at a default
// "Section A" for that course (creating one if needed) so old data keeps working.
const hasCourseIdColumn = db
  .prepare("SELECT COUNT(*) as count FROM pragma_table_info('enrollments') WHERE name = 'course_id'")
  .get().count;

if (hasCourseIdColumn > 0) {
  const orphaned = db.prepare('SELECT * FROM enrollments WHERE section_id IS NULL').all();
  for (const enrollment of orphaned) {
    let section = db.prepare('SELECT id FROM sections WHERE course_id = ? ORDER BY id LIMIT 1').get(enrollment.course_id);
    if (!section) {
      const course = db.prepare('SELECT instructor_id FROM courses WHERE id = ?').get(enrollment.course_id);
      const { lastInsertRowid } = db
        .prepare('INSERT INTO sections (course_id, name, instructor_id, schedule) VALUES (?, ?, ?, ?)')
        .run(enrollment.course_id, 'Section A', course?.instructor_id ?? null, '');
      section = { id: lastInsertRowid };
    }
    db.prepare('UPDATE enrollments SET section_id = ? WHERE id = ?').run(section.id, enrollment.id);
  }
}

// --- Idempotent content seeding: safe to run on a fresh DB or an already-seeded one ---
const findUserByEmail = db.prepare('SELECT id FROM users WHERE email = ?');
const insertUser = db.prepare('INSERT INTO users (name, email, password_hash, role, bio) VALUES (?, ?, ?, ?, ?)');
const defaultInstructorPasswordHash = bcrypt.hashSync('instructor123', 10);

if (!findUserByEmail.get('admin@pinnacle.academy')) {
  insertUser.run('Admin', 'admin@pinnacle.academy', bcrypt.hashSync('admin123', 10), 'admin', '');
  console.log('Seeded admin account.');
}

const instructorIdByEmail = {};
for (const instructor of INSTRUCTORS) {
  const existing = findUserByEmail.get(instructor.email);
  if (existing) {
    instructorIdByEmail[instructor.email] = existing.id;
  } else {
    const { lastInsertRowid } = insertUser.run(
      instructor.name,
      instructor.email,
      defaultInstructorPasswordHash,
      'instructor',
      instructor.bio
    );
    instructorIdByEmail[instructor.email] = lastInsertRowid;
    console.log(`Seeded new instructor: ${instructor.name}`);
  }
}

const findCourseByTitle = db.prepare('SELECT id FROM courses WHERE title = ?');
const insertCourse = db.prepare(
  'INSERT INTO courses (title, description, category, price, duration, level, syllabus, instructor_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
);
const findSection = db.prepare('SELECT id FROM sections WHERE course_id = ? AND name = ?');
const insertSection = db.prepare('INSERT INTO sections (course_id, name, instructor_id, schedule) VALUES (?, ?, ?, ?)');

for (const course of SEED_COURSES) {
  let courseId = findCourseByTitle.get(course.title)?.id;

  if (!courseId) {
    const primaryInstructorId = course.sections[0]?.instructorEmail
      ? instructorIdByEmail[course.sections[0].instructorEmail]
      : null;

    courseId = insertCourse.run(
      course.title,
      course.description,
      course.category,
      course.price,
      course.duration,
      course.level,
      course.syllabus,
      primaryInstructorId
    ).lastInsertRowid;
    console.log(`Seeded new course: ${course.title}`);
  }

  for (const section of course.sections) {
    if (!findSection.get(courseId, section.name)) {
      insertSection.run(
        courseId,
        section.name,
        section.instructorEmail ? instructorIdByEmail[section.instructorEmail] : null,
        section.schedule
      );
      console.log(`Seeded new section: ${course.title} — ${section.name}`);
    }
  }
}

// Backfill duration/level/syllabus for courses seeded before these fields existed
const backfillCourse = db.prepare(
  "UPDATE courses SET duration = ?, level = ?, syllabus = ? WHERE title = ? AND duration = ''"
);
for (const course of SEED_COURSES) {
  backfillCourse.run(course.duration, course.level, course.syllabus, course.title);
}

const backfillBio = db.prepare('UPDATE users SET bio = ? WHERE email = ? AND bio = ?');
for (const instructor of INSTRUCTORS) {
  backfillBio.run(instructor.bio, instructor.email, '');
}

// Ensure every existing course has at least one section (covers courses created
// via the admin panel before sections existed, or DBs that skipped fresh-seed).
const coursesWithoutSections = db
  .prepare(
    `SELECT courses.id, courses.instructor_id FROM courses
     LEFT JOIN sections ON sections.course_id = courses.id
     WHERE sections.id IS NULL`
  )
  .all();
const insertDefaultSection = db.prepare(
  'INSERT INTO sections (course_id, name, instructor_id, schedule) VALUES (?, ?, ?, ?)'
);
for (const course of coursesWithoutSections) {
  insertDefaultSection.run(course.id, 'Section A', course.instructor_id, '');
}
