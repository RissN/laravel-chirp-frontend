import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  contentClassName?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  showCloseButton = true,
  contentClassName,
  size = 'md'
}) => {
  // Prevent scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const sizeClasses = {
    sm: 'max-w-[360px]',
    md: 'max-w-[600px]',
    lg: 'max-w-[800px]',
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#242d34]/70 backdrop-blur-sm"
          />
          
          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className={`bg-[var(--card-bg)] w-full ${sizeClasses[size]} rounded-2xl relative z-10 shadow-2xl border border-[var(--border-color)] overflow-hidden ${contentClassName || ''}`}
          >
            {/* Header */}
            {(title || showCloseButton) && (
              <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-color)]/30">
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className="p-1.5 hover:bg-[var(--hover-bg)] rounded-full transition-colors text-[var(--text-color)] flex-shrink-0"
                  >
                    <X size={20} />
                  </button>
                )}
                {title && <h3 className="text-lg font-extrabold text-[var(--text-color)]">{title}</h3>}
              </div>
            )}

            {/* Body */}
            <div className="relative">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
