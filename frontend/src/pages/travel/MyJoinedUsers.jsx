import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { travelApi } from '../../api';
import { errorMessage } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import Avatar from '../../components/Avatar';
import Loading from '../../components/Loading';
import ManageTravelLayout from '../../components/ManageTravelLayout';
import { formatDate } from '../../utils/format';

export default function MyJoinedUsers() {
  const notify = useToast();
  const [entries, setEntries] = useState(null);
  const [error, setError] = useState('');

  const load = () => {
    travelApi.myJoinedUsers().then(setEntries).catch((err) => setError(errorMessage(err, 'Could not load companions')));
  };

  useEffect(load, []);

  const removeCompanion = async (plan, user) => {
    if (!window.confirm(`Remove ${user.name} from your trip to ${plan.destination}?`)) return;
    try {
      const res = await travelApi.removeCompanion(plan.travelId, user.userId);
      notify(res.message);
      load();
    } catch (err) {
      notify(errorMessage(err), 'error');
    }
  };

  return (
    <ManageTravelLayout>
      {error && <p className="text-red-400">{error}</p>}
      {!error && entries === null && <Loading />}

      {entries?.length === 0 && (
        <div className="glass-panel p-10 text-center text-gray-400">
          <i className="fas fa-user-friends text-violet-400 text-4xl mb-4 opacity-50"></i>
          <p className="text-lg text-gray-300">No companions have joined any of your plans yet.</p>
        </div>
      )}

      {entries?.length > 0 && (
        <div className="space-y-6">
          {entries.map(({ plan, joinedUsers }) => (
            <div key={plan.travelId} className="glass-panel p-6">
              <div className="flex justify-between items-start mb-4 gap-2">
                <div className="min-w-0">
                  <h2 className="text-xl font-bold text-white">{plan.destination}</h2>
                  <p className="text-xs text-violet-300 flex items-center gap-1.5 mt-1">
                    <i className="fas fa-calendar-alt text-violet-400"></i>
                    {formatDate(plan.startDate, 'MMM dd')} - {formatDate(plan.endDate)}
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-bold tracking-wider">
                  {plan.planStatus}
                </span>
              </div>

              <div className="mt-6 border-t border-white/5 pt-4">
                <h3 className="text-xs font-bold text-violet-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <i className="fas fa-users text-sm"></i>
                  Joined Travelers ({joinedUsers.length})
                </h3>

                {joinedUsers.length === 0 ? (
                  <div className="text-gray-500 text-xs italic py-2">No travel companions have joined this trip plan.</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {joinedUsers.map((user) => (
                      <div key={user.userId} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                        <div className="flex items-center min-w-0">
                          <Avatar src={user.profilePic} className="w-9 h-9 rounded-full object-cover border border-violet-500/30 mr-3 flex-shrink-0" />
                          <Link to={`/user/profile/${user.userId}`} className="min-w-0 hover:text-violet-300">
                            <h4 className="font-bold text-xs truncate text-white">{user.name}</h4>
                          </Link>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Link
                            to={`/user/chat?userId=${user.userId}`}
                            aria-label={`Message ${user.name}`}
                            className="w-8 h-8 rounded-full bg-violet-600/20 hover:bg-violet-600/40 text-violet-400 flex items-center justify-center transition duration-300"
                          >
                            <i className="far fa-comment-dots text-sm"></i>
                          </Link>
                          <button
                            type="button"
                            onClick={() => removeCompanion(plan, user)}
                            aria-label={`Remove ${user.name}`}
                            className="w-8 h-8 rounded-full bg-red-600/15 hover:bg-red-600/30 text-red-300 flex items-center justify-center transition duration-300"
                          >
                            <i className="fas fa-user-minus text-xs"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </ManageTravelLayout>
  );
}
