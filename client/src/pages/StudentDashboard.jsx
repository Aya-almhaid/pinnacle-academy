import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';

export default function StudentDashboard() {
  const [enrollments, setEnrollments] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    api.get('/enrollments/me').then(({ data }) => setEnrollments(data));
  }, []);

  return (
    <div className="page-section">
      <h1>Welcome, {user.name}</h1>
      <p className="subtitle">Your enrolled courses</p>

      <div className="course-grid">
        {enrollments.map((enrollment) => (
          <Link to={`/courses/${enrollment.course_id}`} key={enrollment.section_id} className="course-card">
            <span className="category-tag">{enrollment.category}</span>
            <h3>{enrollment.title}</h3>
            <p>
              {enrollment.section_name} · {enrollment.schedule || 'Schedule TBA'}
            </p>
            <div className="course-card-footer">
              <span>Instructor: {enrollment.instructor_name || 'Staff'}</span>
              <span>Enrolled {enrollment.enrolled_at?.slice(0, 10)}</span>
            </div>
          </Link>
        ))}
        {enrollments.length === 0 && (
          <p>
            You haven't enrolled in any courses yet. <Link to="/courses">Browse courses</Link>.
          </p>
        )}
      </div>
    </div>
  );
}
