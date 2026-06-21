import { useEffect, useState } from 'react';
import api from '../api';
import CourseCard from '../components/CourseCard';

const CATEGORIES = ['All', 'Tech', 'Languages', 'Exam Prep', 'Academic Support'];

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [category, setCategory] = useState('All');

  useEffect(() => {
    api.get('/courses', { params: category !== 'All' ? { category } : {} }).then(({ data }) => setCourses(data));
  }, [category]);

  return (
    <div className="page-section">
      <h1>Courses</h1>
      <div className="category-filter">
        {CATEGORIES.map((c) => (
          <button key={c} className={category === c ? 'active' : ''} onClick={() => setCategory(c)}>
            {c}
          </button>
        ))}
      </div>

      <div className="course-grid">
        {courses.map((course) => (
          <CourseCard course={course} key={course.id} />
        ))}
        {courses.length === 0 && <p>No courses in this category yet.</p>}
      </div>
    </div>
  );
}
