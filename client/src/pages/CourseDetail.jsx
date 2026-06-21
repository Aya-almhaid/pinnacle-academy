import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';

export default function CourseDetail() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [message, setMessage] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/courses/${id}`).then(({ data }) => setCourse(data));
  }, [id]);

  const handleEnroll = async () => {
    if (!user) return navigate('/login');
    if (user.role !== 'student') {
      setMessage('Only student accounts can enroll in courses.');
      return;
    }
    try {
      await api.post('/enrollments', { course_id: id });
      setMessage('Enrolled successfully! Check your dashboard.');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to enroll');
    }
  };

  if (!course) return <div className="page-section">Loading...</div>;

  const topics = course.syllabus ? course.syllabus.split(',').filter(Boolean) : [];

  return (
    <div className="page-section course-detail">
      <span className="category-tag">{course.category}</span>
      <h1>{course.title}</h1>
      <p className="instructor">Taught by {course.instructor_name || 'Pinnacle Academy Staff'}</p>

      <div className="course-meta">
        {course.duration && <span className="meta-pill">⏱ {course.duration}</span>}
        {course.level && <span className="meta-pill">📊 {course.level}</span>}
      </div>

      <p className="description">{course.description}</p>

      {topics.length > 0 && (
        <div className="syllabus">
          <h2>What You'll Learn</h2>
          <ul>
            {topics.map((topic) => (
              <li key={topic}>{topic.trim()}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="enroll-box">
        <span className="price">${course.price}</span>
        <button onClick={handleEnroll}>Enroll Now</button>
      </div>
      {message && <p className="message">{message}</p>}
    </div>
  );
}
