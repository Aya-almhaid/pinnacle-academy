import { useEffect, useState } from 'react';
import api from '../api';
import CourseCard from '../components/CourseCard';

const CATEGORIES = ['All', 'Tech', 'Languages', 'Exam Prep', 'Academic Support', 'Design', 'Business'];

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [category, setCategory] = useState('All');

  useEffect(() => {
    api.get('/courses', { params: category !== 'All' ? { category } : {} }).then(({ data }) => setCourses(data));
  }, [category]);

  const groupedByCategory =
    category === 'All'
      ? CATEGORIES.slice(1)
          .map((cat) => ({ category: cat, courses: courses.filter((c) => c.category === cat) }))
          .filter((group) => group.courses.length > 0)
      : null;

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

      {groupedByCategory ? (
        groupedByCategory.map((group) => (
          <div className="topic-group" key={group.category}>
            <h2 className="topic-heading">{group.category}</h2>
            <div className="course-grid">
              {group.courses.map((course) => (
                <CourseCard course={course} key={course.id} />
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="course-grid">
          {courses.map((course) => (
            <CourseCard course={course} key={course.id} />
          ))}
          {courses.length === 0 && <p>No courses in this category yet.</p>}
        </div>
      )}
    </div>
  );
}
