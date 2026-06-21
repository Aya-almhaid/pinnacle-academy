import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

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
          <Link to={`/courses/${course.id}`} key={course.id} className="course-card">
            <span className="category-tag">{course.category}</span>
            <h3>{course.title}</h3>
            <p>{course.description}</p>
            <div className="course-card-footer">
              <span>${course.price}</span>
              <span>{course.instructor_name || 'Staff'}</span>
            </div>
          </Link>
        ))}
        {courses.length === 0 && <p>No courses in this category yet.</p>}
      </div>
    </div>
  );
}
