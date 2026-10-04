import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { requestApi, travelApi } from '../../api';
import { errorMessage } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import Avatar from '../../components/Avatar';
import Loading from '../../components/Loading';
import ManageTravelLayout from '../../components/ManageTravelLayout';
import { formatDate } from '../../utils/format';

const STATUS = {
  PENDING: ['bg-yellow-500/10 border-yellow-500/25 text-yellow-500', 'fas fa-clock', 'Pending'],
  ACCEPTED: ['bg-green-500/10 border-green-500/25 text-green-400', 'fas fa-check-circle', 'Accepted'],
  REJECTED: ['bg-red-500/10 border-red-500/25 text-red-400', 'fas fa-times-circle', 'Declined'],
  LEFT: ['bg-gray-500/10 border-gray-500/25 text-gray-300', 'fas fa-sign-out-alt', 'Left Trip'],
  REMOVED: ['bg-gray-500/10 border-gray-500/25 text-gray-300', 'fas fa-user-minus', 'Removed by Host'],
};

const CAN_REQUEST_AGAIN = ['REJECTED', 'LEFT', 'REMOVED'];

export default function SentRequests() {
  const notify = useToast();
  const [requests, setRequests] = useState(null);
  const [error, setError] = useState('');

  const load = () => {
    requestApi.sent().then(setRequests).catch((err) => setError(errorMessage(err, 'Could not load requests')));
  };

  useEffect(load, []);

  const act = async (question, action) => {
    if (!window.confirm(question)) return;
    try {
      const res = await action();
      notify(res.message);
      load();
    } catch (err) {
      notify(errorMessage(err), 'error');
    }
  };

  return (
    <ManageTravelLayout>
      <div className="glass-panel p-6 mb-8">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <i className="fas fa-paper-plane text-violet-400"></i> My Sent Join Requests
        </h2>

        {error && <p className="text-red-400">{error}</p>}
        {!error && requests === null && <Loading />}

        {requests?.length === 0 && (
          <div className="py-12 text-center text-gray-400">
            <i className="fas fa-paper-plane text-4xl mb-4 text-violet-500 opacity-40"></i>
            <p className="text-sm">You haven&apos;t sent any travel companion requests yet.</p>
            <Link to="/user/dashboard" className="text-violet-400 hover:text-violet-300 font-semibold inline-block mt-4 text-xs">
              <i className="fas fa-search mr-1.5"></i> Find and Join Public Plans
            </Link>
          </div>
        )}

        {requests?.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-gray-400 uppercase tracking-wider text-[10px] border-b border-white/5">
                  <th className="pb-3 pl-3">To Host</th>
                  <th className="pb-3">Travel Destination</th>
                  <th className="pb-3">Request Status</th>
                  <th className="pb-3">Sent On</th>
                  <th className="pb-3 text-right pr-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {requests.map((request) => {
                  const [style, icon, label] = STATUS[request.status] || STATUS.PENDING;
                  return (
                    <tr key={request.requestId} className="hover:bg-white/5 transition duration-200">
                      <td className="py-4 pl-3">
                        <div className="flex items-center min-w-0">
                          <Avatar src={request.owner.profilePic} className="w-9 h-9 rounded-full object-cover border border-violet-500/30 mr-3 flex-shrink-0" />
                          <Link to={`/user/profile/${request.owner.userId}`} className="min-w-0 hover:text-violet-300">
                            <div className="font-bold text-white truncate">{request.owner.name}</div>
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
                      <td className="py-4">
                        <span className={`px-2.5 py-1 rounded-full border font-semibold text-[10px] whitespace-nowrap ${style}`}>
                          <i className={`${icon} mr-1`}></i> {label}
                        </span>
                      </td>
                      <td className="py-4 text-gray-400">{request.createdAt ? formatDate(request.createdAt) : 'N/A'}</td>
                      <td className="py-4 text-right pr-3">
                        <div className="flex justify-end gap-2">
                          <Link
                            to={`/user/chat?userId=${request.owner.userId}`}
                            className="bg-violet-600/20 hover:bg-violet-600/40 border border-violet-500/30 text-violet-300 px-3 py-1.5 rounded-lg text-[10px] font-bold transition duration-300 flex items-center gap-1"
                          >
                            <i className="far fa-comment-dots"></i> Message
                          </Link>
                          {request.status === 'PENDING' && (
                            <button
                              type="button"
                              onClick={() => act('Cancel this join request?', () => requestApi.cancel(request.requestId))}
                              className="bg-red-600/80 hover:bg-red-700 px-3 py-1.5 rounded-lg text-[10px] font-bold text-white transition duration-300 flex items-center gap-1"
                            >
                              <i className="fas fa-times"></i> Cancel
                            </button>
                          )}
                          {request.status === 'ACCEPTED' && (
                            <button
                              type="button"
                              onClick={() => act(`Leave your trip to ${request.destination}?`, () => travelApi.leave(request.travelId))}
                              className="bg-red-600/80 hover:bg-red-700 px-3 py-1.5 rounded-lg text-[10px] font-bold text-white transition duration-300 flex items-center gap-1"
                            >
                              <i className="fas fa-sign-out-alt"></i> Leave
                            </button>
                          )}
                          {CAN_REQUEST_AGAIN.includes(request.status) && (
                            <Link
                              to={`/user/travel/public/view/${request.travelId}`}
                              className="bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg text-[10px] font-bold text-white transition duration-300 flex items-center gap-1"
                            >
                              <i className="fas fa-redo"></i> Re-request
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ManageTravelLayout>
  );
}
