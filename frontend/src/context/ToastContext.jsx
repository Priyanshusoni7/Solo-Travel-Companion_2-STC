import { createContext, useCallback, useContext, useRef, useState } from 'react';

const ToastContext = createContext(null);

const STYLES = {
  success: { bg: 'bg-green-600/90 border-green-500/30', icon: 'fa-check-circle' },
  error: { bg: 'bg-red-600/90 border-red-500/30', icon: 'fa-exclamation-circle' },
  info: { bg: 'bg-blue-600/90 border-blue-500/30', icon: 'fa-info-circle' },
};

/** Replaces the old flash attributes / jQuery showNotification() helper. */
export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);

  const notify = useCallback((message, type = 'success') => {
    clearTimeout(timer.current);
    setToast({ message, type, id: Date.now() });
    timer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  const style = toast ? STYLES[toast.type] || STYLES.info : null;

  return (
    <ToastContext.Provider value={notify}>
      {children}
      {toast && (
        <div
          key={toast.id}
          role="status"
          className={`fixed top-20 left-1/2 -translate-x-1/2 z-[60] ${style.bg} backdrop-blur-md border text-white px-6 py-3.5 rounded-2xl shadow-xl text-sm font-semibold max-w-md w-[calc(100%-2rem)] sm:w-auto flex items-center gap-2 slide-in`}
        >
          <i className={`fas ${style.icon}`}></i>
          <span>{toast.message}</span>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
