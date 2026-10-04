import { NavLink, Outlet } from 'react-router-dom';

const SECTIONS = [
  { to: '/admin', icon: 'fas fa-chart-pie', label: 'Overview', end: true },
  { to: '/admin/users', icon: 'fas fa-users-cog', label: 'Users' },
  { to: '/admin/travel-plans', icon: 'fas fa-map-marked-alt', label: 'Travel Plans' },
  { to: '/admin/packages', icon: 'fas fa-gem', label: 'Featured Packages' },
  { to: '/admin/community', icon: 'fas fa-comments', label: 'Community' },
];

/** Admin area shell. Only rendered for ADMIN users (AdminRoute); the API enforces it as well. */
export default function AdminLayout() {
  return (
    <div className="text-white min-h-screen flex flex-col pt-8 hero-bg-manage">
      <main className="flex-grow py-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-center gap-3 mb-8 fade-up">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-md shadow-violet-500/20">
              <i className="fas fa-user-shield"></i>
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold gradient-text">Admin Panel</h1>
              <p className="text-xs text-gray-400">Manage users, travel plans, featured packages and community content</p>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            <nav className="w-full lg:w-60 flex-shrink-0">
              <div className="glass-panel p-4 lg:sticky lg:top-24 flex lg:flex-col gap-1 overflow-x-auto">
                {SECTIONS.map((s) => (
                  <NavLink
                    key={s.to}
                    to={s.to}
                    end={s.end}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-xl whitespace-nowrap text-sm transition ${
                        isActive ? 'bg-violet-600/20 text-violet-300 font-semibold lg:border-l-2 border-violet-500' : 'hover:bg-white/5 text-gray-300'
                      }`
                    }
                  >
                    <i className={`${s.icon} text-violet-400 w-5`}></i> {s.label}
                  </NavLink>
                ))}
              </div>
            </nav>

            <section className="flex-grow min-w-0">
              <Outlet />
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
