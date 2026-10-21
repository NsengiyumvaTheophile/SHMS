import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SiteFooter from './SiteFooter';

const adminLinks = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/students', label: 'Students' },
  { to: '/hostels', label: 'Hostels' },
  { to: '/rooms', label: 'Rooms' },
  { to: '/requests', label: 'Requests' },
  { to: '/allocations', label: 'Allocations' },
  { to: '/fees', label: 'Fees' },
  { to: '/payments', label: 'Payments' },
  { to: '/maintenance', label: 'Maintenance' },
  { to: '/occupancy', label: 'Occupancy' },
  { to: '/reports', label: 'Reports' },
];

const systemLinks = [
  { to: '/users', label: 'Users' },
  { to: '/system', label: 'System' },
];

const studentLinks = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/my-request', label: 'Hostel Request' },
  { to: '/my-fees', label: 'Fees & Payments' },
  { to: '/my-maintenance', label: 'Maintenance' },
  { to: '/profile', label: 'My Profile' },
  { to: '/account', label: 'Account' },
];

const accountLink = { to: '/account', label: 'Account' };

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const links =
    user?.role === 'STUDENT'
      ? studentLinks
      : user?.role === 'SYSTEM_ADMIN'
        ? [...adminLinks, ...systemLinks, accountLink]
        : [...adminLinks, accountLink];

  const onLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="bg-[var(--brand-dark)] text-white p-4 lg:min-h-screen">
        <div className="mb-6">
          <div className="text-xs uppercase tracking-[0.18em] opacity-70">RP Musanze College</div>
          <div className="font-display text-2xl mt-1">SHMS</div>
          <div className="text-sm opacity-80 mt-1">Student Hostel Management</div>
        </div>
        <nav className="flex flex-wrap lg:flex-col gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-white/15 font-semibold' : 'hover:bg-white/10'}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-6 pt-4 border-t border-white/15 text-sm">
          <div className="font-semibold">{user?.username}</div>
          <div className="opacity-75 text-xs mb-3">{user?.role?.replaceAll('_', ' ')}</div>
          <a href="/" className="block text-xs opacity-80 mb-2 hover:opacity-100">
            Campus home page
          </a>
          <button className="btn btn-secondary w-full" onClick={onLogout}>
            Logout
          </button>
        </div>
      </aside>
      <div className="flex flex-col min-h-screen">
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
        <SiteFooter variant="app" />
      </div>
    </div>
  );
}
