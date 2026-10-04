import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { messageApi } from '../api';
import { useAuth } from '../context/AuthContext';
import useStomp from '../hooks/useStomp';
import Footer from '../components/Footer';
import { formatTime } from '../utils/format';

const PAGE_SIZE = 50;
let nextKey = 0;
const withKey = (item) => ({ ...item, key: `m${nextKey++}` });

/** Renders URLs as links without injecting HTML (the old main.js used innerHTML). */
function Linkified({ text }) {
  const parts = (text || '').split(/(https?:\/\/[^\s]+)/g);
  return parts.map((part, i) =>
    /^https?:\/\//.test(part) ? (
      <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="underline text-cyan-300 hover:text-cyan-200 break-all">
        {part}
      </a>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

/** Public community chat room (was user/community.html + static/js/main.js). */
export default function Community() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [activeUsers, setActiveUsers] = useState(() => new Set([user.userId]));
  const [draft, setDraft] = useState('');
  const container = useRef(null);
  const scrollMode = useRef({ type: 'bottom' });

  const loadHistory = useCallback(async (pageToLoad) => {
    try {
      const history = await messageApi.community(pageToLoad, PAGE_SIZE);
      setHasMore(history.length >= PAGE_SIZE);
      const loaded = history.map((m) => withKey({ kind: 'chat', ...m }));
      if (pageToLoad === 0) {
        scrollMode.current = { type: 'bottom' };
        // keep any live messages that arrived while history was loading
        setItems((current) => [...loaded, ...current.filter((i) => i.kind === 'event' || i.isNew)]);
      } else {
        scrollMode.current = { type: 'keep', height: container.current?.scrollHeight || 0 };
        setItems((current) => [...loaded, ...current]);
      }
    } catch {
      setHasMore(false);
    }
  }, []);

  useEffect(() => {
    loadHistory(0);
  }, [loadHistory]);

  const { connected, error, publish } = useStomp((client) => {
    client.subscribe('/topic/public', (frame) => {
      const message = JSON.parse(frame.body);
      scrollMode.current = { type: 'bottom' };
      if (message.type === 'JOIN' || message.type === 'LEAVE') {
        const joined = message.type === 'JOIN';
        setActiveUsers((set) => {
          const next = new Set(set);
          if (joined) next.add(message.sender);
          else next.delete(message.sender);
          return next;
        });
        setItems((list) => [
          ...list,
          withKey({ kind: 'event', text: `${message.senderName || 'A traveler'} ${joined ? 'joined' : 'left'} the chat` }),
        ]);
      } else {
        setItems((list) => [...list, withKey({ kind: 'chat', isNew: true, ...message })]);
      }
    });
    client.publish({ destination: '/app/chat.addUser', body: JSON.stringify({ type: 'JOIN' }) });
  });

  useLayoutEffect(() => {
    const el = container.current;
    if (!el) return;
    if (scrollMode.current.type === 'keep') {
      el.scrollTop = el.scrollHeight - scrollMode.current.height;
    } else {
      el.scrollTop = el.scrollHeight;
    }
  }, [items]);

  const send = (e) => {
    e.preventDefault();
    const content = draft.trim();
    if (!content) return;
    if (publish('/app/chat.sendMessage', { content, type: 'CHAT' })) setDraft('');
  };

  const loadOlder = () => {
    const next = page + 1;
    setPage(next);
    loadHistory(next);
  };

  return (
    <div className="hero-bg-app text-white min-h-screen flex flex-col pt-8">
      <div className="container mx-auto px-4 mt-16 mb-8 flex-grow flex flex-col">
        <div className="glass-morphism rounded-2xl overflow-hidden flex-grow flex flex-col fade-up">
          <div className="p-3 border-b border-violet-900/30 flex justify-between items-center bg-black/30 gap-3">
            <div className="flex items-center min-w-0">
              <h2 className="text-xl font-bold text-gradient whitespace-nowrap">
                <i className="fas fa-comments mr-2"></i>
                Community
              </h2>
              <div className="ml-3 px-3 py-1 bg-violet-900/30 rounded-full text-xs text-violet-300 flex items-center whitespace-nowrap">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                <span>{activeUsers.size} Online</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/user/profile')}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white flex items-center transition-all duration-300"
            >
              <i className="fas fa-arrow-left mr-2"></i> Back
            </button>
          </div>

          {!connected && (
            <div
              className={`text-center py-1 flex items-center justify-center text-sm ${error ? 'bg-red-500/20 text-red-300' : 'bg-violet-600/20 text-violet-300'}`}
            >
              {error ? (
                'Could not connect to WebSocket server. Retrying...'
              ) : (
                <>
                  <div className="typing-indicator mr-2"><span></span><span></span><span></span></div>
                  Connecting to chat...
                </>
              )}
            </div>
          )}

          <div ref={container} className="flex-grow p-4 overflow-y-auto styled-scrollbar" style={{ maxHeight: '70vh', minHeight: '50vh' }}>
            {hasMore && (
              <div className="flex justify-center mb-4">
                <button
                  type="button"
                  onClick={loadOlder}
                  className="px-4 py-2 text-xs font-semibold rounded-full bg-violet-900/40 hover:bg-violet-900/60 text-violet-300 transition-all duration-300 flex items-center border border-violet-800/30"
                >
                  <i className="fas fa-history mr-2"></i> Load older messages
                </button>
              </div>
            )}
            <ul className="space-y-4">
              {items.map((item) =>
                item.kind === 'event' ? (
                  <li key={item.key} className="flex justify-center mb-4 new-message">
                    <div className="px-4 py-2 rounded-full bg-violet-900/20 text-violet-300 text-sm">
                      <i className="fas fa-info-circle mr-2"></i>
                      {item.text}
                    </div>
                  </li>
                ) : (
                  <ChatLine key={item.key} message={item} own={item.sender === user.userId} />
                ),
              )}
            </ul>
          </div>

          <form onSubmit={send} className="p-3 border-t border-violet-900/30 bg-black/30">
            <div className="flex items-center">
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Type a message..."
                autoComplete="off"
                className="flex-grow min-w-0 py-2 px-4 bg-gray-900/70 focus:bg-gray-900/90 text-white rounded-l-lg border-0 focus:ring-2 focus:ring-violet-500 outline-none transition-all duration-300"
              />
              <button
                type="submit"
                disabled={!connected}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white px-5 py-2 rounded-r-lg flex items-center transition-all duration-300 disabled:opacity-60"
              >
                <i className="fas fa-paper-plane mr-2"></i>
                Send
              </button>
            </div>
          </form>
        </div>
      </div>

      <Footer variant="brand" compact />
    </div>
  );
}

function ChatLine({ message, own }) {
  const time = formatTime(message.timestamp);
  const displayName = message.senderName || 'Traveler';
  return (
    <li className={`flex ${own ? 'justify-end' : 'justify-start'} mb-4 ${message.isNew ? 'new-message' : ''}`}>
      <div className="max-w-xs md:max-w-md">
        {!own && (
          <div className="flex items-center mb-1">
            <div className="w-6 h-6 rounded-full bg-indigo-800 flex items-center justify-center text-xs font-bold mr-2">
              {(displayName || '?').charAt(0).toUpperCase()}
            </div>
            <span className="text-sm text-violet-300">{displayName}</span>
          </div>
        )}
        <div
          className={`community-bubble px-4 py-3 rounded-xl text-white shadow-md break-words ${
            own ? 'bg-gradient-to-r from-violet-600 to-violet-700' : 'bg-gradient-to-r from-indigo-700 to-indigo-800'
          }`}
        >
          <Linkified text={message.content} />
        </div>
        <div className={`${own ? 'text-right' : 'text-left'} mt-1 text-xs text-gray-400`}>{time}</div>
      </div>
    </li>
  );
}
