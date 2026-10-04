import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../api';
import { errorMessage } from '../api/client';
import Avatar from '../components/Avatar';
import Footer from '../components/Footer';
import Loading from '../components/Loading';
import { formatDate, locationOf } from '../utils/format';

/**
 * /user/profile          -> the logged-in user's profile
 * /user/profile/:userId  -> another traveler's public profile (no e-mail / phone)
 * Numbers and upcoming trips come from GET /api/users/{id}/stats.
 */
export default function Profile() {
  const { userId } = useParams();
  const { user: me } = useAuth();
  const isOwn = !userId || userId === me?.userId;
  const [other, setOther] = useState(null);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  const profileId = isOwn ? me?.userId : userId;

  useEffect(() => {
    if (isOwn) return;
    setOther(null);
    setError('');
    userApi.get(userId).then(setOther).catch((err) => setError(errorMessage(err, 'User not found')));
  }, [userId, isOwn]);

  useEffect(() => {
    if (!profileId) return;
    setStats(null);
    userApi.stats(profileId).then(setStats).catch(() => setStats({ tripsCreated: 0, tripsJoined: 0, friends: 0, upcomingTrips: [] }));
  }, [profileId]);

  const user = isOwn ? me : other;

  if (!isOwn && error) {
    return (
      <div className="hero-bg-app text-white min-h-screen flex items-center justify-center pt-24 px-4">
        <div className="glass-morphism rounded-2xl p-10 text-center">
          <p className="text-gray-300 mb-4">{error}</p>
          <Link to="/user/friends" className="text-violet-400 hover:text-violet-300">Back to friends</Link>
        </div>
      </div>
    );
  }
  if (!user) return <Loading fullScreen />;

  const statItems = [
    ['fas fa-route', 'Trips Hosted', stats?.tripsCreated],
    ['fas fa-suitcase-rolling', 'Trips Joined', stats?.tripsJoined],
    ['fas fa-users', 'Friends', stats?.friends],
  ];

  return (
    <div className="hero-bg-app text-white min-h-screen flex flex-col">
      <div className="mt-24"></div>

      <div className="container mx-auto px-4 mb-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left column */}
          <div className="w-full lg:w-1/3 space-y-6">
            <div className="glass-morphism rounded-2xl overflow-hidden card-hover fade-up">
              <div className="h-32 bg-gradient-to-r from-violet-600 to-indigo-600 bubble-animation"></div>
              <div className="px-6 pb-6 pt-0 relative">
                <div className="flex justify-between items-start">
                  <div className="relative -mt-16 group">
                    <div className="w-32 h-32 rounded-xl bg-gradient-to-r from-violet-500 via-purple-600 to-cyan-500 p-1.5 shadow-lg">
                      <div className="w-full h-full rounded-lg overflow-hidden bg-gray-800 relative">
                        <Avatar
                          src={user.profilePic}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 px-4 py-1.5 bg-violet-800/50 rounded-full text-sm font-medium flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                    <span>{user.role === 'ADMIN' ? 'Administrator' : 'Active Explorer'}</span>
                  </div>
                </div>

                <h2 className="text-2xl font-bold mt-4 text-gradient">{user.name}</h2>
                {locationOf(user) && (
                  <p className="text-sm text-gray-400 mt-1">
                    <i className="fas fa-map-marker-alt mr-1"></i>
                    {locationOf(user)}
                  </p>
                )}

                <div className="flex mt-4 gap-2">
                  {isOwn ? (
                    <Link
                      to="/user/profile/edit"
                      className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-center py-2 rounded-lg transition-all duration-300 text-sm font-medium"
                    >
                      <i className="fas fa-edit mr-1"></i> Edit Profile
                    </Link>
                  ) : (
                    <Link
                      to={`/user/chat?userId=${user.userId}`}
                      className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-center py-2 rounded-lg transition-all duration-300 text-sm font-medium"
                    >
                      <i className="fas fa-comment mr-1"></i> Message
                    </Link>
                  )}
                  <Link
                    to="/user/friends"
                    className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-center py-2 rounded-lg transition-all duration-300 text-sm font-medium"
                  >
                    <i className="fas fa-user-plus mr-1"></i> Find Friends
                  </Link>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 fade-up" style={{ animationDelay: '200ms' }}>
              {statItems.map(([icon, label, value]) => (
                <div key={label} className="glass-morphism rounded-xl p-4 text-center card-hover">
                  <div className="w-12 h-12 bg-gradient-glow rounded-full flex items-center justify-center mx-auto mb-2">
                    <i className={`${icon} text-xl text-white`}></i>
                  </div>
                  <span className="text-2xl font-bold text-white tabular-nums">{value ?? '–'}</span>
                  <p className="text-xs text-gray-400 mt-1">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right column */}
          <div className="w-full lg:w-2/3 space-y-6">
            <div className="glass-morphism rounded-2xl p-6 card-hover fade-up" style={{ animationDelay: '200ms' }}>
              <h3 className="text-xl font-semibold text-gradient mb-4">About Me</h3>
              <p className="text-gray-300 leading-relaxed whitespace-pre-line">{user.about || 'No bio provided yet.'}</p>
            </div>

            <div className="glass-morphism rounded-2xl p-6 card-hover fade-up" style={{ animationDelay: '300ms' }}>
              <h3 className="text-lg font-semibold text-gradient mb-4">Personal Details</h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {isOwn && <DetailRow icon="fas fa-envelope" label="Email" value={user.email} />}
                {isOwn && <DetailRow icon="fas fa-phone" label="Phone" value={user.phoneNumber || 'Not provided'} />}
                <DetailRow icon="fas fa-map-marker-alt" label="Location" value={locationOf(user) || 'Not provided'} />
                <DetailRow icon="fas fa-language" label="Language" value={user.language || 'Not provided'} />
                {user.gender && <DetailRow icon="fas fa-venus-mars" label="Gender" value={user.gender} />}
              </ul>
            </div>

            <div className="glass-morphism rounded-2xl p-6 card-hover fade-up" style={{ animationDelay: '400ms' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gradient">Upcoming Trips</h3>
                {isOwn && (
                  <Link to="/user/travel/myplans" className="text-violet-400 hover:text-violet-300 flex items-center">
                    View All <i className="fas fa-chevron-right ml-2 text-xs"></i>
                  </Link>
                )}
              </div>

              {!stats && <Loading />}

              {stats?.upcomingTrips.length === 0 && (
                <div className="flex items-center justify-center py-8 text-center">
                  <div>
                    <div className="w-20 h-20 rounded-full bg-violet-900/20 mx-auto flex items-center justify-center">
                      <i className="fas fa-plane text-3xl text-violet-400"></i>
                    </div>
                    <p className="mt-4 text-gray-300">No upcoming trips found</p>
                    {isOwn && (
                      <Link
                        to="/user/travel/post"
                        className="mt-3 inline-block px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-lg text-white text-sm font-medium"
                      >
                        Plan a Trip
                      </Link>
                    )}
                  </div>
                </div>
              )}

              {stats?.upcomingTrips.length > 0 && (
                <ul className="space-y-3">
                  {stats.upcomingTrips.map(({ role, plan }) => (
                    <li key={`${role}-${plan.travelId}`}>
                      <Link
                        to={`/user/travel/public/view/${plan.travelId}`}
                        className="flex items-center gap-4 p-3 rounded-xl bg-black/20 border border-violet-900/20 hover:border-violet-500/40 transition"
                      >
                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-violet-900/40 flex items-center justify-center flex-shrink-0">
                          {plan.coverImageUrl ? (
                            <img src={plan.coverImageUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <i className="fas fa-map-marked-alt text-violet-300"></i>
                          )}
                        </div>
                        <div className="min-w-0 flex-grow">
                          <p className="font-semibold truncate">{plan.destination}</p>
                          <p className="text-xs text-violet-300">
                            {formatDate(plan.startDate, 'MMM dd')} - {formatDate(plan.endDate)}
                          </p>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                            role === 'HOST' ? 'bg-violet-500/15 border-violet-500/30 text-violet-300' : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                          }`}
                        >
                          {role === 'HOST' ? 'HOSTING' : 'JOINED'}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-6 right-6 lg:hidden z-10">
        <Link
          to="/user/friends"
          aria-label="Friends"
          className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 shadow-lg text-white transform transition hover:scale-110"
        >
          <i className="fas fa-users text-xl"></i>
        </Link>
      </div>

      <Footer variant="brand" />
    </div>
  );
}

function DetailRow({ icon, label, value }) {
  return (
    <li className="flex items-center p-2 rounded-lg hover:bg-violet-900/10 transition-colors duration-200">
      <div className="w-8 h-8 rounded-lg bg-violet-900/50 flex items-center justify-center flex-shrink-0">
        <i className={`${icon} text-cyan-400`}></i>
      </div>
      <div className="ml-3 min-w-0">
        <p className="text-sm text-gray-400">{label}</p>
        <p className="text-white font-medium truncate">{value}</p>
      </div>
    </li>
  );
}
