import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api';
import { errorMessage } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import Loading from '../../components/Loading';
import Pagination from '../../components/Pagination';
import { formatDate } from '../../utils/format';

export default function AdminTravelPlans() {
  const notify = useToast();
  const [keyword, setKeyword] = useState('');
  const [pageNumber, setPageNumber] = useState(0);
  const [result, setResult] = useState(null);

  const load = useCallback(() => {
    adminApi
      .travelPlans({ keyword, page: pageNumber, size: 20 })
      .then(setResult)
      .catch((err) => notify(errorMessage(err, 'Could not load travel plans'), 'error'));
  }, [keyword, pageNumber, notify]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const remove = async (plan) => {
    if (!window.confirm(`Delete the travel plan to "${plan.destination}" by ${plan.user?.name}? Its join requests are deleted too. This cannot be undone.`)) return;
    try {
      await adminApi.deleteTravelPlan(plan.travelId);
      notify('Travel plan deleted');
      load();
    } catch (err) {
      notify(errorMessage(err), 'error');
    }
  };

  return (
    <div className="glass-panel p-6 fade-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <i className="fas fa-map-marked-alt text-violet-400"></i> Travel Plans
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
            placeholder="Search destination..."
            className="form-input w-full pl-9 pr-3 py-2 rounded-xl text-sm"
          />
        </div>
      </div>

      {!result && <Loading />}
      {result?.content.length === 0 && <p className="text-center text-gray-400 py-10 text-sm">No travel plans found.</p>}

      {result?.content.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="text-gray-400 uppercase tracking-wider text-[10px] border-b border-white/5">
                <th className="pb-3 pl-3">Destination</th>
                <th className="pb-3">Owner</th>
                <th className="pb-3">Dates</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Joined</th>
                <th className="pb-3">Created</th>
                <th className="pb-3 text-right pr-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {result.content.map((plan) => (
                <tr key={plan.travelId} className="hover:bg-white/5 transition duration-200">
                  <td className="py-3 pl-3 font-semibold text-violet-300">{plan.destination}</td>
                  <td className="py-3">
                    <div className="text-white">{plan.user?.name}</div>
                    <div className="text-[10px] text-gray-400">{plan.user?.email}</div>
                  </td>
                  <td className="py-3 text-gray-300 whitespace-nowrap">
                    {formatDate(plan.startDate, 'MMM dd')} - {formatDate(plan.endDate)}
                  </td>
                  <td className="py-3">
                    <span
                      className={`px-2.5 py-1 rounded-full border text-[10px] font-bold ${
                        plan.planStatus === 'OPEN' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-violet-600/10 border-violet-500/20 text-violet-400'
                      }`}
                    >
                      {plan.planStatus}
                    </span>
                  </td>
                  <td className="py-3 text-gray-300">{plan.joinedCount ?? 0}</td>
                  <td className="py-3 text-gray-400 whitespace-nowrap">{formatDate(plan.createdAt)}</td>
                  <td className="py-3 pr-3">
                    <div className="flex justify-end gap-2">
                      <Link
                        to={`/user/travel/public/view/${plan.travelId}`}
                        className="px-3 py-1.5 rounded-lg text-[10px] font-bold border border-white/10 hover:bg-white/5 transition"
                      >
                        View
                      </Link>
                      <button
                        type="button"
                        onClick={() => remove(plan)}
                        className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-red-600 hover:bg-red-700 text-white transition"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={result?.page} onChange={setPageNumber} />
    </div>
  );
}
