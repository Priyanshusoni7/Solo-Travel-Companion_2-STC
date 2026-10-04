import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { travelApi } from '../../api';
import { errorMessage } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import Loading from '../../components/Loading';
import ManageTravelLayout from '../../components/ManageTravelLayout';
import { capacityLabel, formatDate, isFull, itineraryEntries } from '../../utils/format';

export default function MyPlans() {
  const notify = useToast();
  const [plans, setPlans] = useState(null);
  const [error, setError] = useState('');

  const remove = async (plan) => {
    if (!window.confirm(`Delete your plan to "${plan.destination}"? All join requests for it are deleted too. This cannot be undone.`)) return;
    try {
      await travelApi.remove(plan.travelId);
      setPlans((list) => list.filter((p) => p.travelId !== plan.travelId));
      notify('Travel plan deleted');
    } catch (err) {
      notify(errorMessage(err), 'error');
    }
  };

  useEffect(() => {
    travelApi.mine().then(setPlans).catch((err) => setError(errorMessage(err, 'Could not load your plans')));
  }, []);

  return (
    <ManageTravelLayout>
      {error && <p className="text-red-400">{error}</p>}
      {!error && plans === null && <Loading />}

      {plans?.length === 0 && (
        <div className="glass-panel p-10 text-center">
          <i className="fas fa-folder-open text-violet-400 text-4xl mb-4 opacity-50"></i>
          <p className="text-xl text-gray-300 mb-6">You haven&apos;t posted any travel plans yet.</p>
          <Link
            to="/user/travel/post"
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 px-6 py-3 rounded-xl font-medium transition duration-300 shadow-md"
          >
            Post First Trip Plan
          </Link>
        </div>
      )}

      {plans?.length > 0 && (
        <div className="grid md:grid-cols-2 gap-6">
          {plans.map((plan) => {
            const days = itineraryEntries(plan.dayItineraries);
            return (
              <div key={plan.travelId} className="glass-panel lift p-6 flex flex-col justify-between">
                <div>
                  {plan.coverImageUrl && (
                    <div className="h-32 -mx-6 -mt-6 mb-4 overflow-hidden rounded-t-[20px]">
                      <img src={plan.coverImageUrl} alt={plan.destination} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex justify-between items-start mb-4 gap-2">
                    <h2 className="text-xl font-bold truncate text-white">{plan.destination}</h2>
                    <span
                      className={
                        plan.planStatus === 'OPEN'
                          ? 'px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold'
                          : 'px-2.5 py-1 rounded-full bg-violet-600/10 border border-violet-500/20 text-violet-400 text-xs font-bold'
                      }
                    >
                      {plan.planStatus}
                    </span>
                  </div>

                  <div className="text-gray-300 text-xs space-y-2 mb-4">
                    <p className="flex items-center gap-2">
                      <i className="fas fa-calendar-alt text-violet-400"></i>
                      {formatDate(plan.startDate, 'MMM dd')} - {formatDate(plan.endDate)}
                    </p>
                    <p className="flex items-center gap-2">
                      <i className="fas fa-tag text-violet-400"></i>
                      <span>{plan.interest}</span>
                    </p>
                  </div>

                  <div className="border-t border-white/5 pt-3 mb-5">
                    <p className="text-[10px] text-gray-400 font-semibold mb-1">Itinerary preview:</p>
                    {days.length > 0 ? (
                      <p className="text-xs text-gray-300 line-clamp-2">
                        <span>{days[0][1]}</span>
                        {days.length > 1 && <span className="text-violet-400"> (+ {days.length - 1} more days)</span>}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400 italic">No itinerary details available.</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-white/5 pt-4">
                  <div className="flex items-center text-xs text-gray-300">
                    <i className="fas fa-users text-violet-400 mr-1.5"></i>
                    <span className="font-bold text-white mr-1">{capacityLabel(plan)}</span>
                    {isFull(plan) && <span className="ml-2 text-[10px] font-bold text-amber-300">FULL</span>}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => remove(plan)}
                      aria-label={`Delete plan to ${plan.destination}`}
                      className="px-3 py-1.5 border border-red-500/30 text-red-300 hover:bg-red-500/10 rounded-lg text-xs transition duration-300"
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                    <Link to={`/user/travel/edit/${plan.travelId}`} className="px-3.5 py-1.5 border border-white/10 hover:bg-white/5 rounded-lg text-xs transition duration-300">
                      Edit
                    </Link>
                    <Link
                      to={`/user/travel/public/view/${plan.travelId}`}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 rounded-lg text-xs font-semibold text-white transition duration-300"
                    >
                      Details
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </ManageTravelLayout>
  );
}
