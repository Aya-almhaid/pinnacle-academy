import { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../AuthContext';

export default function InstructorDashboard() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    api.get('/instructor/courses').then(({ data }) => setCourses(data));
  }, []);

  const viewStudents = async (course) => {
    setSelectedCourse(course);
    const { data } = await api.get(`/instructor/courses/${course.id}/students`);
    setStudents(data);
  };

  return (
    <div className="page-section">
      <h1>Welcome, {user.name}</h1>
      <p className="subtitle">Your courses</p>

      <div className="instructor-layout">
        <ul className="instructor-course-list">
          {courses.map((course) => (
            <li
              key={course.id}
              className={selectedCourse?.id === course.id ? 'active' : ''}
              onClick={() => viewStudents(course)}
            >
              <strong>{course.title}</strong>
              <span>{course.enrolled_count} students</span>
            </li>
          ))}
          {courses.length === 0 && <p>No courses assigned to you yet.</p>}
        </ul>

        <div className="student-roster">
          {selectedCourse ? (
            <>
              <h2>{selectedCourse.title} — Enrolled Students</h2>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Enrolled</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.id}>
                      <td>{s.name}</td>
                      <td>{s.email}</td>
                      <td>{s.enrolled_at?.slice(0, 10)}</td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan={3}>No students enrolled yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </>
          ) : (
            <p>Select a course to view its enrolled students.</p>
          )}
        </div>
      </div>
    </div>
  );
}
