import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { requestApi, travelApi } from '../../api';
import { errorMessage } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import Avatar from '../../components/Avatar';
import Loading from '../../components/Loading';
import Modal from '../../components/Modal';
import { capacityLabel, formatDate, itineraryEntries, parseLocalDate, tripLengthDays } from '../../utils/format';

const JOIN_BLOCKED = {
  CLOSED: ['fas fa-lock', 'Not Accepting Companions'],
  STARTED: ['fas fa-plane-departure', 'Trip Already Started'],
  FULL: ['fas fa-user-check', 'Trip Is Full'],
};

function dayDate(startDate, dayNumber) {
  const start = parseLocalDate(startDate);
  if (!start) return '';
  const date = new Date(start);
  date.setDate(start.getDate() + dayNumber - 1);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

/** Plan details for owners and other travelers (was user/viewTravelPlan.html). */
export default function ViewTravelPlan() {
  const { id } = useParams();
  const navigate = useNavigate();
  const notify = useToast();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [joinOpen, setJoinOpen] = useState(false);
  const [companionsOpen, setCompanionsOpen] = useState(false);
  const [joinMessage, setJoinMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    travelApi.get(id).then(setData).catch((err) => setError(errorMessage(err, 'Travel plan not found')));
  }, [id]);

  useEffect(load, [load]);

  if (error) {
    return (
      <div className="hero-bg-plan min-h-screen flex items-center justify-center text-white px-4">
        <div className="glass-detail p-10 text-center">
          <p className="text-gray-300 mb-4">{error}</p>
          <Link to="/user/dashboard" className="text-violet-400 hover:text-violet-300">Back to Dashboard</Link>
        </div>
      </div>
    );
  }
  if (!data) return <Loading fullScreen />;

  const { plan, owner, isOwner, requestStatus, requestId, joinedUsers, joinedCount, joinBlockedReason } = data;
  const days = itineraryEntries(plan.dayItineraries);
  const length = tripLengthDays(plan.startDate, plan.endDate);

  const sendJoinRequest = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await travelApi.join(id, joinMessage);
      notify(res.message || 'Join request sent successfully');
      setJoinOpen(false);
      setJoinMessage('');
      load();
    } catch (err) {
      notify(errorMessage(err), 'error');
    } finally {
      setSending(false);
    }
  };

  // Runs an action (after an optional confirmation), shows the result and reloads the page data
  const act = async (question, action, after = load) => {
    if (question && !window.confirm(question)) return;
    setBusy(true);
    try {
      const res = await action();
      notify(res?.message || 'Done');
      after();
    } catch (err) {
      notify(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  const canRequest = requestStatus == null || ['REJECTED', 'LEFT', 'REMOVED'].includes(requestStatus);

  return (
    <div className="bg-black text-white min-h-screen flex flex-col pt-8">
      <main className="hero-bg-plan flex-grow py-16 px-4">
        <div className="container mx-auto max-w-5xl">
          {plan.coverImageUrl && (
            <div className="h-56 md:h-72 rounded-2xl overflow-hidden mb-8 fade-up border border-white/10">
              <img src={plan.coverImageUrl} alt={plan.destination} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 fade-up gap-4">
            <h1 className="text-4xl md:text-5xl font-bold gradient-text break-words">{plan.destination}</h1>
            <span className={`px-4 py-2 rounded-full text-white font-medium ${plan.planStatus === 'OPEN' ? 'bg-green-600' : 'bg-violet-600'}`}>
              {plan.planStatus}
            </span>
          </div>

          <div className="glass-detail p-8 mb-8 fade-up" style={{ animationDelay: '100ms' }}>
            <h2 className="text-2xl font-bold mb-6">Journey Overview</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <OverviewCard className="slide-in-left" icon="fas fa-calendar-alt" title="Travel Dates" note={length ? `${length} Days` : ''}>
                {formatDate(plan.startDate)} to {formatDate(plan.endDate)}
              </OverviewCard>
              <OverviewCard icon="fas fa-tag" title="Travel Interest" note="Your adventure focus">
                {plan.interest || '—'}
              </OverviewCard>
              <OverviewCard className="slide-in-right" icon="fas fa-clock" title="Plan Created" note="Your journey planning began">
                {formatDate(plan.createdAt)}
              </OverviewCard>
              <OverviewCard icon="fas fa-users" title="Travel Companions" note={plan.maxCompanions ? `Limit: ${plan.maxCompanions} companions` : 'No companion limit'}>
                {plan.maxCompanions ? capacityLabel({ ...plan, joinedCount }) : `${joinedCount} Traveler(s)`}
                {isOwner && joinedCount > 0 && (
                  <button type="button" onClick={() => setCompanionsOpen(true)} className="block mx-auto text-violet-400 hover:text-violet-300 text-sm mt-3">
                    <i className="fas fa-eye mr-1"></i> View All
                  </button>
                )}
              </OverviewCard>
            </div>
          </div>

          <div className="glass-detail p-8 mb-8 relative overflow-hidden fade-up" style={{ animationDelay: '200ms' }}>
            <h2 className="text-2xl font-bold mb-6">Your Itinerary Timeline</h2>
            <div className="pl-8 relative">
              <div className="timeline-line"></div>
              {days.length === 0 && (
                <div className="py-8 text-center text-gray-400">
                  <i className="fas fa-map-signs text-4xl mb-4 text-violet-500"></i>
                  <p>No itinerary details have been added yet.</p>
                </div>
              )}
              {days.map(([day, text]) => (
                <div key={day} className="mb-8 relative">
                  <div className="timeline-dot"></div>
                  <div className="day-card glass-detail p-6 ml-4">
                    <h3 className="text-xl font-semibold text-violet-300 mb-2">
                      Day {day}
                      <span className="text-sm text-gray-400 font-normal ml-2">{dayDate(plan.startDate, day)}</span>
                    </h3>
                    <div className="text-gray-300 whitespace-pre-line">{text}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="fade-edge"></div>
          </div>

          <div className="flex justify-center fade-up" style={{ animationDelay: '300ms' }}>
            {isOwner ? (
              <div className="flex flex-wrap justify-center gap-4">
                <Link to="/user/travel/myplans" className="px-6 py-3 border border-violet-600 text-violet-400 rounded-xl font-medium transition-all duration-300 hover:bg-violet-900 hover-glow">
                  <i className="fas fa-arrow-left mr-2"></i> Back to My Plans
                </Link>
                <Link to={`/user/travel/edit/${plan.travelId}`} className="bg-violet-600 hover:bg-violet-700 px-6 py-3 rounded-xl font-medium transition-all duration-300 hover-glow">
                  <i className="fas fa-edit mr-2"></i> Edit Plan
                </Link>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    act(
                      `Delete your plan to "${plan.destination}"? All join requests for it are deleted too. This cannot be undone.`,
                      async () => {
                        await travelApi.remove(plan.travelId);
                        return { message: 'Travel plan deleted' };
                      },
                      () => navigate('/user/travel/myplans'),
                    )
                  }
                  className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-xl font-medium transition-all duration-300 disabled:opacity-60"
                >
                  <i className="fas fa-trash-alt mr-2"></i> Delete Plan
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap justify-center gap-4">
                <Link to="/user/dashboard" className="px-6 py-3 border border-violet-600 text-violet-400 rounded-xl font-medium transition-all duration-300 hover:bg-violet-900 hover-glow">
                  <i className="fas fa-arrow-left mr-2"></i> Back to Dashboard
                </Link>
                {canRequest && joinBlockedReason && (
                  <button type="button" disabled className="bg-gray-700 cursor-not-allowed px-6 py-3 rounded-xl font-medium text-gray-300">
                    <i className={`${(JOIN_BLOCKED[joinBlockedReason] || JOIN_BLOCKED.CLOSED)[0]} mr-2`}></i>
                    {(JOIN_BLOCKED[joinBlockedReason] || JOIN_BLOCKED.CLOSED)[1]}
                  </button>
                )}
                {canRequest && !joinBlockedReason && (
                  <button type="button" onClick={() => setJoinOpen(true)} className="bg-violet-600 hover:bg-violet-700 px-6 py-3 rounded-xl font-medium transition-all duration-300 hover-glow">
                    <i className="fas fa-user-plus mr-2"></i> {requestStatus == null ? 'Join Plan' : 'Request Again'}
                  </button>
                )}
                {requestStatus === 'PENDING' && (
                  <>
                    <button type="button" disabled className="bg-yellow-600 cursor-not-allowed px-6 py-3 rounded-xl font-medium">
                      <i className="fas fa-clock mr-2"></i> Request Pending
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => act('Cancel your join request?', () => requestApi.cancel(requestId))}
                      className="px-6 py-3 rounded-xl font-medium border border-red-500/50 text-red-300 hover:bg-red-500/10 disabled:opacity-60"
                    >
                      <i className="fas fa-times mr-2"></i> Cancel Request
                    </button>
                  </>
                )}
                {requestStatus === 'ACCEPTED' && (
                  <>
                    <button type="button" disabled className="bg-green-600 cursor-not-allowed px-6 py-3 rounded-xl font-medium">
                      <i className="fas fa-check-circle mr-2"></i> Request Accepted
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => act('Leave this trip? The host will no longer count you as a companion.', () => travelApi.leave(plan.travelId))}
                      className="px-6 py-3 rounded-xl font-medium border border-red-500/50 text-red-300 hover:bg-red-500/10 disabled:opacity-60"
                    >
                      <i className="fas fa-sign-out-alt mr-2"></i> Leave Trip
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {!isOwner && owner && (
            <div className="glass-detail p-6 mb-4 mt-8 fade-up">
              <h2 className="text-2xl font-bold mb-4">Plan Created By</h2>
              <Link to={`/user/profile/${owner.userId}`} className="flex items-center group">
                <div className="w-12 h-12 rounded-full bg-violet-900 flex items-center justify-center mr-4 flex-shrink-0">
                  <Avatar src={owner.profilePic} className="w-full h-full object-cover rounded-full" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold group-hover:text-violet-300">{owner.name}</h3>
                  <p className="text-sm text-gray-400 truncate">View profile</p>
                </div>
              </Link>
            </div>
          )}
        </div>
      </main>

      <Modal open={joinOpen} onClose={() => setJoinOpen(false)}>
        <h2 className="text-2xl font-bold mb-4">Join This Travel Plan</h2>
        <p className="text-gray-300 mb-6">Send a request to the plan owner to join this adventure.</p>
        <form onSubmit={sendJoinRequest}>
          <div className="mb-4">
            <label htmlFor="joinMessage" className="block text-gray-300 mb-2">Why do you want to join? (Optional)</label>
            <textarea
              id="joinMessage"
              rows={4}
              maxLength={500}
              value={joinMessage}
              onChange={(e) => setJoinMessage(e.target.value)}
              className="w-full p-3 rounded bg-gray-800 text-white border border-gray-700 focus:border-violet-500 focus:ring focus:ring-violet-500/30 outline-none"
              placeholder="I'd love to join because..."
            ></textarea>
          </div>
          <div className="flex justify-end space-x-4">
            <button type="button" onClick={() => setJoinOpen(false)} className="px-4 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-800">
              Cancel
            </button>
            <button type="submit" disabled={sending} className="px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg text-white disabled:opacity-60">
              {sending ? 'Sending...' : 'Send Request'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={companionsOpen} onClose={() => setCompanionsOpen(false)}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Travel Companions</h2>
          <button type="button" aria-label="Close" className="text-gray-400 hover:text-white" onClick={() => setCompanionsOpen(false)}>
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
          {joinedUsers.length === 0 && (
            <div className="text-center text-gray-400 py-8"><p>No one has joined your travel plan yet.</p></div>
          )}
          {joinedUsers.map((user) => (
            <div key={user.userId} className="flex items-center p-3 glass-detail rounded-lg">
              <div className="w-10 h-10 rounded-full bg-violet-900 flex items-center justify-center mr-3 flex-shrink-0">
                <Avatar src={user.profilePic} className="w-full h-full object-cover rounded-full" />
              </div>
              <Link to={`/user/profile/${user.userId}`} className="flex-grow min-w-0 hover:text-violet-300">
                <h3 className="font-medium truncate">{user.name}</h3>
              </Link>
              <Link to={`/user/chat?userId=${user.userId}`} aria-label={`Message ${user.name}`} className="text-violet-400 hover:text-violet-300 mr-3">
                <i className="far fa-comment-dots"></i>
              </Link>
              <button
                type="button"
                disabled={busy}
                onClick={() => act(`Remove ${user.name} from this trip?`, () => travelApi.removeCompanion(plan.travelId, user.userId))}
                className="text-xs text-red-300 hover:text-red-200 disabled:opacity-60"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <div className="mt-6 text-center">
          <button type="button" className="px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg text-white" onClick={() => setCompanionsOpen(false)}>
            Close
          </button>
        </div>
      </Modal>
    </div>
  );
}

function OverviewCard({ icon, title, note, children, className = '' }) {
  return (
    <div className={className}>
      <div className="glass-detail p-6 h-full flex flex-col items-center justify-center text-center">
        <div className="p-3 rounded-full bg-violet-900 mb-4">
          <i className={`${icon} text-violet-300 text-2xl`}></i>
        </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <div className="text-gray-300">{children}</div>
        {note && <p className="text-sm text-gray-400 mt-2">{note}</p>}
      </div>
    </div>
  );
}
