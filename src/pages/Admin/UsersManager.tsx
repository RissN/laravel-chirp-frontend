import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminUsers, banUser, suspendUser, unbanUser, deleteUser } from '../../api/admin';
import { Search, Ban, UserX, UserCheck, Trash2, Loader2, ChevronDown, CheckSquare, Square, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: 'bg-green-500/20 text-green-400',
    suspended: 'bg-orange-500/20 text-orange-400',
    banned: 'bg-red-500/20 text-red-400',
  };
  return (
    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${map[status] ?? 'bg-white/10 text-white/40'}`}>
      {status}
    </span>
  );
}

export default function AdminUsers() {
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);
  
  // Modal states
  const [actionModal, setActionModal] = useState<{ type: string; user: any } | null>(null);
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState<number | string>('0');
  const [isDurationOpen, setIsDurationOpen] = useState(false);
  const [feedback, setFeedback] = useState('');

  // Bulk Selection States
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [isBulkLoading, setIsBulkLoading] = useState(false);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin-users', q, statusFilter, page],
    queryFn: () => getAdminUsers({ q, status: statusFilter, page }),
  });

  const users = data?.data || [];
  const meta = data?.meta;

  const onSuccess = (msg: string) => {
    setFeedback(msg);
    setActionModal(null);
    setReason('');
    setDuration('0');
    setIsDurationOpen(false);
    setSelectedUsers([]);
    qc.invalidateQueries({ queryKey: ['admin-users'] });
    setTimeout(() => setFeedback(''), 4000);
  };

  const banMut = useMutation({ mutationFn: ({ id, reason, duration }: any) => banUser(id, reason, duration), onSuccess: (r) => onSuccess(r.message) });
  const suspendMut = useMutation({ mutationFn: ({ id, reason, duration }: any) => suspendUser(id, reason, duration), onSuccess: (r) => onSuccess(r.message) });
  const unbanMut = useMutation({ mutationFn: (id: number) => unbanUser(id), onSuccess: (r) => onSuccess(r.message) });
  const deleteMut = useMutation({ mutationFn: (id: number) => deleteUser(id), onSuccess: (r) => onSuccess(r.message) });

  const executeBulkAction = async (type: string) => {
    if (!selectedUsers.length || isBulkLoading) return;
    setIsBulkLoading(true);
    try {
      const promises = selectedUsers.map(id => {
        if (type === 'bulk_ban') return banUser(id, reason || 'Bulk action violation', duration === '0' ? undefined : Number(duration));
        if (type === 'bulk_suspend') return suspendUser(id, reason || 'Bulk action violation', duration === '0' ? 168 : Number(duration));
        if (type === 'bulk_delete') return deleteUser(id);
      });
      await Promise.all(promises);
      onSuccess(`Successfully executed ${type.replace('bulk_', '')} on ${selectedUsers.length} users.`);
    } catch (err: any) {
      setFeedback('❌ Failed to execute bulk action on some users.');
      setTimeout(() => setFeedback(''), 4000);
      setIsBulkLoading(false);
      setActionModal(null);
    }
  };

  const handleAction = () => {
    if (!actionModal) return;
    const { type, user } = actionModal;
    
    if (type.startsWith('bulk_')) {
       executeBulkAction(type);
       return;
    }

    const durationNum = duration === '0' ? undefined : Number(duration);
    if (type === 'ban') banMut.mutate({ id: user.id, reason, duration: durationNum });
    if (type === 'suspend') suspendMut.mutate({ id: user.id, reason, duration: durationNum });
    if (type === 'unban') unbanMut.mutate(user.id);
    if (type === 'delete') deleteMut.mutate(user.id);
  };

  // Trigger Bulk Modal
  const handleBulkAction = (type: 'bulk_ban' | 'bulk_suspend' | 'bulk_delete') => {
    if (!selectedUsers.length) return;
    setActionModal({ type, user: null });
  };


  const toggleSelectAll = () => {
    if (selectedUsers.length === users.length && users.length > 0) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map((u: any) => u.id));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedUsers(prev => prev.includes(id) ? prev.filter(u => u !== id) : [...prev, id]);
  };

  const durationOptions = [
    { label: 'Permanent', value: '0' },
    { label: '1 Hour', value: '1' },
    { label: '24 Hours', value: '24' },
    { label: '3 Days', value: '72' },
    { label: '7 Days', value: '168' },
    { label: '30 Days', value: '720' },
  ];

  const isPending = banMut.isPending || suspendMut.isPending || unbanMut.isPending || deleteMut.isPending || isBulkLoading;
  const isBulkType = actionModal?.type?.startsWith('bulk_');
  const needsReason = actionModal?.type === 'ban' || actionModal?.type === 'suspend' || actionModal?.type === 'bulk_ban' || actionModal?.type === 'bulk_suspend';
  const modalTitle = actionModal?.type === 'unban' ? 'Reinstate' : (actionModal?.type?.replace('bulk_', '') ?? '');

  return (
    <div className="p-6 w-full flex flex-col h-full bg-[var(--bg-color)]">
      {/* Header Section */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-[var(--text-color)]">Users</h1>
          <p className="text-[var(--text-muted)] text-xs mt-0.5">Manage {meta?.total?.toLocaleString() || 'all'} platform users</p>
        </div>

        {feedback && (
          <div className={`px-4 py-2 rounded-lg text-xs font-bold ${feedback.startsWith('❌') ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
            {feedback}
          </div>
        )}
      </div>

      {/* Advanced Filter Bar & Bulk Actions */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4 items-center justify-between bg-[var(--hover-bg)]/20 p-2 rounded-xl border border-[var(--border-color)]/20">
        
        {/* Bulk Action Context Menu (Shows when items are selected) */}
        <AnimatePresence mode="popLayout">
          {selectedUsers.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center gap-3 bg-[var(--color-chirp)]/10 px-3 py-1.5 rounded-lg border border-[var(--color-chirp)]/20"
            >
              <span className="text-xs font-bold text-[var(--color-chirp)]">{selectedUsers.length} selected</span>
              <div className="w-px h-4 bg-[var(--color-chirp)]/20"></div>
              <button disabled={isBulkLoading} onClick={() => handleBulkAction('bulk_suspend')} className="text-xs font-bold text-orange-400 hover:text-orange-300 transition-colors disabled:opacity-50">Suspend</button>
              <button disabled={isBulkLoading} onClick={() => handleBulkAction('bulk_ban')} className="text-xs font-bold text-red-500 hover:text-red-400 transition-colors disabled:opacity-50">Ban</button>
              <button disabled={isBulkLoading} onClick={() => handleBulkAction('bulk_delete')} className="text-xs font-bold text-[var(--text-muted)] hover:text-red-400 transition-colors disabled:opacity-50">Delete</button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="flex items-center gap-3 w-full sm:w-auto"
            >
              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="text"
                  value={q}
                  onChange={(e) => { setQ(e.target.value); setPage(1); }}
                  placeholder="Search user..."
                  className="w-full bg-[var(--bg-color)] border border-[var(--border-color)]/30 rounded-lg pl-8 pr-3 py-1.5 text-[var(--text-color)] text-xs placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-chirp)] focus:ring-1 focus:ring-[var(--color-chirp)] transition-all"
                />
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsStatusFilterOpen(!isStatusFilterOpen)}
                  className="bg-[var(--bg-color)] border border-[var(--border-color)]/30 rounded-lg px-3 py-1.5 text-[var(--text-color)] text-xs flex items-center gap-2 hover:bg-[var(--hover-bg)] transition-all min-w-[110px] justify-between"
                >
                  <span className="capitalize">{statusFilter || 'All Status'}</span>
                  <ChevronDown size={12} className={`text-[var(--text-muted)] transform transition-transform duration-200 ${isStatusFilterOpen ? 'rotate-180' : ''}`} />
                </button>
                {isStatusFilterOpen && (
                  <>
                    <div className="fixed inset-0 z-[60]" onClick={() => setIsStatusFilterOpen(false)} />
                    <div className="absolute top-full left-0 mt-1 min-w-[110px] bg-[var(--bg-color)] border border-[var(--border-color)]/30 rounded-lg overflow-hidden shadow-2xl z-[70]">
                      {[{ label: 'All', value: '' }, { label: 'Active', value: 'active' }, { label: 'Suspended', value: 'suspended' }, { label: 'Banned', value: 'banned' }].map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => { setStatusFilter(opt.value); setPage(1); setIsStatusFilterOpen(false); }}
                          className={`w-full text-left px-3 py-2 text-xs transition-colors hover:bg-[var(--hover-bg)] ${statusFilter === opt.value ? 'text-[var(--color-chirp)] bg-[var(--color-chirp)]/10' : 'text-[var(--text-color)]'}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pagination Indicator Top */}
        <div className="text-xs text-[var(--text-muted)] font-medium">
          {meta?.total ? `Showing ${(meta.current_page - 1) * meta.per_page + 1}-${Math.min(meta.current_page * meta.per_page, meta.total)} of ${meta.total}` : ''}
        </div>
      </div>

      {/* High-Density Table */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-[var(--color-chirp)]" size={24} /></div>
      ) : users.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-sm text-[var(--text-muted)]">No users found</div>
      ) : (
        <div className={`flex-1 min-h-0 bg-[var(--bg-color)] border border-[var(--border-color)]/20 rounded-xl overflow-hidden flex flex-col transition-opacity ${isFetching || isBulkLoading ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="overflow-x-auto flex-1 hide-scrollbar">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="bg-[var(--hover-bg)]/30 sticky top-0 z-10 backdrop-blur-md">
                <tr>
                  <th className="px-4 py-2.5 w-12 border-b border-[var(--border-color)]/20">
                    <button onClick={toggleSelectAll} className="text-[var(--text-muted)] hover:text-[var(--text-color)] flex items-center justify-center">
                      {selectedUsers.length === users.length && users.length > 0 ? <CheckSquare size={16} className="text-[var(--color-chirp)]" /> : <Square size={16} />}
                    </button>
                  </th>
                  <th className="px-4 py-2.5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border-color)]/20">User</th>
                  <th className="px-4 py-2.5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border-color)]/20">Contact</th>
                  <th className="px-4 py-2.5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border-color)]/20">Status</th>
                  <th className="px-4 py-2.5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border-color)]/20">Joined</th>
                  <th className="px-4 py-2.5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border-color)]/20 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]/10">
                {users.map((user: any) => (
                  <tr key={user.id} className={`hover:bg-[var(--hover-bg)]/40 transition-colors ${selectedUsers.includes(user.id) ? 'bg-[var(--color-chirp)]/5' : ''}`}>
                    <td className="px-4 py-2">
                      <button onClick={() => toggleSelect(user.id)} className="text-[var(--text-muted)] hover:text-[var(--text-color)] flex items-center justify-center">
                        {selectedUsers.includes(user.id) ? <CheckSquare size={16} className="text-[var(--color-chirp)]" /> : <Square size={16} />}
                      </button>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=1a1a1a&color=fff`}
                          alt=""
                          className="w-7 h-7 rounded-md object-cover border border-[var(--border-color)]/20"
                        />
                        <div className="flex flex-col">
                          <span className="text-[13px] font-bold text-[var(--text-color)] truncate max-w-[150px]">{user.name}</span>
                          <span className="text-[11px] text-[var(--text-muted)] truncate max-w-[150px]">@{user.username}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-[12px] text-[var(--text-muted)] truncate max-w-[150px]">{user.email}</td>
                    <td className="px-4 py-2"><StatusBadge status={user.status} /></td>
                    <td className="px-4 py-2 text-[11px] text-[var(--text-muted)] font-medium tracking-wide">
                      {new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center justify-end gap-1">
                        {user.status !== 'banned' && (
                          <button onClick={() => setActionModal({ type: 'ban', user })} className="p-1.5 rounded-md hover:bg-red-500/10 text-red-400 transition-colors" title="Ban">
                            <Ban size={14} />
                          </button>
                        )}
                        {user.status === 'active' && (
                          <button onClick={() => setActionModal({ type: 'suspend', user })} className="p-1.5 rounded-md hover:bg-orange-500/10 text-orange-400 transition-colors" title="Suspend">
                            <UserX size={14} />
                          </button>
                        )}
                        {(user.status === 'banned' || user.status === 'suspended') && (
                          <button onClick={() => setActionModal({ type: 'unban', user })} className="p-1.5 rounded-md hover:bg-green-500/10 text-green-400 transition-colors" title="Reinstate">
                            <UserCheck size={14} />
                          </button>
                        )}
                        <button onClick={() => setActionModal({ type: 'delete', user })} className="p-1.5 rounded-md hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-500 transition-colors" title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls Footer */}
          {meta && meta.last_page > 1 && (
            <div className="p-3 border-t border-[var(--border-color)]/20 bg-[var(--hover-bg)]/20 flex items-center justify-between">
              <span className="text-xs text-[var(--text-muted)]">
                Page <span className="font-bold text-[var(--text-color)]">{meta.current_page}</span> of {meta.last_page}
              </span>
              <div className="flex gap-1.5">
                <button 
                  disabled={meta.current_page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="p-1.5 rounded-lg border border-[var(--border-color)]/30 hover:bg-[var(--hover-bg)] disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                >
                  <ChevronLeft size={16} className="text-[var(--text-color)]" />
                </button>
                <div className="flex gap-1">
                   {/* Just a simple page indicator loop for nearby pages could go here, or simple next/prev is often enough for admin */}
                </div>
                <button 
                  disabled={meta.current_page === meta.last_page}
                  onClick={() => setPage(p => p + 1)}
                  className="p-1.5 rounded-lg border border-[var(--border-color)]/30 hover:bg-[var(--hover-bg)] disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                >
                  <ChevronRight size={16} className="text-[var(--text-color)]" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Confirmation Modal (Restyled) */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[var(--bg-color)] border border-[var(--border-color)]/30 rounded-2xl p-6 w-full max-w-md shadow-2xl"
          >
            <h2 className="text-[var(--text-color)] font-black text-lg mb-1 capitalize">
              {modalTitle} {isBulkType ? 'Multiple Users' : 'User'}
            </h2>
            <p className="text-[var(--text-muted)] text-xs mb-6 leading-relaxed">
              {isBulkType ? `Are you sure you want to ${modalTitle.toLowerCase()} ` : 'Are you sure you want to '}
              {isBulkType ? <strong className="text-[var(--text-color)]">{selectedUsers.length} selected users</strong> : (
                <>
                  {modalTitle.toLowerCase()} <strong className="text-[var(--text-color)]">@{actionModal.user?.username}</strong>
                </>
              )}?
              {actionModal.type.includes('delete') && ' This action is entirely irreversible.'}
            </p>
            {needsReason && (
              <div className="space-y-4 mb-6">
                <div className="relative">
                  <label className="block text-[var(--text-muted)] text-xs font-bold mb-1.5">Duration</label>
                  <button
                    type="button"
                    onClick={() => setIsDurationOpen(!isDurationOpen)}
                    className="w-full bg-transparent border border-[var(--border-color)]/30 rounded-xl px-3 py-2.5 text-[var(--text-color)] text-sm flex items-center justify-between hover:bg-[var(--hover-bg)] transition-all"
                  >
                    <span>{durationOptions.find(o => o.value === duration.toString())?.label}</span>
                    <ChevronDown size={14} className={`text-[var(--text-muted)] transform transition-transform duration-200 ${isDurationOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isDurationOpen && (
                    <>
                      <div className="fixed inset-0 z-[60]" onClick={() => setIsDurationOpen(false)} />
                      <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--bg-color)] border border-[var(--border-color)]/30 rounded-xl overflow-hidden shadow-2xl z-[70]">
                        {durationOptions.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => { setDuration(opt.value); setIsDurationOpen(false); }}
                            className={`w-full text-left px-4 py-2.5 text-xs transition-colors hover:bg-[var(--hover-bg)] ${duration.toString() === opt.value ? 'text-[var(--color-chirp)] bg-[var(--color-chirp)]/10 font-bold' : 'text-[var(--text-color)]'}`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <div>
                  <label className="block text-[var(--text-muted)] text-xs font-bold mb-1.5">Reason (required)</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={2}
                    className="w-full bg-[var(--bg-color)] border border-[var(--border-color)]/30 rounded-xl px-3 py-2.5 text-[var(--text-color)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-chirp)] focus:ring-1 focus:ring-[var(--color-chirp)] transition-all resize-none"
                    placeholder="Violation details..."
                  />
                </div>
              </div>
            )}
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => { setActionModal(null); setReason(''); }}
                className="px-4 py-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-color)] hover:bg-[var(--hover-bg)] text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAction}
                disabled={isPending || (needsReason && !reason.trim())}
                className={`px-4 py-2 rounded-xl text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center min-w-[80px] ${
                  actionModal.type.includes('ban') || actionModal.type.includes('delete') ? 'bg-red-600 hover:bg-red-500' :
                  actionModal.type.includes('suspend') ? 'bg-orange-600 hover:bg-orange-500' :
                  'bg-green-600 hover:bg-green-500'
                }`}
              >
                {isPending ? <Loader2 size={14} className="animate-spin" /> : 'Confirm'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
