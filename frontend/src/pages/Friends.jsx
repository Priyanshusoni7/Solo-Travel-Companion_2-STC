import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { friendApi, userApi } from '../api';
import { errorMessage } from '../api/client';
import { useToast } from '../context/ToastContext';
import Avatar from '../components/Avatar';
import Footer from '../components/Footer';
import Loading from '../components/Loading';
import { locationOf } from '../utils/format';

/** Friends page (was user/friends.html + its jQuery AJAX handlers). */
export default function Friends() {
  const notify = useToast();
  const [friends, setFriends] = useState(null);
  const [pending, setPending] = useState([]);
  const [blocked, setBlocked] = useState([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [sent, setSent] = useState({});
  const searchInput = useRef(null);

  const load = useCallback(() => {
    friendApi.list().then(setFriends).catch((err) => {
      setFriends([]);
      notify(errorMessage(err, 'Could not load friends'), 'error');
    });
    friendApi.pending().then(setPending).catch(() => setPending([]));
    friendApi.blocked().then(setBlocked).catch(() => setBlocked([]));
  }, [notify]);

  useEffect(load, [load]);

  const search = async (e) => {
    e?.preventDefault();
    const keyword = query.trim();
    if (keyword.length < 2) {
      notify('Please enter at least 2 characters', 'info');
      return;
    }
    try {
      setResults(await userApi.search(keyword, 'friend'));
    } catch (err) {
      notify(`Search failed: ${errorMessage(err)}`, 'error');
    }
  };

  const sendRequest = async (userId) => {
    try {
      await friendApi.sendRequest(userId);
      setSent((prev) => ({ ...prev, [userId]: true }));
      notify('Friend request sent successfully!');
    } catch (err) {
      notify(`Error: ${errorMessage(err)}`, 'error');
    }
  };

  const accept = async (friendshipId) => {
    try {
      await friendApi.accept(friendshipId);
      notify('Friend request accepted!');
      load();
    } catch (err) {
      notify(`Error: ${errorMessage(err)}`, 'error');
    }
  };

  const reject = async (friendshipId) => {
    try {
      await friendApi.reject(friendshipId);
      notify('Friend request declined', 'info');
      setPending((list) => list.filter((r) => r.friendshipId !== friendshipId));
    } catch (err) {
      notify(`Error: ${errorMessage(err)}`, 'error');
    }
  };

  const block = async (userId) => {
    if (!window.confirm('Are you sure you want to block this user? They will be removed from your friends list.')) return;
    try {
      await friendApi.block(userId);
      notify('User has been blocked', 'info');
      load();
    } catch (err) {
      notify(`Error: ${errorMessage(err)}`, 'error');
    }
  };

  const unfriend = async (friend) => {
    if (!window.confirm(`Remove ${friend.name} from your friends? You will no longer be able to message each other.`)) return;
    try {
      await friendApi.unfriend(friend.userId);
      notify('Friend removed', 'info');
      setFriends((list) => list.filter((f) => f.userId !== friend.userId));
    } catch (err) {
      notify(`Error: ${errorMessage(err)}`, 'error');
    }
  };

  const unblock = async (user) => {
    if (!window.confirm(`Unblock ${user.name}? You can then send each other friend requests again.`)) return;
    try {
      await friendApi.unblock(user.userId);
      notify('User unblocked');
      setBlocked((list) => list.filter((u) => u.userId !== user.userId));
    } catch (err) {
      notify(`Error: ${errorMessage(err)}`, 'error');
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 min-h-screen text-white flex flex-col">
      <main className="container mx-auto px-4 py-8 space-y-8 mt-16 flex-grow">
        <section className="max-w-3xl mx-auto glass-friends p-6 slide-in">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-violet-300 flex items-center gap-2">
              <i className="fas fa-search text-violet-400"></i>
              Find Travel Companions
            </h2>
            <form onSubmit={search} className="flex gap-4">
              <input
                ref={searchInput}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 min-w-0 bg-black/30 border border-violet-500/30 rounded-lg px-4 py-2 focus:border-violet-400 focus:ring focus:ring-violet-400/20 outline-none transition-all duration-300"
                placeholder="Search by name or email..."
              />
              <button type="submit" className="bg-violet-600 hover:bg-violet-700 px-6 py-2 rounded-lg transition-colors duration-300 flex items-center gap-2">
                <i className="fas fa-compass"></i>
                Explore
              </button>
            </form>

            {results && (
              <div className="space-y-3 slide-in">
                {results.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <i className="fas fa-search-minus text-3xl mb-2"></i>
                    <p>No travelers found matching your search.</p>
                  </div>
                ) : (
                  results.map((user) => (
                    <div key={user.userId} className="bg-black/20 rounded-lg p-4 flex items-center justify-between gap-3 hover-transform">
                      <Link to={`/user/profile/${user.userId}`} className="flex items-center gap-4 min-w-0">
                        <div className="w-12 h-12 rounded-full bg-violet-600/30 flex items-center justify-center overflow-hidden flex-shrink-0">
                          <Avatar src={user.profilePic} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-semibold block truncate">{user.name}</span>
                          <span className="text-xs text-gray-400 block truncate">{locationOf(user) || 'Traveler'}</span>
                        </div>
                      </Link>
                      <button
                        type="button"
                        disabled={!!sent[user.userId]}
                        onClick={() => sendRequest(user.userId)}
                        className={`${sent[user.userId] ? 'bg-gray-600' : 'bg-violet-600 hover:bg-violet-700'} px-4 py-2 rounded-lg transition-colors duration-300 flex items-center gap-2 flex-shrink-0`}
                      >
                        {sent[user.userId] ? (
                          <><i className="fas fa-check"></i> Request Sent</>
                        ) : (
                          <><i className="fas fa-user-plus"></i> Connect</>
                        )}
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </section>

        {pending.length > 0 && (
          <section className="max-w-3xl mx-auto glass-friends slide-in">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-violet-300 mb-4 flex items-center gap-2">
                <i className="fas fa-user-clock text-violet-400"></i>
                Pending Requests
              </h2>
              <div className="space-y-4">
                {pending.map((request) => (
                  <div key={request.friendshipId} className="bg-black/20 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover-transform">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-12 h-12 rounded-full bg-violet-600/30 flex items-center justify-center overflow-hidden flex-shrink-0">
                        <Avatar src={request.sender.profilePic} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold truncate">{request.sender.name}</h3>
                        <p className="text-sm text-gray-400 truncate">Wants to connect</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button type="button" onClick={() => accept(request.friendshipId)} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors duration-300 flex items-center gap-2">
                        <i className="fas fa-check"></i>
                        Accept
                      </button>
                      <button type="button" onClick={() => reject(request.friendshipId)} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors duration-300 flex items-center gap-2">
                        <i className="fas fa-times"></i>
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="max-w-7xl mx-auto glass-friends slide-in">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-violet-300 mb-6 flex items-center gap-2">
              <i className="fas fa-users text-violet-400"></i>
              Your Travel Network
            </h2>

            {friends === null && <Loading />}

            {friends?.length === 0 && (
              <div className="text-center py-12 space-y-4">
                <div className="w-20 h-20 mx-auto bg-violet-600/20 rounded-full flex items-center justify-center">
                  <i className="fas fa-user-plus text-3xl text-violet-400"></i>
                </div>
                <h3 className="text-xl font-semibold text-violet-300">Start Your Travel Network</h3>
                <p className="text-gray-400 max-w-md mx-auto">Connect with fellow travelers, share experiences, and plan adventures together!</p>
                <button
                  type="button"
                  onClick={() => searchInput.current?.focus()}
                  className="mt-4 bg-violet-600 hover:bg-violet-700 px-6 py-3 rounded-lg transition-colors duration-300"
                >
                  Explore Travelers
                </button>
              </div>
            )}

            {friends?.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {friends.map((friend) => (
                  <div key={friend.userId} className="glass-friends hover-transform p-6 flex flex-col">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 rounded-full bg-violet-600/30 flex items-center justify-center overflow-hidden flex-shrink-0">
                        <Avatar src={friend.profilePic} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-lg text-violet-300 truncate">{friend.name}</h3>
                        {locationOf(friend) && (
                          <p className="text-sm text-gray-400 truncate">
                            <i className="fas fa-map-marker-alt"></i> {locationOf(friend)}
                          </p>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-300 mb-4 line-clamp-3 flex-grow">{friend.about}</p>
                    <div className="flex gap-3">
                      <Link
                        to={`/user/profile/${friend.userId}`}
                        className="flex-1 bg-violet-600 hover:bg-violet-700 px-3 py-2 rounded-lg transition-colors duration-300 text-center flex items-center justify-center gap-2"
                      >
                        <i className="fas fa-user"></i>
                        Profile
                      </Link>
                      <Link
                        to={`/user/chat?userId=${friend.userId}`}
                        className="flex-1 border border-violet-600 hover:bg-violet-600/20 px-3 py-2 rounded-lg transition-colors duration-300 text-center flex items-center justify-center gap-2"
                      >
                        <i className="fas fa-comment"></i>
                        Message
                      </Link>
                    </div>
                    <div className="flex gap-3 mt-3 text-xs">
                      <button
                        type="button"
                        onClick={() => unfriend(friend)}
                        className="flex-1 px-3 py-1.5 border border-white/15 hover:bg-white/5 rounded-lg transition-colors duration-300 flex items-center justify-center gap-2 text-gray-300"
                      >
                        <i className="fas fa-user-minus"></i>
                        Unfriend
                      </button>
                      <button
                        type="button"
                        onClick={() => block(friend.userId)}
                        className="flex-1 px-3 py-1.5 bg-red-600/80 hover:bg-red-700 rounded-lg transition-colors duration-300 flex items-center justify-center gap-2"
                      >
                        <i className="fas fa-ban"></i>
                        Block
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
        {blocked.length > 0 && (
          <section className="max-w-3xl mx-auto glass-friends slide-in">
            <div className="p-6">
              <h2 className="text-xl font-bold text-violet-300 mb-4 flex items-center gap-2">
                <i className="fas fa-ban text-red-400"></i>
                Blocked Users
              </h2>
              <div className="space-y-3">
                {blocked.map((user) => (
                  <div key={user.userId} className="bg-black/20 rounded-lg p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-violet-600/30 flex-shrink-0">
                        <Avatar src={user.profilePic} className="w-full h-full object-cover" />
                      </div>
                      <span className="font-semibold truncate">{user.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => unblock(user)}
                      className="px-4 py-1.5 rounded-lg border border-violet-500/40 hover:bg-violet-600/20 text-sm flex-shrink-0"
                    >
                      Unblock
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
