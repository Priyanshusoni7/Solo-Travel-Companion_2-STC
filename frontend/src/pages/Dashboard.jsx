import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { friendApi, travelApi, userApi } from '../api';
import { errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Footer from '../components/Footer';
import Loading from '../components/Loading';
import { INTERESTS } from '../components/TravelPlanForm';
import { capacityLabel, formatDate, isFull, itineraryEntries, splitInterests } from '../utils/format';

const PAGE_SIZE = 12;
const DEFAULT_FILTERS = { interest: '', from: '', to: '', openOnly: false, hideEnded: true };

const STATS = [
  ['1,200+', 'Active Explorers'],
  ['85+', 'Destinations Live'],
  ['350+', 'Active Trips'],
  ['24/7', 'Live Chat'],
];


/** Explore feed (was user/dashboard.html). */
export default function Dashboard() {
  const notify = useToast();
  const { user: me } = useAuth();
  const [plans, setPlans] = useState(null);
  const [pageInfo, setPageInfo] = useState(null);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [loadingMore, setLoadingMore] = useState(false);
  const [featured, setFeatured] = useState([]);
  const [loadError, setLoadError] = useState('');

  const [searchType, setSearchType] = useState('travelplan');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null); // null = show default feed
  const [searchError, setSearchError] = useState('');
  const [sentRequests, setSentRequests] = useState({});
  const debounce = useRef(null);

  useEffect(() => {
    userApi.featuredPackages().then(setFeatured).catch(() => setFeatured([]));
  }, []);

  const loadPlans = (pageNumber, activeFilters) => {
    const params = {
      page: pageNumber,
      size: PAGE_SIZE,
      openOnly: activeFilters.openOnly,
      hideEnded: activeFilters.hideEnded,
      ...(activeFilters.interest && { interest: activeFilters.interest }),
      ...(activeFilters.from && { from: activeFilters.from }),
      ...(activeFilters.to && { to: activeFilters.to }),
    };
    return travelApi.explore(params);
  };

  // (Re)load the first page whenever a filter changes
  useEffect(() => {
    let cancelled = false;
    setPlans(null);
    setLoadError('');
    loadPlans(0, filters)
      .then((res) => {
        if (cancelled) return;
        setPlans(res.content);
        setPageInfo(res.page);
      })
      .catch((err) => !cancelled && setLoadError(errorMessage(err, 'Could not load travel plans')));
    return () => {
      cancelled = true;
    };
  }, [filters]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const res = await loadPlans(pageInfo.number + 1, filters);
      setPlans((current) => [...current, ...res.content]);
      setPageInfo(res.page);
    } catch (err) {
      notify(errorMessage(err, 'Could not load more plans'), 'error');
    } finally {
      setLoadingMore(false);
    }
  };

  const setFilter = (field, value) => setFilters((current) => ({ ...current, [field]: value }));
  const filtersActive = JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS);
  const hasMore = pageInfo && pageInfo.number + 1 < pageInfo.totalPages;

  // Debounced search (400ms), same behaviour as the old keyup handler
  useEffect(() => {
    clearTimeout(debounce.current);
    const keyword = query.trim();
    if (!keyword) {
      setResults(null);
      setSearchError('');
      return undefined;
    }
    debounce.current = setTimeout(async () => {
      try {
        setSearchError('');
        const items = await userApi.search(keyword, searchType);
        // don't offer "Connect" with yourself
        setResults({ type: searchType, items: searchType === 'companion' ? items.filter((c) => c.userId !== me.userId) : items });
      } catch {
        setSearchError('Error loading search results');
      }
    }, 400);
    return () => clearTimeout(debounce.current);
  }, [query, searchType, me.userId]);

  const sendFriendRequest = async (userId) => {
    try {
      await friendApi.sendRequest(userId);
      setSentRequests((prev) => ({ ...prev, [userId]: true }));
    } catch (err) {
      notify(`Error sending request: ${errorMessage(err)}`, 'error');
    }
  };

  return (
    <div className="bg-explore text-white min-h-screen relative">
      <div className="ambient-glow-1"></div>
      <div className="ambient-glow-2"></div>

      <main className="container mx-auto px-4 lg:px-8 py-10 mt-16 relative z-10">
        <section className="max-w-5xl mx-auto mb-12">
          <div className="p-8 rounded-3xl bg-gradient-to-r from-violet-900/40 via-indigo-950/30 to-purple-950/20 border border-violet-500/25 relative overflow-hidden backdrop-blur-md">
            <div className="absolute -right-16 -top-16 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl"></div>
            <div className="absolute -left-16 -bottom-16 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl"></div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
              <div>
                <span className="text-xs uppercase tracking-widest text-violet-400 font-bold bg-violet-500/10 px-3 py-1 rounded-full border border-violet-500/20">
                  Explore Companion
                </span>
                <h1 className="text-3xl md:text-4xl font-extrabold text-white mt-3 mb-2 leading-tight">
                  Find Your Perfect{' '}
                  <span className="bg-gradient-to-r from-violet-400 to-indigo-300 bg-clip-text text-transparent">Travel Partner</span>
                </h1>
                <p className="text-gray-300 text-sm max-w-xl">
                  Connect with millions of solo travelers around the globe. Pitch itineraries, join packages, and discover shared experiences.
                </p>
              </div>
              <div className="flex-shrink-0">
                <Link to="/user/travel/post" className="action-btn px-6 py-3 rounded-2xl text-sm font-semibold transition duration-300 flex items-center gap-2">
                  <i className="fas fa-map-marked-alt text-lg"></i> Create Travel Plan
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-5xl mx-auto mb-10 grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map(([value, label]) => (
            <div key={label} className="stat-widget text-center">
              <div className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-indigo-300 bg-clip-text text-transparent">{value}</div>
              <div className="text-xs text-gray-400 mt-1">{label}</div>
            </div>
          ))}
        </section>

        <section className="sticky top-20 z-30 mb-10 max-w-3xl mx-auto">
          <div className="search-container">
            <div className="flex flex-row items-center gap-2">
              <select
                aria-label="Search type"
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                className="bg-white/5 border-0 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-violet-500 outline-none text-white cursor-pointer"
              >
                <option value="travelplan" className="bg-[#120e24]">Plans</option>
                <option value="companion" className="bg-[#120e24]">Companions</option>
              </select>
              <div className="relative flex-grow">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search destinations, interests..."
                  className="w-full px-4 pl-10 py-2.5 bg-transparent border-0 outline-none text-xs text-white"
                  autoComplete="off"
                />
                <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-violet-400 text-xs"></i>
              </div>
            </div>
          </div>
        </section>

        {!query.trim() && (
          <section className="mb-10 max-w-5xl mx-auto space-y-4">
            <div className="flex flex-wrap gap-2.5 justify-center">
              {[['', 'All Plans'], ...INTERESTS].map(([value, label]) => (
                <button
                  key={value || 'all'}
                  type="button"
                  onClick={() => setFilter('interest', value)}
                  className={`category-pill ${filters.interest === value ? 'active' : ''} px-4 py-2 rounded-full text-xs font-semibold`}
                >
                  {value === '' && <i className="fas fa-globe-asia mr-1.5"></i>}
                  {label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-gray-300">
              <label className="flex items-center gap-2">
                From
                <input type="date" value={filters.from} onChange={(e) => setFilter('from', e.target.value)} className="form-input px-2 py-1.5 rounded-lg" />
              </label>
              <label className="flex items-center gap-2">
                To
                <input type="date" value={filters.to} min={filters.from || undefined} onChange={(e) => setFilter('to', e.target.value)} className="form-input px-2 py-1.5 rounded-lg" />
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={filters.openOnly} onChange={(e) => setFilter('openOnly', e.target.checked)} />
                Open for companions only
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={filters.hideEnded} onChange={(e) => setFilter('hideEnded', e.target.checked)} />
                Hide ended trips
              </label>
              {filtersActive && (
                <button type="button" onClick={() => setFilters(DEFAULT_FILTERS)} className="text-violet-300 hover:text-violet-200 underline">
                  Clear filters
                </button>
              )}
            </div>
          </section>
        )}

        {featured.length > 0 && (
          <section className="max-w-5xl mx-auto mb-14">
            <h3 className="text-lg font-bold mb-4 px-2 flex items-center gap-2">
              <i className="fas fa-gem text-violet-400"></i> Featured Packages
            </h3>
            <div className="static-plans-slider">
              <div className="static-plans-track gap-4">
                {/* rendered twice for the infinite marquee */}
                {[...featured, ...featured].map((plan, i) => (
                  <FeaturedPackageCard key={`${plan.staticPlanId}-${i}`} plan={plan} />
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="max-w-5xl mx-auto">
          {searchError && <p className="text-red-500 text-center py-10">{searchError}</p>}

          {!searchError && results && (
            results.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 glass-card px-4 max-w-xl mx-auto">
                <i className="fas fa-search-minus text-4xl text-violet-400 mb-3 opacity-60"></i>
                <p className="text-white font-bold">No travel companions or plans found</p>
                <p className="text-xs text-gray-400 mt-1">Try another search keyword or check filter fields.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {results.type === 'companion'
                  ? results.items.map((companion) => (
                    <CompanionCard
                      key={companion.userId}
                      companion={companion}
                      requested={!!sentRequests[companion.userId]}
                      onConnect={() => sendFriendRequest(companion.userId)}
                    />
                  ))
                  : results.items.map((plan) => <TravelCard key={plan.travelId} plan={plan} />)}
              </div>
            )
          )}

          {!searchError && !results && (
            <>
              {loadError && <p className="text-red-500 text-center py-10">{loadError}</p>}
              {!loadError && plans === null && <Loading label="Loading travel plans..." />}
              {plans?.length === 0 && (
                <div className="text-center py-16 glass-card px-4 max-w-xl mx-auto">
                  <i className="fas fa-compass text-5xl text-violet-400 opacity-40 mb-4 animate-bounce"></i>
                  <h3 className="text-xl font-bold mb-1">{filtersActive ? 'No plans match these filters' : 'No plans available'}</h3>
                  <p className="text-xs text-gray-400 mb-5">
                    {filtersActive ? 'Try other filters or clear them.' : 'Try checking back later or create your own custom companion plan.'}
                  </p>
                  {filtersActive ? (
                    <button type="button" onClick={() => setFilters(DEFAULT_FILTERS)} className="action-btn px-5 py-2.5 rounded-xl text-xs font-semibold inline-block">
                      Clear filters
                    </button>
                  ) : (
                    <Link to="/user/travel/post" className="action-btn px-5 py-2.5 rounded-xl text-xs font-semibold inline-block">Post Plan</Link>
                  )}
                </div>
              )}
              {plans?.length > 0 && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {plans.map((plan) => <TravelCard key={plan.travelId} plan={plan} />)}
                  </div>
                  {hasMore && (
                    <div className="flex justify-center mt-10">
                      <button
                        type="button"
                        onClick={loadMore}
                        disabled={loadingMore}
                        className="action-btn-outline px-6 py-2.5 rounded-xl text-xs font-semibold disabled:opacity-60"
                      >
                        {loadingMore ? 'Loading...' : `Load more plans (${pageInfo.totalElements - plans.length} more)`}
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </section>
      </main>

      <Footer variant="explore" />
    </div>
  );
}

function FeaturedPackageCard({ plan }) {
  return (
    <div className="static-plan-card flex-none w-72">
      <div className="glass-card h-full flex flex-col">
        <div className="h-40 bg-purple-900/20 relative overflow-hidden">
          {plan.imageUrl ? (
            <img src={plan.imageUrl} alt={plan.destination} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-violet-950/20">
              <i className="fas fa-campground text-3xl text-violet-300"></i>
            </div>
          )}
          <div className="absolute top-3 right-3 bg-violet-600/90 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider">
            <span>{plan.planType}</span>
          </div>
        </div>
        <div className="p-5 flex-grow flex flex-col justify-between">
          <div>
            <h4 className="text-md font-bold truncate text-white">{plan.title}</h4>
            <p className="text-xs text-violet-300 flex items-center gap-1.5 mt-1 mb-2">
              <i className="fas fa-map-marker-alt"></i>
              <span>{plan.destination}</span>
            </p>
            <p className="text-xs text-gray-400 line-clamp-3">{plan.description}</p>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-gray-300 border-t border-white/5 pt-3">
              <span className="font-bold text-sm text-white">
                ₹{Number(plan.price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span>{plan.currentParticipants ?? 0}/{plan.maxParticipants ?? 0} joined</span>
            </div>
            <button type="button" className="action-btn w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 mt-3">
              <i className="fas fa-ticket-alt"></i> Book / Join Package
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TravelCard({ plan }) {
  const days = itineraryEntries(plan.dayItineraries);
  const full = isFull(plan);
  return (
    <div className="glass-card">
      {plan.coverImageUrl && (
        <div className="h-40 overflow-hidden">
          <img src={plan.coverImageUrl} alt={plan.destination} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-6">
        <div className="flex items-center gap-3.5 mb-4">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-md avatar-pulse flex-shrink-0">
            <i className="fas fa-user-circle text-xl text-white"></i>
          </div>
          <div className="flex-grow min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-white truncate">{plan.destination}</h3>
                <p className="text-[10px] text-violet-300 mt-0.5">{formatDate(plan.createdAt, 'dd MMM yyyy')}</p>
              </div>
              <span
                className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border whitespace-nowrap ${
                  full
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    : plan.planStatus === 'OPEN'
                      ? 'bg-green-500/10 border-green-500/20 text-green-400'
                      : 'bg-violet-600/10 border-violet-500/20 text-violet-300'
                }`}
              >
                {full ? 'FULL' : plan.planStatus}
              </span>
            </div>
          </div>
        </div>

        <div className="mb-4 text-xs text-violet-300 flex items-center gap-2 border-l-2 border-violet-500 pl-3">
          <i className="far fa-calendar-alt"></i>
          <span>
            {formatDate(plan.startDate, 'dd MMM')} - {formatDate(plan.endDate, 'dd MMM yyyy')}
          </span>
          <span className="ml-auto flex items-center gap-1 text-gray-300">
            <i className="fas fa-users text-violet-400"></i> {capacityLabel(plan)}
          </span>
        </div>

        <div className="text-xs text-gray-300 mb-5 line-clamp-3">
          {days.length === 0 ? (
            <p className="text-gray-500 italic">No daily itinerary posted.</p>
          ) : (
            <div>
              {days.slice(0, 2).map(([day, text]) => (
                <div key={day} className="mb-1">
                  <span className="font-bold text-violet-400">Day {day}:</span> <span>{text}</span>
                </div>
              ))}
              {days.length > 2 && (
                <div className="text-[10px] text-violet-300/80 font-semibold mt-1">+ {days.length - 2} more days itinerary...</div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 mb-6">
          {splitInterests(plan.interest).map((interest) => (
            <span key={interest} className="tag px-2.5 py-1 rounded-full text-[10px] flex items-center gap-1">
              <i className="fas fa-tag text-[8px]"></i>
              <span>{interest}</span>
            </span>
          ))}
        </div>

        <Link
          to={`/user/travel/public/view/${plan.travelId}`}
          className="action-btn w-full py-3 rounded-2xl text-xs font-semibold flex items-center justify-center gap-1.5"
        >
          <i className="fas fa-info-circle"></i> View Companion Details
        </Link>
      </div>
    </div>
  );
}

function CompanionCard({ companion, requested, onConnect }) {
  const status = [companion.city, companion.country].filter(Boolean).join(', ') || 'Exploring the world!';
  return (
    <div className="glass-card">
      <div className="p-6">
        <div className="flex items-center gap-3.5 mb-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-md avatar-pulse flex-shrink-0">
            <i className="fas fa-user-circle text-xl text-white"></i>
          </div>
          <div className="flex-grow min-w-0">
            <h3 className="text-lg font-bold text-white truncate">{companion.name}</h3>
            <Link to={`/user/profile/${companion.userId}`} className="text-[10px] text-violet-300 mt-0.5 hover:underline">View profile</Link>
          </div>
        </div>
        <p className="text-xs text-violet-200/90 border-l-2 border-violet-500 pl-3 mb-4">{status}</p>
        <p className="text-xs text-gray-400 line-clamp-3 mb-5">{companion.about || 'No profile bio provided.'}</p>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onConnect}
            disabled={requested}
            className="action-btn py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
          >
            {requested ? (
              <><i className="fas fa-check"></i> Request Sent</>
            ) : (
              <><i className="fas fa-user-plus"></i> Connect</>
            )}
          </button>
          <Link
            to={`/user/chat?userId=${companion.userId}`}
            className="action-btn-outline py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
          >
            <i className="far fa-comment-dots"></i> Message
          </Link>
        </div>
      </div>
    </div>
  );
}
