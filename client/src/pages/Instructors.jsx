import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function Instructors() {
  const [instructors, setInstructors] = useState([]);

  useEffect(() => {
    api.get('/instructors').then(({ data }) => setInstructors(data));
  }, []);

  return (
    <div className="page-section">
      <h1>Our Teachers</h1>
      <p className="subtitle">Meet the instructors behind our courses</p>

      <div className="instructor-grid">
        {instructors.map((instructor) => (
          <div className="instructor-card" key={instructor.id}>
            <h3>{instructor.name}</h3>
            {instructor.bio && <p className="bio">{instructor.bio}</p>}
            <h4>Teaches</h4>
            <ul className="instructor-sections">
              {instructor.sections.map((s) => (
                <li key={s.id}>
                  <Link to={`/courses/${s.course_id}`}>{s.course_title}</Link>
                  <span>
                    {s.name} · {s.schedule || 'Schedule TBA'}
                  </span>
                </li>
              ))}
              {instructor.sections.length === 0 && <li className="none">No sections assigned yet</li>}
            </ul>
          </div>
        ))}
        {instructors.length === 0 && <p>No instructors listed yet.</p>}
      </div>
    </div>
  );
}
