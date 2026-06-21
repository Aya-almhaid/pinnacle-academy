import { useEffect, useState } from 'react';
import api from '../api';

const CATEGORIES = ['Tech', 'Languages', 'Exam Prep', 'Academic Support', 'Design', 'Business'];
const LEVELS = ['All Levels', 'Beginner', 'Intermediate', 'Advanced'];

const EMPTY_FORM = {
  title: '',
  description: '',
  category: CATEGORIES[0],
  price: '',
  duration: '',
  level: LEVELS[0],
  syllabus: '',
  instructor_id: '',
};

const EMPTY_SECTION_FORM = { course_id: '', name: '', instructor_id: '', schedule: '' };

export default function AdminDashboard() {
  const [tab, setTab] = useState('courses');
  const [courses, setCourses] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [users, setUsers] = useState([]);
  const [sections, setSections] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [sectionForm, setSectionForm] = useState(EMPTY_SECTION_FORM);
  const [editingSectionId, setEditingSectionId] = useState(null);

  const loadCourses = () => api.get('/courses').then(({ data }) => setCourses(data));
  const loadInstructors = () => api.get('/admin/instructors').then(({ data }) => setInstructors(data));
  const loadUsers = () => api.get('/admin/users').then(({ data }) => setUsers(data));
  const loadSections = () => api.get('/admin/sections').then(({ data }) => setSections(data));

  useEffect(() => {
    loadCourses();
    loadInstructors();
    loadUsers();
    loadSections();
  }, []);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, price: parseFloat(form.price) || 0, instructor_id: form.instructor_id || null };
    if (editingId) {
      await api.patch(`/courses/${editingId}`, payload);
    } else {
      await api.post('/courses', payload);
    }
    resetForm();
    loadCourses();
  };

  const handleEdit = (course) => {
    setEditingId(course.id);
    setForm({
      title: course.title,
      description: course.description,
      category: course.category,
      price: course.price,
      duration: course.duration || '',
      level: course.level || LEVELS[0],
      syllabus: course.syllabus || '',
      instructor_id: course.instructor_id || '',
    });
  };

  const handleDelete = async (id) => {
    await api.delete(`/courses/${id}`);
    loadCourses();
    loadSections();
  };

  const handleRoleChange = async (id, role) => {
    await api.patch(`/admin/users/${id}/role`, { role });
    loadUsers();
    loadInstructors();
  };

  const resetSectionForm = () => {
    setSectionForm(EMPTY_SECTION_FORM);
    setEditingSectionId(null);
  };

  const handleSectionSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...sectionForm, instructor_id: sectionForm.instructor_id || null };
    if (editingSectionId) {
      await api.patch(`/admin/sections/${editingSectionId}`, payload);
    } else {
      await api.post('/admin/sections', payload);
    }
    resetSectionForm();
    loadSections();
  };

  const handleSectionEdit = (section) => {
    setEditingSectionId(section.id);
    setSectionForm({
      course_id: section.course_id,
      name: section.name,
      instructor_id: section.instructor_id || '',
      schedule: section.schedule || '',
    });
  };

  const handleSectionDelete = async (id) => {
    await api.delete(`/admin/sections/${id}`);
    loadSections();
  };

  return (
    <div className="page-section">
      <h1>Admin Dashboard</h1>
      <div className="admin-tabs">
        <button className={tab === 'courses' ? 'active' : ''} onClick={() => setTab('courses')}>
          Manage Courses
        </button>
        <button className={tab === 'sections' ? 'active' : ''} onClick={() => setTab('sections')}>
          Manage Sections
        </button>
        <button className={tab === 'users' ? 'active' : ''} onClick={() => setTab('users')}>
          Manage Users
        </button>
      </div>

      {tab === 'courses' && (
        <div className="admin-courses">
          <form className="course-form" onSubmit={handleSubmit}>
            <input
              placeholder="Course title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
            <input
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Price"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
            <input
              placeholder="Duration (e.g. 6 weeks)"
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: e.target.value })}
            />
            <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
            <input
              placeholder="Syllabus topics (comma-separated)"
              value={form.syllabus}
              onChange={(e) => setForm({ ...form, syllabus: e.target.value })}
              className="syllabus-input"
            />
            <select value={form.instructor_id} onChange={(e) => setForm({ ...form, instructor_id: e.target.value })}>
              <option value="">No primary instructor</option>
              {instructors.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
            <button type="submit">{editingId ? 'Update Course' : 'Add Course'}</button>
            {editingId && (
              <button type="button" onClick={resetForm}>
                Cancel
              </button>
            )}
          </form>

          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Price</th>
                <th>Primary Instructor</th>
                <th>Enrolled</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.id}>
                  <td>{c.title}</td>
                  <td>{c.category}</td>
                  <td>${c.price}</td>
                  <td>{c.instructor_name || '—'}</td>
                  <td>{c.enrolled_count}</td>
                  <td>
                    <button onClick={() => handleEdit(c)}>Edit</button>
                    <button onClick={() => handleDelete(c.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'sections' && (
        <div className="admin-courses">
          <form className="course-form" onSubmit={handleSectionSubmit}>
            <select
              value={sectionForm.course_id}
              onChange={(e) => setSectionForm({ ...sectionForm, course_id: e.target.value })}
              required
            >
              <option value="">Select course</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
            <input
              placeholder="Section name (e.g. Section A)"
              value={sectionForm.name}
              onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })}
              required
            />
            <input
              placeholder="Schedule (e.g. Mon/Wed 6-8 PM)"
              value={sectionForm.schedule}
              onChange={(e) => setSectionForm({ ...sectionForm, schedule: e.target.value })}
            />
            <select
              value={sectionForm.instructor_id}
              onChange={(e) => setSectionForm({ ...sectionForm, instructor_id: e.target.value })}
            >
              <option value="">No instructor</option>
              {instructors.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
            <button type="submit">{editingSectionId ? 'Update Section' : 'Add Section'}</button>
            {editingSectionId && (
              <button type="button" onClick={resetSectionForm}>
                Cancel
              </button>
            )}
          </form>

          <table>
            <thead>
              <tr>
                <th>Course</th>
                <th>Section</th>
                <th>Schedule</th>
                <th>Instructor</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sections.map((s) => (
                <tr key={s.id}>
                  <td>{s.course_title}</td>
                  <td>{s.name}</td>
                  <td>{s.schedule || '—'}</td>
                  <td>{s.instructor_name || '—'}</td>
                  <td>
                    <button onClick={() => handleSectionEdit(s)}>Edit</button>
                    <button onClick={() => handleSectionDelete(s.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'users' && (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>
                  <select value={u.role} onChange={(e) => handleRoleChange(u.id, e.target.value)}>
                    <option value="student">student</option>
                    <option value="instructor">instructor</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
