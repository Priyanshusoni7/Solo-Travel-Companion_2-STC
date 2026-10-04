import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api';
import { errorMessage } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Avatar from '../../components/Avatar';
import Loading from '../../components/Loading';
import Pagination from '../../components/Pagination';
import { locationOf } from '../../utils/format';

export default function AdminUsers() {
  const { user: me } = useAuth();
  const notify = useToast();
  const [keyword, setKeyword] = useState('');
  const [pageNumber, setPageNumber] = useState(0);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(null);

  const load = useCallback(() => {
    adminApi
      .users({ keyword, page: pageNumber, size: 20 })
      .then(setResult)
      .catch((err) => notify(errorMessage(err, 'Could not load users'), 'error'));
  }, [keyword, pageNumber, notify]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const replaceUser = (updated) =>
    setResult((r) => ({ ...r, content: r.content.map((u) => (u.userId === updated.userId ? updated : u)) }));

  const changeRole = async (user) => {
    const role = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
    const verb = role === 'ADMIN' ? 'grant ADMIN access to' : 'remove ADMIN access from';
    if (!window.confirm(`Are you sure you want to ${verb} ${user.name}?`)) return;
    setBusy(user.userId);
    try {
      replaceUser(await adminApi.setRole(user.userId, role));
      notify(`${user.name} is now ${role === 'ADMIN' ? 'an admin' : 'a normal user'}`);
    } catch (err) {
      notify(errorMessage(err), 'error');
    } finally {
      setBusy(null);
    }
  };

  const changeStatus = async (user) => {
    const enabled = !user.enabled;
    if (!enabled && !window.confirm(`Disable ${user.name}? They will be logged out and cannot log in until re-enabled.`)) return;
    setBusy(user.userId);
    try {
      replaceUser(await adminApi.setEnabled(user.userId, enabled));
      notify(`${user.name} has been ${enabled ? 'enabled' : 'disabled'}`);
    } catch (err) {
      notify(errorMessage(err), 'error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="glass-panel p-6 fade-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <i className="fas fa-users-cog text-violet-400"></i> Users
        </h2>
        <div className="relative sm:w-72">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-violet-400 text-xs"></i>
          <input
            type="text"
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              setPageNumber(0);
            }}
            placeholder="Search name or email..."
            className="form-input w-full pl-9 pr-3 py-2 rounded-xl text-sm"
          />
        </div>
      </div>

      {!result && <Loading />}

      {result?.content.length === 0 && <p className="text-center text-gray-400 py-10 text-sm">No users found.</p>}

      {result?.content.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="text-gray-400 uppercase tracking-wider text-[10px] border-b border-white/5">
                <th className="pb-3 pl-3">User</th>
                <th className="pb-3">Location</th>
                <th className="pb-3">Role</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right pr-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {result.content.map((user) => {
                const isSelf = user.userId === me.userId;
                return (
                  <tr key={user.userId} className="hover:bg-white/5 transition duration-200">
                    <td className="py-3 pl-3">
                      <Link to={`/user/profile/${user.userId}`} className="flex items-center min-w-0 group">
                        <Avatar src={user.profilePic} className="w-9 h-9 rounded-full object-cover border border-violet-500/30 mr-3 flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="font-bold text-white truncate group-hover:text-violet-300">
                            {user.name} {isSelf && <span className="text-violet-400 font-normal">(you)</span>}
                          </div>
                          <div className="text-[10px] text-gray-400 truncate">{user.email}</div>
                        </div>
                      </Link>
                    </td>
                    <td className="py-3 text-gray-300">{locationOf(user) || '—'}</td>
                    <td className="py-3">
                      <span
                        className={`px-2.5 py-1 rounded-full border font-semibold text-[10px] ${
                          user.role === 'ADMIN'
                            ? 'bg-violet-500/15 border-violet-500/30 text-violet-300'
                            : 'bg-white/5 border-white/10 text-gray-300'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2.5 py-1 rounded-full border font-semibold text-[10px] ${
                          user.enabled ? 'bg-green-500/10 border-green-500/25 text-green-400' : 'bg-red-500/10 border-red-500/25 text-red-400'
                        }`}
                      >
                        {user.enabled ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="py-3 pr-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          disabled={isSelf || busy === user.userId}
                          onClick={() => changeRole(user)}
                          title={isSelf ? 'You cannot change your own role' : ''}
                          className="px-3 py-1.5 rounded-lg text-[10px] font-bold border border-violet-500/30 bg-violet-600/20 hover:bg-violet-600/40 text-violet-200 transition disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                          {user.role === 'ADMIN' ? 'Remove admin' : 'Make admin'}
                        </button>
                        <button
                          type="button"
                          disabled={isSelf || busy === user.userId}
                          onClick={() => changeStatus(user)}
                          title={isSelf ? 'You cannot disable your own account' : ''}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold text-white transition disabled:opacity-40 disabled:cursor-not-allowed ${
                            user.enabled ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                          }`}
                        >
                          {user.enabled ? 'Disable' : 'Enable'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={result?.page} onChange={setPageNumber} />
    </div>
  );
}
