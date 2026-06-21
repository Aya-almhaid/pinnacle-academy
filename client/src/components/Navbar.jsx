import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const dashboardLink = user?.role === 'admin' ? '/admin' : user?.role === 'instructor' ? '/instructor' : '/dashboard';

  return (
    <nav className="navbar">
      <Link to="/" className="brand">
        Pinnacle <span>Academy</span>
      </Link>
      <div className="nav-links">
        <Link to="/courses">Courses</Link>
        {user ? (
          <>
            <Link to={dashboardLink}>Dashboard</Link>
            <button onClick={handleLogout}>Log Out</button>
          </>
        ) : (
          <>
            <Link to="/login">Log In</Link>
            <Link to="/register" className="cta">
              Get Started
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
