import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { createReport } from '../../api/reports';
import { useToast } from '../ui/ToastProvider';
import { Modal } from '../ui/Modal';
import Button from '../ui/Button';
import { AlertTriangle, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportableId: number;
  reportableType: 'tweet' | 'user';
}

const REASONS = [
  'It\'s spam',
  'Hate speech',
  'Harassment or bullying',
  'Misinformation',
  'Violence or physical threats',
  'Self-harm or suicide',
  'Sensitive or disturbing content',
  'Deceptive or impersonation',
  'Something else'
];

export default function ReportModal({ isOpen, onClose, reportableId, reportableType }: ReportModalProps) {
  const { showToast } = useToast();
  const [reason, setReason] = useState(REASONS[0]);
  const [description, setDescription] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const mutation = useMutation({
    mutationFn: () => createReport({
      reportable_id: reportableId,
      reportable_type: reportableType,
      reason,
      description: description.trim() || undefined
    }),
    onSuccess: (res) => {
      showToast(res.message, 'success');
      onClose();
      // Reset state for next use
      setReason(REASONS[0]);
      setDescription('');
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'Failed to submit report', 'error');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`Report ${reportableType === 'tweet' ? 'Tweet' : 'Account'}`}
    >
      <form onSubmit={handleSubmit} className="space-y-6 p-4">
        <div className="flex items-start gap-4 p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl">
          <AlertTriangle className="text-orange-500 flex-shrink-0" size={20} />
          <p className="text-xs text-[var(--text-color)] opacity-80 leading-relaxed font-medium">
            Reports are anonymous and strictly confidential. If the item violates our community 
            guidelines, our moderation team will take appropriate action.
          </p>
        </div>

        <div className="space-y-2 relative">
          <label className="block text-sm font-bold text-[var(--text-color)]">
            Reason for reporting
          </label>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-[var(--text-color)] flex items-center justify-between hover:bg-[var(--hover-bg)] transition-all font-medium shadow-sm"
          >
            <span className="text-sm">{reason}</span>
            <ChevronDown size={18} className={`text-[var(--text-muted)] transform transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {isDropdownOpen && (
              <>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-10" 
                  onClick={(e) => { e.stopPropagation(); setIsDropdownOpen(false); }} 
                />
                <motion.div 
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl overflow-hidden shadow-2xl z-20"
                >
                  <div className="max-h-60 overflow-y-auto hide-scrollbar">
                    {REASONS.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setReason(r);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-[var(--hover-bg)] ${
                          reason === r ? 'text-[var(--color-chirp)] bg-[var(--color-chirp)]/10 font-bold' : 'text-[var(--text-color)]'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-bold text-[var(--text-color)]">
            Additional details (Optional)
          </label>
          <textarea
            className="w-full bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-[var(--text-color)] focus:border-[var(--color-chirp)] focus:ring-1 focus:ring-[var(--color-chirp)] focus:outline-none transition resize-none text-sm placeholder:text-[var(--text-muted)] shadow-sm"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell us more about the violation..."
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" type="button" onClick={onClose} className="px-6">Cancel</Button>
          <Button 
            type="submit" 
            isLoading={mutation.isPending}
            className="btn-gradient px-8 text-white border-0 hover:opacity-90 shadow-xl shadow-[var(--color-chirp)]/20 active:scale-95"
          >
            Submit Report
          </Button>
        </div>
      </form>
    </Modal>
  );
}
