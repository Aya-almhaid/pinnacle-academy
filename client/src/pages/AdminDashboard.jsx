import { useEffect, useState } from 'react';
import api from '../api';

const CATEGORIES = ['Tech', 'Languages', 'Exam Prep', 'Academic Support'];

export default function AdminDashboard() {
  const [tab, setTab] = useState('courses');
  const [courses, setCourses] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', category: CATEGORIES[0], price: '', instructor_id: '' });
  const [editingId, setEditingId] = useState(null);

  const loadCourses = () => api.get('/courses').then(({ data }) => setCourses(data));
  const loadInstructors = () => api.get('/admin/instructors').then(({ data }) => setInstructors(data));
  const loadUsers = () => api.get('/admin/users').then(({ data }) => setUsers(data));

  useEffect(() => {
    loadCourses();
    loadInstructors();
    loadUsers();
  }, []);

  const resetForm = () => {
    setForm({ title: '', description: '', category: CATEGORIES[0], price: '', instructor_id: '' });
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
      instructor_id: course.instructor_id || '',
    });
  };

  const handleDelete = async (id) => {
    await api.delete(`/courses/${id}`);
    loadCourses();
  };

  const handleRoleChange = async (id, role) => {
    await api.patch(`/admin/users/${id}/role`, { role });
    loadUsers();
    loadInstructors();
  };

  return (
    <div className="page-section">
      <h1>Admin Dashboard</h1>
      <div className="admin-tabs">
        <button className={tab === 'courses' ? 'active' : ''} onClick={() => setTab('courses')}>
          Manage Courses
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
            <select value={form.instructor_id} onChange={(e) => setForm({ ...form, instructor_id: e.target.value })}>
              <option value="">No instructor</option>
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
                <th>Instructor</th>
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
