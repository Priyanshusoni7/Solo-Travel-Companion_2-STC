import { NavLink } from 'react-router-dom';

const ITEMS = [
  { to: '/user/travel/myplans', icon: 'fas fa-map-marked-alt', label: 'My Plans' },
  { to: '/user/travel/post', icon: 'fas fa-plus-circle', label: 'Post New Plan' },
  { to: '/user/travel/my-joined-users', icon: 'fas fa-users-cog', label: 'Joined Companions' },
  { to: '/user/requests/pending', icon: 'fas fa-envelope-open-text', label: 'Pending Requests' },
  { to: '/user/requests/sent', icon: 'fas fa-paper-plane', label: 'Sent Requests' },
];

/** "Manage Travel" page shell with the left sidebar shared by My Plans / Requests / Joined pages. */
export default function ManageTravelLayout({ children }) {
  return (
    <div className="text-white min-h-screen flex flex-col pt-8 hero-bg-manage">
      <main className="flex-grow py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <h1 className="text-4xl font-bold gradient-text mb-8 fade-up">Manage Travel</h1>

          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-64 flex-shrink-0 fade-up">
              <div className="glass-panel p-6 md:sticky md:top-24 space-y-2">
                <h3 className="text-xs font-bold tracking-wider text-violet-400 uppercase mb-4 px-2">Navigation</h3>
                {ITEMS.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end
                    className={({ isActive }) =>
                      isActive
                        ? 'flex items-center gap-3 px-4 py-3 rounded-xl bg-violet-600/20 text-violet-300 font-semibold border-l-2 border-violet-500 transition'
                        : 'flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-gray-300 transition'
                    }
                  >
                    <i className={`${item.icon} text-violet-400 w-5`}></i> {item.label}
                  </NavLink>
                ))}
              </div>
            </div>

            <div className="flex-grow min-w-0 fade-up" style={{ animationDelay: '100ms' }}>
              {children}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
