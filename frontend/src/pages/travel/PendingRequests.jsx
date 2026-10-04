import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { requestApi } from '../../api';
import { errorMessage } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import Avatar from '../../components/Avatar';
import Loading from '../../components/Loading';
import ManageTravelLayout from '../../components/ManageTravelLayout';
import { formatDate } from '../../utils/format';

export default function PendingRequests() {
  const notify = useToast();
  const [requests, setRequests] = useState(null);
  const [busy, setBusy] = useState(null);

  const load = useCallback(() => {
    requestApi.pending().then(setRequests).catch((err) => {
      setRequests([]);
      notify(errorMessage(err, 'Could not load requests'), 'error');
    });
  }, [notify]);

  useEffect(load, [load]);

  const respond = async (requestId, action) => {
    setBusy(requestId);
    try {
      const res = await requestApi.respond(requestId, action);
      notify(res.message);
      load();
    } catch (err) {
      notify(`Failed to update request: ${errorMessage(err)}`, 'error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <ManageTravelLayout>
      <div className="glass-panel p-6 mb-8">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <i className="fas fa-envelope-open-text text-violet-400"></i> Pending Join Requests
        </h2>

        {requests === null && <Loading />}

        {requests?.length === 0 && (
          <div className="py-12 text-center text-gray-400">
            <i className="fas fa-inbox text-4xl mb-4 text-violet-500 opacity-40"></i>
            <p className="text-sm">You have no pending join requests at the moment.</p>
          </div>
        )}

        {requests?.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-gray-400 uppercase tracking-wider text-[10px] border-b border-white/5">
                  <th className="pb-3 pl-3">From</th>
                  <th className="pb-3">Travel Destination</th>
                  <th className="pb-3">Companion Message</th>
                  <th className="pb-3">Requested On</th>
                  <th className="pb-3 text-right pr-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {requests.map((request) => (
                  <tr key={request.requestId} className="hover:bg-white/5 transition duration-200">
                    <td className="py-4 pl-3">
                      <div className="flex items-center min-w-0">
                        <Avatar src={request.sender.profilePic} className="w-9 h-9 rounded-full object-cover border border-violet-500/30 mr-3 flex-shrink-0" />
                        <Link to={`/user/profile/${request.sender.userId}`} className="min-w-0 hover:text-violet-300">
                          <div className="font-bold text-white truncate">{request.sender.name}</div>
                          <div className="text-[10px] text-gray-400 truncate">View profile</div>
                        </Link>
                      </div>
                    </td>
                    <td className="py-4 font-semibold text-violet-300">
                      <Link to={`/user/travel/public/view/${request.travelId}`} className="hover:underline flex items-center gap-1">
                        <span>{request.destination}</span>
                        <i className="fas fa-external-link-alt text-[9px] opacity-75"></i>
                      </Link>
                    </td>
                    <td className="py-4 text-gray-300">
                      {request.message ? (
                        <p className="max-w-[150px] md:max-w-xs truncate" title={request.message}>{request.message}</p>
                      ) : (
                        <span className="text-gray-500 italic text-[10px]">No message included</span>
                      )}
                    </td>
                    <td className="py-4 text-gray-400">{request.createdAt ? formatDate(request.createdAt) : 'N/A'}</td>
                    <td className="py-4 text-right pr-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          disabled={busy === request.requestId}
                          onClick={() => respond(request.requestId, 'ACCEPTED')}
                          className="bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg text-[10px] font-bold text-white transition duration-300 flex items-center gap-1 disabled:opacity-60"
                        >
                          <i className="fas fa-check"></i> Accept
                        </button>
                        <button
                          type="button"
                          disabled={busy === request.requestId}
                          onClick={() => respond(request.requestId, 'REJECTED')}
                          className="bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg text-[10px] font-bold text-white transition duration-300 flex items-center gap-1 disabled:opacity-60"
                        >
                          <i className="fas fa-times"></i> Decline
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ManageTravelLayout>
  );
}
