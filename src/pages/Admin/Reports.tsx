import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getReports, resolveReport, banUser, suspendUser, deleteTweet as adminDeleteTweet, deleteUser } from '../../api/admin';
import { Loader2, CheckCircle, ChevronDown, AlertTriangle, User, MessageSquare, Shield, Ban, Clock, X, ShieldOff, UserX, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type PunishmentType = 'none' | 'suspend' | 'ban' | 'delete_account';

const DURATION_OPTIONS = [
  { label: '1d', hours: 24 },
  { label: '3d', hours: 72 },
  { label: '7d', hours: 168 },
  { label: '14d', hours: 336 },
  { label: '30d', hours: 720 },
  { label: 'Permanent', hours: 0 },
];

const PUNISHMENT_CARDS: { type: PunishmentType; label: string; desc: string; icon: any; color: string; bg: string }[] = [
  { type: 'none', label: 'No Action', desc: 'Dismiss without penalty', icon: ShieldOff, color: 'text-white/50', bg: 'border-white/10 hover:bg-white/[0.03]' },
  { type: 'suspend', label: 'Suspend', desc: 'Temporarily restrict account', icon: Clock, color: 'text-orange-400', bg: 'border-orange-500/20 hover:bg-orange-500/[0.06]' },
  { type: 'ban', label: 'Ban', desc: 'Revoke account access', icon: Ban, color: 'text-red-400', bg: 'border-red-500/20 hover:bg-red-500/[0.06]' },
  { type: 'delete_account', label: 'Delete Account', desc: 'Permanently remove account', icon: UserX, color: 'text-red-500', bg: 'border-red-500/20 hover:bg-red-500/[0.06]' },
];

const statusColor: Record<string, string> = {
  pending: 'bg-orange-500/20 text-orange-400',
  reviewed: 'bg-blue-500/20 text-blue-400',
  resolved: 'bg-green-500/20 text-green-400',
  dismissed: 'bg-white/10 text-white/30',
};

export default function AdminReports() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('pending');
  const [modal, setModal] = useState<{ report: any } | null>(null);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [form, setForm] = useState({ status: 'resolved', admin_note: '' });
  const [feedback, setFeedback] = useState('');
  const [actionFeedback, setActionFeedback] = useState('');
  const [punishment, setPunishment] = useState<PunishmentType>('none');
  const [punishDuration, setPunishDuration] = useState(168); // default 7d in hours
  const [deleteTweetChecked, setDeleteTweetChecked] = useState(false);
  const [confirmDangerous, setConfirmDangerous] = useState(false);
  const [punishmentDone, setPunishmentDone] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reports', statusFilter],
    queryFn: () => getReports({ status: statusFilter }),
  });

  const resolveMut = useMutation({
    mutationFn: ({ id, payload }: any) => resolveReport(id, payload),
    onSuccess: (r) => {
      setFeedback(r.message);
      setModal(null);
      setIsStatusOpen(false);
      qc.invalidateQueries({ queryKey: ['admin-reports'] });
      setTimeout(() => setFeedback(''), 3000);
    }
  });

  const banMut = useMutation({
    mutationFn: ({ id, reason, duration }: { id: number; reason: string; duration?: number }) => banUser(id, reason, duration),
    onSuccess: (r) => {
      const msg = r.message || 'User has been banned.';
      setActionFeedback(msg);
      setPunishmentDone(msg);
      setTimeout(() => setActionFeedback(''), 4000);
    },
    onError: (err: any) => {
      setActionFeedback('❌ ' + (err.response?.data?.message || 'Failed to ban user.'));
      setTimeout(() => setActionFeedback(''), 4000);
    }
  });

  const suspendMut = useMutation({
    mutationFn: ({ id, reason, duration }: { id: number; reason: string; duration?: number }) => suspendUser(id, reason, duration),
    onSuccess: (r) => {
      const msg = r.message || 'User has been suspended.';
      setActionFeedback(msg);
      setPunishmentDone(msg);
      setTimeout(() => setActionFeedback(''), 4000);
    },
    onError: (err: any) => {
      setActionFeedback('❌ ' + (err.response?.data?.message || 'Failed to suspend user.'));
      setTimeout(() => setActionFeedback(''), 4000);
    }
  });

  const deleteTweetMut = useMutation({
    mutationFn: (id: number) => adminDeleteTweet(id),
    onSuccess: () => {
      setActionFeedback('Tweet has been deleted.');
      setPunishmentDone(prev => prev ? prev + ' Tweet deleted.' : 'Tweet has been deleted.');
      setTimeout(() => setActionFeedback(''), 4000);
    },
    onError: (err: any) => {
      setActionFeedback('❌ ' + (err.response?.data?.message || 'Failed to delete tweet.'));
      setTimeout(() => setActionFeedback(''), 4000);
    }
  });

  const deleteAccountMut = useMutation({
    mutationFn: (id: number) => deleteUser(id),
    onSuccess: (r) => {
      const msg = r.message || 'Account has been deleted.';
      setActionFeedback(msg);
      setPunishmentDone(msg);
      setTimeout(() => setActionFeedback(''), 4000);
    },
    onError: (err: any) => {
      setActionFeedback('❌ ' + (err.response?.data?.message || 'Failed to delete account.'));
      setTimeout(() => setActionFeedback(''), 4000);
    }
  });

  const handleExecutePunishment = () => {
    if (!reportedUser?.id) return;
    const reason = report?.reason || 'Community guidelines violation';
    const durationHours = punishDuration === 0 ? undefined : punishDuration;

    if (punishment === 'suspend') {
      suspendMut.mutate({ id: reportedUser.id, reason, duration: durationHours });
    } else if (punishment === 'ban') {
      banMut.mutate({ id: reportedUser.id, reason, duration: durationHours });
    } else if (punishment === 'delete_account') {
      deleteAccountMut.mutate(reportedUser.id);
    }

    if (deleteTweetChecked && isTweetReport && report?.reportable?.id) {
      deleteTweetMut.mutate(report.reportable.id);
    }
  };

  const isPunishmentPending = banMut.isPending || suspendMut.isPending || deleteTweetMut.isPending || deleteAccountMut.isPending;
  const needsDuration = punishment === 'suspend' || punishment === 'ban';

  const report = modal?.report;
  const isTweetReport = report?.reportable_type?.includes('Tweet');
  const reportedUser = isTweetReport ? report?.reportable?.user : report?.reportable;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-[var(--text-color)]">Reports</h1>
        <p className="text-[var(--text-muted)] text-sm mt-1">Review and respond to user complaints</p>
      </div>

      {feedback && (
        <div className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-400 text-sm">{feedback}</div>
      )}

      <div className="flex gap-2 mb-6">
        {['pending', 'reviewed', 'resolved', 'dismissed', ''].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
              statusFilter === s ? 'bg-[var(--color-chirp)] text-white' : 'text-[var(--text-muted)] hover:bg-[var(--hover-bg)]'
            }`}
          >
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-[var(--color-chirp)]" size={24} /></div>
        ) : data?.data?.length === 0 ? (
          <div className="text-center py-12 text-[var(--text-muted)]">No reports found</div>
        ) : (
          data?.data?.map((report: any) => (
            <div key={report.id} className="bg-transparent border border-[var(--border-color)]/30 rounded-2xl p-5 hover:bg-[var(--hover-bg)] transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${statusColor[report.status]}`}>
                      {report.status}
                    </span>
                    <span className="text-[var(--text-muted)] text-xs">{new Date(report.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-[var(--text-color)] font-bold text-sm">Reason: <span className="text-red-400">{report.reason}</span></p>
                  {report.description && <p className="text-[var(--text-color)] opacity-80 text-sm mt-1">{report.description}</p>}
                  <p className="text-[var(--text-muted)] text-xs mt-2">
                    Reported by: @{report.reporter?.username} · Target: {report.reportable_type?.split('\\').pop()} #{report.reportable_id}
                  </p>
                  
                  {report.reportable && (
                    <div className="mt-3 p-3 bg-[var(--hover-bg)]/50 border border-[var(--border-color)]/30 rounded-xl">
                      <div className="text-[10px] font-bold text-[var(--text-muted)] mb-2 uppercase tracking-wide">Target Details</div>
                      {report.reportable_type?.includes('User') && (
                        <div className="flex items-center gap-3">
                          <img src={report.reportable.avatar || `https://ui-avatars.com/api/?name=${report.reportable.name}&background=random`} alt="" className="w-10 h-10 rounded-full border border-[var(--border-color)]/30" />
                          <div>
                            <div className="text-sm font-bold text-[var(--text-color)]">{report.reportable.name}</div>
                            <div className="text-xs text-[var(--text-muted)]">@{report.reportable.username}</div>
                            {report.reportable.bio && <div className="text-xs text-[var(--text-color)] opacity-60 mt-1 line-clamp-1">{report.reportable.bio}</div>}
                          </div>
                        </div>
                      )}
                      
                      {report.reportable_type?.includes('Tweet') && (
                        <div className="flex items-start gap-3">
                          <img src={report.reportable.user?.avatar || `https://ui-avatars.com/api/?name=${report.reportable.user?.name || 'Unknown'}&background=random`} alt="" className="w-8 h-8 rounded-full border border-[var(--border-color)]/30" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-[var(--text-color)] opacity-70">
                               {report.reportable.user?.name || 'Unknown'} <span className="text-[var(--text-muted)] font-normal">@{report.reportable.user?.username || 'unknown'}</span>
                            </div>
                            <div className="text-sm text-[var(--text-color)] mt-1 break-words">{report.reportable.content}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {report.admin_note && (
                    <p className="mt-2 text-blue-400/70 text-xs italic">Admin note: {report.admin_note}</p>
                  )}
                </div>
                {report.status === 'pending' && (
                  <button
                    onClick={() => { setModal({ report }); setForm({ status: 'resolved', admin_note: '' }); setActionFeedback(''); setPunishment('none'); setPunishDuration(168); setDeleteTweetChecked(false); setConfirmDangerous(false); setPunishmentDone(''); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--border-color)]/30 text-[var(--color-chirp)] hover:bg-[var(--hover-bg)] text-sm font-bold transition-all flex-shrink-0"
                  >
                    <CheckCircle size={15} /> Review
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ─── REVIEW MODAL ─── */}
      <AnimatePresence>
        {modal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#242d34]/70 backdrop-blur-sm" onClick={() => setModal(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="bg-[var(--bg-color)] border border-[var(--border-color)]/30 rounded-2xl w-full max-w-lg mx-4 shadow-2xl max-h-[90vh] overflow-y-auto hide-scrollbar"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-color)]/20 sticky top-0 bg-[var(--bg-color)] z-10">
                <h2 className="text-[var(--text-color)] font-black text-lg">Review Report</h2>
                <button onClick={() => setModal(null)} className="p-1.5 hover:bg-[var(--hover-bg)] rounded-full transition-colors text-[var(--text-muted)]">
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 space-y-5">
                {/* Action Feedback */}
                {actionFeedback && (
                  <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-xs font-medium">
                    {actionFeedback}
                  </div>
                )}

                {/* ── Section 1: Report Info ── */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                    <AlertTriangle size={12} /> Report Details
                  </div>
                  <div className="bg-[var(--hover-bg)]/50 border border-[var(--border-color)]/20 rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[var(--text-muted)] w-16 flex-shrink-0">Reason</span>
                      <span className="text-sm font-bold text-red-400">{report?.reason}</span>
                    </div>
                    {report?.description && (
                      <div className="flex items-start gap-2">
                        <span className="text-xs font-bold text-[var(--text-muted)] w-16 flex-shrink-0 pt-0.5">Details</span>
                        <span className="text-sm text-[var(--text-color)] opacity-80">{report.description}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[var(--text-muted)] w-16 flex-shrink-0">By</span>
                      <span className="text-sm text-[var(--text-color)]">
                        @{report?.reporter?.username}
                        <span className="text-[var(--text-muted)] ml-1 text-xs">
                          · {report?.created_at ? new Date(report.created_at).toLocaleString() : ''}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* ── Section 2: Reported Content ── */}
                {isTweetReport && report?.reportable && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                      <MessageSquare size={12} /> Reported Tweet
                    </div>
                    <div className="bg-[var(--hover-bg)]/50 border border-red-500/15 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <img
                          src={report.reportable.user?.avatar || `https://ui-avatars.com/api/?name=${report.reportable.user?.name || 'U'}&background=1a1a1a&color=fff`}
                          alt=""
                          className="w-10 h-10 rounded-full border border-[var(--border-color)]/30 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-[var(--text-color)]">{report.reportable.user?.name || 'Unknown'}</span>
                            <span className="text-xs text-[var(--text-muted)]">@{report.reportable.user?.username || 'unknown'}</span>
                          </div>
                          <p className="text-[15px] text-[var(--text-color)] mt-1.5 leading-relaxed" style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}>
                            {report.reportable.content}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-[var(--text-muted)] text-xs">
                            <span>❤️ {report.reportable.likes_count || 0}</span>
                            <span>🔁 {report.reportable.retweets_count || 0}</span>
                            <span>💬 {report.reportable.replies_count || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Section 3: Reported User ── */}
                {reportedUser && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                      <User size={12} /> {isTweetReport ? 'Tweet Author' : 'Reported Account'}
                    </div>
                    <div className="bg-[var(--hover-bg)]/50 border border-[var(--border-color)]/20 rounded-xl p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={reportedUser.avatar || `https://ui-avatars.com/api/?name=${reportedUser.name}&background=1a1a1a&color=fff`}
                          alt=""
                          className="w-12 h-12 rounded-full border border-[var(--border-color)]/30"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-bold text-[var(--text-color)]">{reportedUser.name}</div>
                          <div className="text-xs text-[var(--text-muted)]">@{reportedUser.username}</div>
                          {reportedUser.bio && <div className="text-xs text-[var(--text-color)] opacity-50 mt-1 line-clamp-2">{reportedUser.bio}</div>}
                        </div>
                        <div className="text-right text-xs text-[var(--text-muted)] space-y-0.5">
                          <div>{reportedUser.followers_count ?? 0} followers</div>
                          <div>{reportedUser.tweets_count ?? 0} tweets</div>
                          {reportedUser.status && reportedUser.status !== 'active' && (
                            <span className="inline-block px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full text-[10px] font-bold capitalize mt-1">{reportedUser.status}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Section: Punishment ── */}
                {reportedUser && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                      <Shield size={12} /> Take Action
                    </div>

                    {punishmentDone ? (
                      /* ── Success State ── */
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-green-500/[0.07] border border-green-500/20 rounded-xl p-5"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                            <CheckCircle size={20} className="text-green-400" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-green-400">Action Completed</div>
                            <div className="text-xs text-green-400/70 mt-0.5">{punishmentDone}</div>
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      /* ── Action Picker ── */
                      <>
                        {/* Action Type Cards */}
                        <div className="grid grid-cols-2 gap-2">
                          {PUNISHMENT_CARDS.map((card) => {
                            const isSelected = punishment === card.type;
                            const Icon = card.icon;
                            return (
                              <button
                                key={card.type}
                                onClick={() => { setPunishment(card.type); setConfirmDangerous(false); }}
                                className={`relative p-3 rounded-xl border text-left transition-all duration-200 ${
                                  isSelected
                                    ? `${card.bg} ring-1 ring-current ${card.color} bg-opacity-10`
                                    : `border-[var(--border-color)]/15 hover:bg-[var(--hover-bg)]/50 text-[var(--text-muted)]`
                                }`}
                              >
                                {isSelected && (
                                  <div className="absolute top-2 right-2">
                                    <Check size={14} className={card.color} />
                                  </div>
                                )}
                                <Icon size={16} className={isSelected ? card.color : 'text-[var(--text-muted)]'} />
                                <div className={`text-xs font-bold mt-1.5 ${isSelected ? card.color : 'text-[var(--text-color)]'}`}>{card.label}</div>
                                <div className="text-[10px] text-[var(--text-muted)] mt-0.5 leading-tight">{card.desc}</div>
                              </button>
                            );
                          })}
                        </div>

                        {/* Duration Selector - only for suspend/ban */}
                        <AnimatePresence>
                          {needsDuration && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="bg-[var(--hover-bg)]/30 border border-[var(--border-color)]/15 rounded-xl p-3 space-y-2">
                                <label className="text-xs font-medium text-[var(--text-muted)]">Duration</label>
                                <div className="flex flex-wrap gap-1.5">
                                  {DURATION_OPTIONS.map((opt) => (
                                    <button
                                      key={opt.hours}
                                      onClick={() => setPunishDuration(opt.hours)}
                                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                        punishDuration === opt.hours
                                          ? punishment === 'ban'
                                            ? 'bg-red-500/20 text-red-400 ring-1 ring-red-500/30'
                                            : 'bg-orange-500/20 text-orange-400 ring-1 ring-orange-500/30'
                                          : 'bg-[var(--hover-bg)]/50 text-[var(--text-muted)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-color)]'
                                      }`}
                                    >
                                      {opt.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Delete Tweet checkbox - only for tweet reports */}
                        {isTweetReport && report?.reportable?.id && punishment !== 'none' && (
                          <label className="flex items-center gap-3 px-3 py-2.5 bg-[var(--hover-bg)]/30 border border-[var(--border-color)]/15 rounded-xl cursor-pointer hover:bg-[var(--hover-bg)]/50 transition-all">
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all flex-shrink-0 ${
                              deleteTweetChecked 
                                ? 'bg-red-500 border-red-500' 
                                : 'border-[var(--border-color)]/40 bg-transparent'
                            }`}
                              onClick={(e) => { e.preventDefault(); setDeleteTweetChecked(!deleteTweetChecked); }}
                            >
                              {deleteTweetChecked && <Check size={10} className="text-white" />}
                            </div>
                            <div>
                              <span className="text-xs font-bold text-[var(--text-color)]">Also delete this tweet</span>
                              <span className="text-[10px] text-[var(--text-muted)] ml-1">Remove the reported content</span>
                            </div>
                          </label>
                        )}

                        {/* Execute Button */}
                        {punishment !== 'none' && (
                          <div className="space-y-2">
                            {/* Action Feedback for errors */}
                            <AnimatePresence>
                              {actionFeedback && actionFeedback.startsWith('❌') && (
                                <motion.div
                                  initial={{ opacity: 0, y: -6 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -6 }}
                                  className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold flex items-center gap-2"
                                >
                                  {actionFeedback}
                                </motion.div>
                              )}
                            </AnimatePresence>

                            {(punishment === 'ban' || punishment === 'delete_account') && (
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={confirmDangerous}
                                  onChange={(e) => setConfirmDangerous(e.target.checked)}
                                  className="accent-red-500 w-3.5 h-3.5"
                                />
                                <span className="text-[11px] text-red-400 font-medium">
                                  I confirm this {punishment === 'delete_account' ? 'permanent deletion' : 'ban action'}
                                </span>
                              </label>
                            )}
                            <button
                              onClick={handleExecutePunishment}
                              disabled={isPunishmentPending || ((punishment === 'ban' || punishment === 'delete_account') && !confirmDangerous)}
                              className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-40 ${
                                punishment === 'suspend'
                                  ? 'bg-orange-500/15 text-orange-400 hover:bg-orange-500/25'
                                  : 'bg-red-500/15 text-red-400 hover:bg-red-500/25'
                              }`}
                            >
                              {isPunishmentPending ? (
                                <><Loader2 size={14} className="animate-spin" /> Executing...</>
                              ) : (
                                <>
                                  {punishment === 'suspend' && <><Clock size={14} /> Suspend {DURATION_OPTIONS.find(d => d.hours === punishDuration)?.label}</>}
                                  {punishment === 'ban' && <><Ban size={14} /> Ban {DURATION_OPTIONS.find(d => d.hours === punishDuration)?.label}</>}
                                  {punishment === 'delete_account' && <><UserX size={14} /> Delete Account Permanently</>}
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* ── Section 4: Resolution ── */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                    <Shield size={12} /> Resolution
                  </div>

                  <div className="space-y-3">
                    {/* Status dropdown */}
                    <div className="relative">
                      <label className="block text-[var(--text-muted)] text-xs mb-1.5 font-medium">Action</label>
                      <button
                        type="button"
                        onClick={() => setIsStatusOpen(!isStatusOpen)}
                        className="w-full bg-[var(--hover-bg)]/50 border border-[var(--border-color)]/20 rounded-xl px-4 py-2.5 text-[var(--text-color)] text-sm flex items-center justify-between hover:bg-[var(--hover-bg)] transition-all"
                      >
                        <span>
                          {form.status === 'resolved' ? '✅ Resolved (action taken)' : 
                           form.status === 'reviewed' ? '👁️ Reviewed (noted)' : 
                           '❌ Dismissed (no violation)'}
                        </span>
                        <ChevronDown size={14} className={`text-[var(--text-muted)] transform transition-transform duration-200 ${isStatusOpen ? 'rotate-180' : ''}`} />
                      </button>

                      <AnimatePresence>
                        {isStatusOpen && (
                          <>
                            <motion.div 
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="fixed inset-0 z-[60]" 
                              onClick={(e) => { e.stopPropagation(); setIsStatusOpen(false); }} 
                            />
                            <motion.div
                              initial={{ opacity: 0, y: -6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -6 }}
                              className="absolute top-full left-0 right-0 mt-1.5 bg-[var(--bg-color)] border border-[var(--border-color)]/30 rounded-xl overflow-hidden shadow-2xl z-[70]"
                            >
                              {[
                                { label: '✅ Resolved (action taken)', value: 'resolved' },
                                { label: '👁️ Reviewed (noted)', value: 'reviewed' },
                                { label: '❌ Dismissed (no violation)', value: 'dismissed' },
                              ].map((opt) => (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setForm(prev => ({ ...prev, status: opt.value }));
                                    setIsStatusOpen(false);
                                  }}
                                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-[var(--hover-bg)] ${
                                    form.status === opt.value ? 'text-[var(--color-chirp)] bg-[var(--hover-bg)]/50' : 'text-[var(--text-color)]'
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Admin Note */}
                    <div>
                      <label className="block text-[var(--text-muted)] text-xs mb-1.5 font-medium">Admin Note (optional)</label>
                      <textarea
                        value={form.admin_note}
                        onChange={(e) => setForm(prev => ({ ...prev, admin_note: e.target.value }))}
                        rows={3}
                        className="w-full bg-[var(--hover-bg)]/50 border border-[var(--border-color)]/20 rounded-xl px-4 py-3 text-[var(--text-color)] text-sm placeholder:text-[var(--text-muted)]/50 focus:outline-none focus:border-[var(--color-chirp)] focus:ring-1 focus:ring-[var(--color-chirp)] transition-all resize-none"
                        placeholder="Add a note about this decision..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex gap-3 justify-end px-5 py-4 border-t border-[var(--border-color)]/20 sticky bottom-0 bg-[var(--bg-color)]">
                <button onClick={() => setModal(null)} className="px-5 py-2.5 rounded-full border border-[var(--border-color)]/30 bg-transparent text-[var(--text-color)] hover:bg-[var(--hover-bg)] text-sm font-bold transition-all">
                  Cancel
                </button>
                <button
                  onClick={() => resolveMut.mutate({ id: modal.report.id, payload: form })}
                  disabled={resolveMut.isPending}
                  className="px-6 py-2.5 rounded-full btn-gradient shadow-lg text-white text-sm font-bold transition-all active:scale-95 disabled:opacity-50"
                >
                  {resolveMut.isPending ? 'Saving...' : 'Submit Resolution'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

