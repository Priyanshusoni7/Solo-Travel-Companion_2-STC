import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { friendApi, messageApi, userApi } from '../api';
import { errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import useStomp from '../hooks/useStomp';
import Avatar from '../components/Avatar';
import { formatTime, locationOf } from '../utils/format';

/**
 * Private 1:1 chat between friends (was user/chat.html + static/js/chat.js).
 * Messages are sent over STOMP to /app/chat.privateMessage; the server persists them and
 * pushes them to both participants on /user/queue/messages.
 */
export default function Chat() {
  const { user: me } = useAuth();
  const [searchParams] = useSearchParams();
  const [friends, setFriends] = useState(null);
  const [filter, setFilter] = useState('');
  const [unread, setUnread] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const [recipient, setRecipient] = useState(null);
  const [messages, setMessages] = useState([]);
  const [conversationState, setConversationState] = useState('idle'); // idle | loading | ready | error
  const [conversationError, setConversationError] = useState('');
  const [draft, setDraft] = useState('');
  // relationship with a selected non-friend: { status, friendshipId } from /api/friends/status
  const [relation, setRelation] = useState(null);
  const selectedRef = useRef(null);
  const messageArea = useRef(null);

  selectedRef.current = selectedId;

  const handleIncoming = useCallback(
    (message) => {
      const current = selectedRef.current;
      if (message.senderId === me.userId && message.recipientId === current) {
        // Server confirmed one of our messages: replace the oldest pending bubble
        setMessages((list) => {
          const index = list.findIndex((m) => m.status === 'pending' && m.content === message.content);
          const pendingIndex = index >= 0 ? index : list.findIndex((m) => m.status === 'pending');
          if (pendingIndex < 0) return [...list, { ...message, status: 'sent' }];
          const next = [...list];
          next[pendingIndex] = { ...message, status: 'sent' };
          return next;
        });
      } else if (message.senderId === current && message.recipientId === me.userId) {
        setMessages((list) => [...list, message]);
        messageApi.markRead(message.id).catch(() => {});
      } else if (message.recipientId === me.userId) {
        setUnread((counts) => ({ ...counts, [message.senderId]: (counts[message.senderId] || 0) + 1 }));
      }
    },
    [me.userId],
  );

  const { connected, publish } = useStomp((client) => {
    client.subscribe('/user/queue/messages', (frame) => handleIncoming(JSON.parse(frame.body)));
    // initial unread badges
    messageApi
      .unread()
      .then((list) => {
        const counts = {};
        list.forEach((m) => {
          if (m.senderId !== selectedRef.current) counts[m.senderId] = (counts[m.senderId] || 0) + 1;
        });
        setUnread(counts);
      })
      .catch(() => {});
  });

  useEffect(() => {
    friendApi.list().then(setFriends).catch(() => setFriends([]));
  }, []);

  const selectFriend = useCallback(async (userId) => {
    setSelectedId(userId);
    setUnread((counts) => ({ ...counts, [userId]: 0 }));
    setMessages([]);
    setRelation(null);
    setConversationState('loading');
    setConversationError('');
    try {
      const [user, conversation] = await Promise.all([userApi.get(userId), messageApi.conversation(userId)]);
      if (selectedRef.current !== userId) return;
      setRecipient(user);
      setMessages(conversation);
      setConversationState('ready');
      conversation
        .filter((m) => m.senderId === userId && !m.read)
        .forEach((m) => messageApi.markRead(m.id).catch(() => {}));
    } catch (err) {
      if (selectedRef.current !== userId) return;
      userApi.get(userId).then(setRecipient).catch(() => setRecipient(null));
      setConversationError(errorMessage(err, 'Failed to load conversation'));
      setConversationState('error');
      // Explain why (not friends yet / request pending / blocked) instead of a raw error
      friendApi
        .status(userId)
        .then((rel) => {
          if (selectedRef.current === userId && rel.status !== 'FRIENDS') setRelation(rel);
        })
        .catch(() => {});
    }
  }, []);

  // Auto-select friend from ?userId=... (links from friends, requests, plan pages)
  useEffect(() => {
    const target = searchParams.get('userId');
    if (target) selectFriend(target);
  }, [searchParams, selectFriend]);

  useLayoutEffect(() => {
    if (messageArea.current) messageArea.current.scrollTop = messageArea.current.scrollHeight;
  }, [messages]);

  const send = (e) => {
    e.preventDefault();
    const content = draft.trim();
    if (!content || !selectedId) return;
    setDraft('');
    const ok = publish('/app/chat.privateMessage', { recipientId: selectedId, content });
    setMessages((list) => [
      ...list,
      {
        tempId: `temp-${Date.now()}`,
        senderId: me.userId,
        recipientId: selectedId,
        content,
        timestamp: new Date().toISOString(),
        status: ok ? 'pending' : 'failed',
      },
    ]);
  };

  const visibleFriends = (friends || []).filter((f) => {
    const q = filter.toLowerCase().trim();
    return !q || f.name?.toLowerCase().includes(q);
  });

  const sendFriendRequest = async () => {
    try {
      await friendApi.sendRequest(selectedId);
      setRelation({ status: 'PENDING_SENT' });
    } catch (err) {
      setConversationError(errorMessage(err));
    }
  };

  const acceptFriendRequest = async () => {
    try {
      await friendApi.accept(relation.friendshipId);
      const list = await friendApi.list();
      setFriends(list);
      selectFriend(selectedId);
    } catch (err) {
      setConversationError(errorMessage(err));
    }
  };

  let lastDate = '';

  return (
    <div className="chat-page text-white h-screen flex flex-col overflow-hidden">
      <main className="flex-grow pt-[60px] flex min-h-0">
        <div className="w-full h-full flex flex-row" style={{ background: 'rgba(10,10,20,0.85)', borderTop: '1px solid rgba(139,92,246,0.12)' }}>
          {/* Sidebar */}
          <div className={`chat-sidebar w-full md:w-80 md:min-w-[320px] ${selectedId ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-4 border-b border-violet-900/20 bg-black/20">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-white">Chats</h2>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-violet-300">
                  <span className={`connection-status ${connected ? 'connected' : 'disconnected'}`}></span>
                  <span>{connected ? 'Connected' : 'Connecting...'}</span>
                </div>
              </div>
              <div className="search-wrapper">
                <i className="fas fa-search"></i>
                <input
                  type="text"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Search friends..."
                  className="search-input-field"
                />
              </div>
            </div>

            <div className="flex-grow overflow-y-auto styled-scrollbar">
              {friends === null && (
                <div className="flex flex-col items-center py-10">
                  <div className="typing-indicator"><span></span><span></span><span></span></div>
                </div>
              )}
              {friends?.length === 0 && (
                <p className="text-xs text-gray-400 text-center p-6">No friends yet. Connect with travelers from the Friends page to start chatting.</p>
              )}
              <div className="divide-y divide-white/5">
                {visibleFriends.map((friend) => (
                  <button
                    key={friend.userId}
                    type="button"
                    onClick={() => selectFriend(friend.userId)}
                    className={`friend-item ${selectedId === friend.userId ? 'active' : ''}`}
                  >
                    <div className="avatar-container mr-3">
                      <Avatar src={friend.profilePic} className="avatar-image" />
                      <span className="status-badge online"></span>
                    </div>
                    <div className="flex-grow min-w-0">
                      <h6 className="font-semibold text-sm truncate">{friend.name}</h6>
                      <p className="text-xs text-violet-300/70 truncate">{locationOf(friend) || 'Traveler'}</p>
                    </div>
                    {unread[friend.userId] > 0 && <span className="unread-badge ml-2">{unread[friend.userId]}</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Chat window */}
          <div className={`flex-grow flex-col chat-window min-w-0 ${selectedId ? 'flex' : 'hidden md:flex'}`}>
            {!selectedId ? (
              <div className="empty-chat-state">
                <i className="far fa-comments empty-chat-icon"></i>
                <h3 className="text-xl font-bold text-violet-300 mb-1">Your conversations</h3>
                <p className="text-xs text-gray-400">Select a companion from the sidebar to view chat history and start messaging.</p>
              </div>
            ) : (
              <div className="h-full flex flex-col min-h-0">
                <div className="chat-header flex items-center justify-between">
                  <div className="flex items-center min-w-0">
                    <button type="button" aria-label="Back to chats" onClick={() => setSelectedId(null)} className="md:hidden mr-3 text-gray-300">
                      <i className="fas fa-arrow-left"></i>
                    </button>
                    <div className="relative mr-3 flex-shrink-0">
                      <Avatar src={recipient?.profilePic} className="w-10 h-10 rounded-full object-cover border border-violet-500" />
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-black"></span>
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm truncate">{recipient?.name || '...'}</h4>
                      <p className="text-xs text-violet-300/80 truncate max-w-[200px] md:max-w-md">
                        {recipient ? locationOf(recipient) || recipient.about || 'Online' : ''}
                      </p>
                    </div>
                  </div>
                </div>

                <div ref={messageArea} className="message-area">
                  {conversationState === 'loading' && (
                    <div className="flex justify-center items-center h-full">
                      <div className="typing-indicator"><span></span><span></span><span></span></div>
                    </div>
                  )}
                  {conversationState === 'error' && !relation && (
                    <div className="text-center text-violet-300 py-10">{conversationError}</div>
                  )}
                  {conversationState === 'error' && relation && (
                    <NotFriendsPanel
                      name={recipient?.name || 'this traveler'}
                      relation={relation}
                      onSendRequest={sendFriendRequest}
                      onAccept={acceptFriendRequest}
                    />
                  )}
                  {conversationState === 'ready' && messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full opacity-60">
                      <i className="far fa-comments text-5xl mb-3 text-violet-400"></i>
                      <p className="text-violet-200">No messages yet. Send a friendly hello!</p>
                    </div>
                  )}
                  {messages.map((msg) => {
                    const date = new Date(msg.timestamp);
                    const dateStr = date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
                    const showDivider = dateStr !== lastDate;
                    lastDate = dateStr;
                    const isSent = msg.senderId === me.userId;
                    return (
                      <div key={msg.id ?? msg.tempId} className="contents">
                        {showDivider && <div className="date-divider">{dateStr}</div>}
                        <div className={`message-row ${isSent ? 'sent' : 'received'}`}>
                          <div className="message-bubble">
                            <span className="message-content">{msg.content}</span>
                            <span className="message-time">
                              {formatTime(msg.timestamp)}
                              {msg.status === 'pending' && <i className="fas fa-clock text-[9px] opacity-60 ml-1"></i>}
                              {msg.status === 'sent' && <i className="fas fa-check text-[9px] text-green-400 ml-1"></i>}
                              {msg.status === 'failed' && <i className="fas fa-exclamation-circle text-red-500 ml-1" title="Not connected"></i>}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="composer-panel">
                  <form onSubmit={send} className="flex items-center gap-2">
                    <div className="flex-grow composer-input-wrapper flex items-center">
                      <textarea
                        rows={1}
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) send(e);
                        }}
                        placeholder="Write a message..."
                        className="composer-textarea styled-scrollbar"
                        disabled={conversationState === 'error'}
                      ></textarea>
                    </div>
                    <button type="submit" aria-label="Send message" disabled={conversationState === 'error'} className="composer-btn composer-send-btn disabled:opacity-40">
                      <i className="fas fa-paper-plane text-sm"></i>
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

/** Shown instead of an error when the selected traveler isn't a friend (only friends can chat). */
function NotFriendsPanel({ name, relation, onSendRequest, onAccept }) {
  const content = {
    NONE: {
      icon: 'fas fa-user-plus',
      text: `You and ${name} aren't friends yet. Send a friend request - once it's accepted you can chat here.`,
      action: { label: 'Send Friend Request', onClick: onSendRequest },
    },
    PENDING_SENT: {
      icon: 'fas fa-clock',
      text: `Friend request sent. You can chat as soon as ${name} accepts it.`,
    },
    PENDING_RECEIVED: {
      icon: 'fas fa-user-check',
      text: `${name} has sent you a friend request. Accept it to start chatting.`,
      action: { label: 'Accept Friend Request', onClick: onAccept },
    },
    BLOCKED: {
      icon: 'fas fa-ban',
      text: `You have blocked ${name}. Unblock them on the Friends page if you want to connect again.`,
    },
    BLOCKED_BY_OTHER: {
      icon: 'fas fa-ban',
      text: `You can't message ${name}.`,
    },
  }[relation.status] || { icon: 'fas fa-info-circle', text: 'You can only chat with friends.' };

  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6">
      <div className="w-16 h-16 rounded-full bg-violet-900/30 flex items-center justify-center mb-4">
        <i className={`${content.icon} text-2xl text-violet-300`}></i>
      </div>
      <p className="text-violet-100 max-w-sm">{content.text}</p>
      {content.action && (
        <button
          type="button"
          onClick={content.action.onClick}
          className="mt-5 bg-violet-600 hover:bg-violet-700 px-5 py-2.5 rounded-xl text-sm font-medium"
        >
          {content.action.label}
        </button>
      )}
    </div>
  );
}
