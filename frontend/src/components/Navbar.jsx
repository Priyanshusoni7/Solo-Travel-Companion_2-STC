import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LINKS = [
  { key: 'home', to: '/home', icon: 'fas fa-home', label: 'Home' },
  { key: 'dashboard', to: '/user/dashboard', icon: 'fas fa-compass', label: 'Explore' },
  { key: 'myplans', to: '/user/travel/myplans', icon: 'fas fa-map-marked-alt', label: 'My Plans' },
  { key: 'friends', to: '/user/friends', icon: 'fas fa-users', label: 'Friends' },
  { key: 'community', to: '/user/community', icon: 'fas fa-globe', label: 'Community' },
  { key: 'chat', to: '/user/chat', icon: 'far fa-comments', label: 'Messages' },
  { key: 'profile', to: '/user/profile', icon: 'far fa-user', label: 'Profile' },
];

const ADMIN_LINK = { key: 'admin', to: '/admin', icon: 'fas fa-user-shield', label: 'Admin' };

/** Which tab is highlighted; mirrors the activeTab argument the Thymeleaf pages passed. */
function activeTabFor(pathname) {
  if (pathname.startsWith('/admin')) return 'admin';
  if (pathname === '/user/dashboard' || pathname === '/user/travel/post') return 'dashboard';
  if (pathname.startsWith('/user/travel') || pathname.startsWith('/user/requests')) return 'myplans';
  if (pathname.startsWith('/user/friends')) return 'friends';
  if (pathname.startsWith('/user/community')) return 'community';
  if (pathname.startsWith('/user/chat')) return 'chat';
  if (pathname === '/user/profile') return 'profile';
  if (pathname === '/home' || pathname === '/') return 'home';
  return '';
}

/** Logged-in navbar (was fragments/loggedInNavbar.html). */
export default function Navbar() {
  const { isAdmin, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const active = activeTabFor(pathname);
  const links = isAdmin ? [...LINKS, ADMIN_LINK] : LINKS;

  const handleLogout = async () => {
    await logout();
    navigate('/login?logout=true');
  };

  return (
    <nav className="bg-black/80 backdrop-blur-md border-b border-violet-900/30 py-3.5 shadow-xl fixed w-full top-0 z-50">
      <div className="container mx-auto flex justify-between items-center px-6">
        <Link to="/home" className="text-2xl font-black relative group flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white text-sm shadow-md shadow-violet-500/20">
            <i className="fas fa-compass"></i>
          </div>
          <span className="bg-gradient-to-r from-violet-400 via-purple-300 to-indigo-300 bg-clip-text text-transparent tracking-tight">
            STC
          </span>
        </Link>

        <div className="hidden lg:flex items-center space-x-1">
          {links.map((link) => (
            <Link
              key={link.key}
              to={link.to}
              className={
                active === link.key
                  ? 'text-violet-400 font-semibold px-3 xl:px-4 py-2 text-sm border-b-2 border-violet-400'
                  : 'text-gray-300 hover:text-violet-300 px-3 xl:px-4 py-2 text-sm transition duration-300'
              }
            >
              <i className={`${link.icon} mr-1.5 opacity-80`}></i> {link.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={handleLogout}
            className="ml-4 text-xs font-bold text-gray-400 hover:text-red-400 px-3 py-1.5 rounded-lg border border-white/10 hover:border-red-500/30 hover:bg-red-500/10 transition duration-300 flex items-center gap-1.5"
          >
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>

        <button
          type="button"
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((open) => !open)}
          className="lg:hidden text-gray-300 focus:outline-none p-2 rounded-lg hover:bg-white/5"
        >
          <i className="fas fa-bars text-lg"></i>
        </button>
      </div>

      {mobileOpen && (
        <div className="lg:hidden bg-black/95 border-b border-violet-900/30 px-6 py-4 space-y-3">
          {links.map((link) => (
            <Link
              key={link.key}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className={`block py-1 text-sm ${active === link.key ? 'text-violet-400' : 'text-gray-300 hover:text-violet-400'}`}
            >
              <i className={`${link.icon} w-6`}></i> {link.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-white/10">
            <button type="button" onClick={handleLogout} className="text-red-400 text-sm font-semibold flex items-center gap-2">
              <i className="fas fa-sign-out-alt"></i> Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
