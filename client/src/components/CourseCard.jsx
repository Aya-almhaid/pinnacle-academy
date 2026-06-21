import { Link } from 'react-router-dom';

export default function CourseCard({ course }) {
  return (
    <Link to={`/courses/${course.id}`} className="course-card">
      <span className="category-tag">{course.category}</span>
      <h3>{course.title}</h3>
      <p>{course.description}</p>
      <div className="course-meta">
        {course.duration && <span className="meta-pill">⏱ {course.duration}</span>}
        {course.level && <span className="meta-pill">📊 {course.level}</span>}
      </div>
      <div className="course-card-footer">
        <span>${course.price}</span>
        <span>{course.instructor_name || 'Staff'}</span>
      </div>
    </Link>
  );
}
