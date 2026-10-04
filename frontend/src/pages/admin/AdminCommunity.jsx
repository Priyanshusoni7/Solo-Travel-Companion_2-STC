import { useCallback, useEffect, useState } from 'react';
import { adminApi } from '../../api';
import { errorMessage } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import Loading from '../../components/Loading';
import Pagination from '../../components/Pagination';

/** Moderation of the public community chat (newest first). */
export default function AdminCommunity() {
  const notify = useToast();
  const [pageNumber, setPageNumber] = useState(0);
  const [result, setResult] = useState(null);

  const load = useCallback(() => {
    adminApi
      .communityMessages({ page: pageNumber, size: 30 })
      .then(setResult)
      .catch((err) => notify(errorMessage(err, 'Could not load messages'), 'error'));
  }, [pageNumber, notify]);

  useEffect(load, [load]);

  const remove = async (message) => {
    if (!window.confirm('Delete this community message? This cannot be undone.')) return;
    try {
      await adminApi.deleteCommunityMessage(message.id);
      notify('Message deleted');
      load();
    } catch (err) {
      notify(errorMessage(err), 'error');
    }
  };

  return (
    <div className="glass-panel p-6 fade-up">
      <h2 className="text-xl font-bold flex items-center gap-2 mb-1">
        <i className="fas fa-comments text-violet-400"></i> Community Messages
      </h2>
      <p className="text-xs text-gray-400 mb-6">
        Deleted messages disappear from the community history. Users who already have the chat open keep seeing them until they reload.
      </p>

      {!result && <Loading />}
      {result?.content.length === 0 && <p className="text-center text-gray-400 py-10 text-sm">No community messages yet.</p>}

      <ul className="divide-y divide-white/5">
        {result?.content.map((message) => (
          <li key={message.id} className="py-3 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-xs">
                <span className="font-bold text-violet-300">{message.senderName}</span>{' '}
                <span className="text-gray-500">{message.senderEmail}</span>{' '}
                <span className="text-gray-500">· {new Date(message.timestamp).toLocaleString()}</span>
              </div>
              <p className="text-sm text-gray-200 mt-1 break-words whitespace-pre-wrap">{message.content}</p>
            </div>
            <button
              type="button"
              onClick={() => remove(message)}
              aria-label="Delete message"
              className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-red-600/80 hover:bg-red-700 text-white flex-shrink-0"
            >
              <i className="fas fa-trash-alt mr-1"></i> Delete
            </button>
          </li>
        ))}
      </ul>

      <Pagination page={result?.page} onChange={setPageNumber} />
    </div>
  );
}
