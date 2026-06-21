import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import CourseCard from '../components/CourseCard';

export default function Home() {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    api.get('/courses').then(({ data }) => setCourses(data.slice(0, 3)));
  }, []);

  return (
    <div>
      <section className="hero">
        <h1>Learn skills that move you forward</h1>
        <p>
          From coding to languages to exam prep — Pinnacle Academy brings expert instructors and
          structured courses to learners of every level.
        </p>
        <Link to="/courses" className="btn-primary">
          Browse Courses
        </Link>
      </section>

      <section className="featured">
        <h2>Featured Courses</h2>
        <div className="course-grid">
          {courses.map((course) => (
            <CourseCard course={course} key={course.id} />
          ))}
        </div>
      </section>
    </div>
  );
}
