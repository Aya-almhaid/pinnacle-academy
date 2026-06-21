import { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../AuthContext';

export default function InstructorDashboard() {
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState(null);
  const [students, setStudents] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    api.get('/instructor/sections').then(({ data }) => setSections(data));
  }, []);

  const viewStudents = async (section) => {
    setSelectedSection(section);
    const { data } = await api.get(`/instructor/sections/${section.id}/students`);
    setStudents(data);
  };

  return (
    <div className="page-section">
      <h1>Welcome, {user.name}</h1>
      <p className="subtitle">Your sections</p>

      <div className="instructor-layout">
        <ul className="instructor-course-list">
          {sections.map((section) => (
            <li
              key={section.id}
              className={selectedSection?.id === section.id ? 'active' : ''}
              onClick={() => viewStudents(section)}
            >
              <strong>
                {section.course_title} — {section.name}
              </strong>
              <span>{section.schedule || 'Schedule TBA'}</span>
              <span>{section.enrolled_count} students</span>
            </li>
          ))}
          {sections.length === 0 && <p>No sections assigned to you yet.</p>}
        </ul>

        <div className="student-roster">
          {selectedSection ? (
            <>
              <h2>
                {selectedSection.course_title} — {selectedSection.name} · Enrolled Students
              </h2>
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
            <p>Select a section to view its enrolled students.</p>
          )}
        </div>
      </div>
    </div>
  );
}
