import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api';
import { errorMessage } from '../../api/client';
import Loading from '../../components/Loading';

const GROUPS = [
  {
    title: 'Users',
    link: '/admin/users',
    icon: 'fas fa-users',
    items: [
      ['users', 'Registered users'],
      ['admins', 'Admins'],
      ['disabledUsers', 'Disabled accounts'],
    ],
  },
  {
    title: 'Travel plans',
    link: '/admin/travel-plans',
    icon: 'fas fa-map-marked-alt',
    items: [
      ['travelPlans', 'Total plans'],
      ['openPlans', 'Open for companions'],
      ['closedPlans', 'Closed'],
    ],
  },
  {
    title: 'Companionship',
    icon: 'fas fa-handshake',
    items: [
      ['pendingJoinRequests', 'Pending join requests'],
      ['acceptedJoinRequests', 'Accepted join requests'],
      ['friendships', 'Friendships'],
    ],
  },
  {
    title: 'Messaging & packages',
    link: '/admin/community',
    icon: 'fas fa-comments',
    items: [
      ['privateMessages', 'Private messages'],
      ['communityMessages', 'Community messages'],
      ['featuredPlans', 'Featured packages'],
    ],
  },
];

export default function AdminOverview() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.stats().then(setStats).catch((err) => setError(errorMessage(err, 'Could not load statistics')));
  }, []);

  if (error) return <p className="text-red-400">{error}</p>;
  if (!stats) return <Loading />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 fade-up">
      {GROUPS.map((group) => (
        <div key={group.title} className="glass-panel p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <i className={`${group.icon} text-violet-400`}></i> {group.title}
            </h2>
            {group.link && (
              <Link to={group.link} className="text-xs text-violet-400 hover:text-violet-300">
                Manage <i className="fas fa-chevron-right ml-1 text-[10px]"></i>
              </Link>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {group.items.map(([key, label]) => (
              <div key={key} className="stat-widget text-center px-2">
                <div className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-indigo-300 bg-clip-text text-transparent tabular-nums">
                  {(stats[key] ?? 0).toLocaleString()}
                </div>
                <div className="text-[11px] text-gray-400 mt-1 leading-tight">{label}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
