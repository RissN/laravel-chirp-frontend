import React, { createContext, useContext, useState, useCallback } from 'react';
import { Modal } from './Modal';
import { AlertTriangle } from 'lucide-react';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
}

interface ModalContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) throw new Error('useModal must be used within a ModalProvider');
  return context;
};

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    options: ConfirmOptions;
    resolve: (value: boolean) => void;
  } | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setModalState({
        isOpen: true,
        options: {
          ...options,
          confirmLabel: options.confirmLabel || 'Confirm',
          cancelLabel: options.cancelLabel || 'Cancel',
          variant: options.variant || 'primary',
        },
        resolve,
      });
    });
  }, []);

  const handleClose = () => {
    if (modalState) {
      modalState.resolve(false);
      setModalState(null);
    }
  };

  const handleConfirm = () => {
    if (modalState) {
      modalState.resolve(true);
      setModalState(null);
    }
  };

  const isDanger = modalState?.options.variant === 'danger';

  return (
    <ModalContext.Provider value={{ confirm }}>
      {children}
      {modalState && (
        <Modal
          isOpen={modalState.isOpen}
          onClose={handleClose}
          showCloseButton={false}
          size="sm"
        >
          <div className="p-8 flex flex-col items-center text-center">
            {/* Icon */}
            {isDanger && (
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                <AlertTriangle size={24} className="text-red-500" />
              </div>
            )}

            {/* Title */}
            <h3 className="text-xl font-extrabold text-[var(--text-color)] mb-2">
              {modalState.options.title}
            </h3>

            {/* Message */}
            <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-8">
              {modalState.options.message}
            </p>
            
            {/* Actions — stacked full-width buttons like Twitter/X */}
            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={handleConfirm}
                className={`w-full py-3 px-6 rounded-full font-extrabold text-[15px] transition-all duration-200 cursor-pointer ${
                  isDanger
                    ? 'bg-red-500 text-white hover:bg-red-600 active:scale-[0.98]'
                    : 'bg-[var(--text-color)] text-[var(--bg-color)] hover:opacity-90 active:scale-[0.98]'
                }`}
              >
                {modalState.options.confirmLabel}
              </button>
              <button
                onClick={handleClose}
                className="w-full py-3 px-6 rounded-full font-extrabold text-[15px] border border-[var(--border-color)] text-[var(--text-color)] bg-transparent hover:bg-[var(--hover-bg)] transition-all duration-200 cursor-pointer active:scale-[0.98]"
              >
                {modalState.options.cancelLabel}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </ModalContext.Provider>
  );
};
