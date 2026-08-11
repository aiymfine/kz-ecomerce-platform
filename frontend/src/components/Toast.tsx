import { useState, useCallback, createContext, useContext } from 'react';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

let toastId = 0;

function useToastInner() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}

const ToastContext = createContext<ReturnType<typeof useToastInner> | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const toast = useToastInner();
  return <ToastContext.Provider value={toast}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be inside ToastProvider');
  return ctx;
}

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed top-20 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`pointer-events-auto animate-fade-in-fast rounded-lg px-4 py-3 shadow-lg flex items-center gap-3 min-w-[280px] max-w-sm border ${
            toast.type === 'success'
              ? 'bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-800'
              : toast.type === 'error'
              ? 'bg-white dark:bg-slate-900 border-red-200 dark:border-red-800'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
        >
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${toast.type === 'success' ? 'bg-emerald-500' : toast.type === 'error' ? 'bg-red-500' : 'bg-slate-400'}`} />
          <span className="text-sm font-medium text-slate-800 dark:text-slate-200 flex-1">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-slate-300 hover:text-slate-500 dark:hover:text-slate-400 transition-colors text-xs"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
