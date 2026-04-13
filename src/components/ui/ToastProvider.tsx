import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className="pointer-events-auto"
            >
              <div className={`
                glass-card flex items-center gap-3 px-5 py-3.5 min-w-[300px] max-w-md
                shadow-2xl border-l-[4px] relative overflow-hidden
                ${toast.type === 'success' ? 'border-l-green-500' : ''}
                ${toast.type === 'error' ? 'border-l-red-500' : ''}
                ${toast.type === 'info' ? 'border-l-[var(--color-chirp)]' : ''}
              `}>
               <div className="absolute inset-0 bg-gradient-to-r from-white/[0.03] to-transparent pointer-none" />
               
                <div className={`
                  p-1.5 rounded-full shrink-0
                  ${toast.type === 'success' ? 'bg-green-500/10 text-green-500' : ''}
                  ${toast.type === 'error' ? 'bg-red-500/10 text-red-500' : ''}
                  ${toast.type === 'info' ? 'bg-[var(--color-chirp)]/10 text-[var(--color-chirp)]' : ''}
                `}>
                  {toast.type === 'success' && <CheckCircle2 size={18} />}
                  {toast.type === 'error' && <AlertCircle size={18} />}
                  {toast.type === 'info' && <Info size={18} />}
                </div>

                <p className="text-[14px] font-medium text-[var(--text-color)] flex-1">
                  {toast.message}
                </p>

                <button 
                  onClick={() => removeToast(toast.id)}
                  className="p-1 hover:bg-[var(--hover-bg)] rounded-full transition-colors text-[var(--text-muted)]"
                >
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
