import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminTweets, deleteTweet } from '../../api/admin';
import { Search, Trash2, Loader2, CheckSquare, Square, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminModeration() {
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [confirmId, setConfirmId] = useState<number | 'bulk' | null>(null);
  const [feedback, setFeedback] = useState('');

  // Bulk Selection States
  const [selectedTweets, setSelectedTweets] = useState<number[]>([]);
  const [isBulkLoading, setIsBulkLoading] = useState(false);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin-tweets', q, page],
    queryFn: () => getAdminTweets({ q, page }),
  });

  const tweets = data?.data || [];
  const meta = data?.meta;

  const onSuccess = (msg: string) => {
    setFeedback(msg);
    setConfirmId(null);
    setSelectedTweets([]);
    qc.invalidateQueries({ queryKey: ['admin-tweets'] });
    setTimeout(() => setFeedback(''), 4000);
  };

  const deleteMut = useMutation({
    mutationFn: deleteTweet,
    onSuccess: (r) => onSuccess(r.message)
  });

  const executeBulkDelete = async () => {
    if (!selectedTweets.length || isBulkLoading) return;
    setIsBulkLoading(true);
    try {
      const promises = selectedTweets.map(id => deleteTweet(id));
      await Promise.all(promises);
      onSuccess(`Successfully deleted ${selectedTweets.length} posts.`);
    } catch (err: any) {
      setFeedback('❌ Failed to delete some posts.');
      setTimeout(() => setFeedback(''), 4000);
      setConfirmId(null);
    }
    setIsBulkLoading(false);
  };

  const handleDeleteConfirm = () => {
     if (confirmId === 'bulk') {
        executeBulkDelete();
     } else if (typeof confirmId === 'number') {
        deleteMut.mutate(confirmId);
     }
  };

  const toggleSelectAll = () => {
    if (selectedTweets.length === tweets.length && tweets.length > 0) {
      setSelectedTweets([]);
    } else {
      setSelectedTweets(tweets.map((t: any) => t.id));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedTweets(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  };

  return (
    <div className="p-6 w-full flex flex-col h-full bg-[var(--bg-color)]">
      {/* Header Section */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-[var(--text-color)]">Content Moderation</h1>
          <p className="text-[var(--text-muted)] text-xs mt-0.5">Review and manage {meta?.total?.toLocaleString() || 'all'} platform posts</p>
        </div>

        {feedback && (
          <div className={`px-4 py-2 rounded-lg text-xs font-bold ${feedback.startsWith('❌') ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
            {feedback}
          </div>
        )}
      </div>

      {/* Advanced Filter Bar & Bulk Actions */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4 items-center justify-between bg-[var(--hover-bg)]/20 p-2 rounded-xl border border-[var(--border-color)]/20">
        
        {/* Bulk Action Context Menu */}
        <AnimatePresence mode="popLayout">
          {selectedTweets.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center gap-3 bg-[var(--color-chirp)]/10 px-3 py-1.5 rounded-lg border border-[var(--color-chirp)]/20"
            >
              <button onClick={toggleSelectAll} className="text-[var(--color-chirp)] flex items-center justify-center">
                 <CheckSquare size={16} />
              </button>
              <span className="text-xs font-bold text-[var(--color-chirp)]">{selectedTweets.length} selected</span>
              <div className="w-px h-4 bg-[var(--color-chirp)]/20"></div>
              <button disabled={isBulkLoading} onClick={() => setConfirmId('bulk')} className="text-xs font-bold text-red-500 hover:text-red-400 transition-colors disabled:opacity-50">Delete Selected</button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="flex items-center gap-3 w-full sm:w-auto"
            >
              <button onClick={toggleSelectAll} className="px-3 py-1.5 text-[var(--text-muted)] hover:text-[var(--text-color)] flex items-center gap-2">
                 <Square size={16} /> <span className="text-xs font-bold">Select All</span>
              </button>
              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="text"
                  value={q}
                  onChange={(e) => { setQ(e.target.value); setPage(1); }}
                  placeholder="Search post content..."
                  className="w-full bg-[var(--bg-color)] border border-[var(--border-color)]/30 rounded-lg pl-8 pr-3 py-1.5 text-[var(--text-color)] text-xs placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--color-chirp)] focus:ring-1 focus:ring-[var(--color-chirp)] transition-all"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pagination Indicator Top */}
        <div className="text-xs text-[var(--text-muted)] font-medium">
          {meta?.total ? `Showing ${(meta.current_page - 1) * meta.per_page + 1}-${Math.min(meta.current_page * meta.per_page, meta.total)} of ${meta.total}` : ''}
        </div>
      </div>

      {/* Grid / List View */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-[var(--color-chirp)]" size={24} /></div>
      ) : tweets.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-sm text-[var(--text-muted)]">No posts found</div>
      ) : (
        <div className={`flex-1 overflow-y-auto hide-scrollbar pb-6 transition-opacity ${isFetching || isBulkLoading ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 min-[1920px]:grid-cols-6 gap-3">
            {tweets.map((tweet: any) => {
              const isSelected = selectedTweets.includes(tweet.id);
              return (
                <div 
                  key={tweet.id} 
                  className={`bg-[var(--bg-color)] border rounded-xl overflow-hidden flex flex-col transition-all duration-200 cursor-pointer ${
                    isSelected ? 'border-[var(--color-chirp)] ring-1 ring-[var(--color-chirp)] bg-[var(--color-chirp)]/5' : 'border-[var(--border-color)]/30 hover:border-white/20'
                  }`}
                  onClick={(e) => {
                    // Prevent firing if clicking on standard interactive elements inside
                    if ((e.target as HTMLElement).closest('button')) return;
                    toggleSelect(tweet.id);
                  }}
                >
                  <div className="p-3 flex items-start gap-3">
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleSelect(tweet.id); }} 
                      className="mt-1 text-[var(--text-muted)] hover:text-[var(--color-chirp)]"
                    >
                      {isSelected ? <CheckSquare size={16} className="text-[var(--color-chirp)]" /> : <Square size={16} />}
                    </button>
                    
                    <img
                      src={tweet.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(tweet.user?.name ?? 'U')}&background=1a1a1a&color=fff`}
                      alt=""
                      className="w-8 h-8 rounded-full border border-[var(--border-color)]/20 flex-shrink-0"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-xs font-bold text-[var(--text-color)] truncate max-w-[120px]">{tweet.user?.name}</span>
                        <span className="text-[10px] text-[var(--text-muted)] truncate max-w-[100px]">@{tweet.user?.username}</span>
                        <span className="text-[10px] text-[var(--text-muted)] ml-auto shrink-0 flex items-center gap-1">
                          {tweet.media?.length > 0 && <ImageIcon size={10} />}
                          {new Date(tweet.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-color)] opacity-90 leading-relaxed whitespace-pre-wrap line-clamp-4" style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}>
                        {tweet.content}
                      </p>
                    </div>

                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmId(tweet.id); }}
                      className="p-1.5 rounded-lg text-red-500/50 hover:bg-red-500/10 hover:text-red-500 transition-all flex-shrink-0"
                      title="Delete post"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Media Preview if attached */}
                  {tweet.media?.length > 0 && (
                    <div className="mt-auto px-3 pb-3 pl-14">
                      <div className="relative h-24 rounded-lg overflow-hidden border border-[var(--border-color)]/20">
                        {tweet.media[0].type === 'image' ? (
                          <img src={tweet.media[0].url} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-black/50 flex items-center justify-center"><span className="text-[10px] opacity-50">Video Content</span></div>
                        )}
                        {tweet.media.length > 1 && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <span className="text-white text-xs font-bold">+{tweet.media.length - 1} more</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination Controls Footer */}
          {meta && meta.last_page > 1 && (
            <div className="mt-4 p-3 border border-[var(--border-color)]/20 rounded-xl bg-[var(--hover-bg)]/20 flex items-center justify-between">
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

      {/* Delete Confirmation Modal */}
      {confirmId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[var(--bg-color)] border border-[var(--border-color)]/30 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
          >
            <h2 className="text-[var(--text-color)] font-black text-lg mb-1">
               Delete {confirmId === 'bulk' ? 'Multiple Posts' : 'Post'}
            </h2>
            <p className="text-[var(--text-muted)] text-xs mb-6 leading-relaxed">
              Are you sure you want to delete {confirmId === 'bulk' ? <strong className="text-[var(--text-color)]">{selectedTweets.length} selected posts</strong> : 'this post'}? This action is permanently irreversible.
            </p>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setConfirmId(null)} className="px-4 py-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-color)] hover:bg-[var(--hover-bg)] text-xs font-bold transition-all">
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteMut.isPending || isBulkLoading}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center min-w-[80px]"
              >
                {deleteMut.isPending || isBulkLoading ? <Loader2 size={14} className="animate-spin" /> : 'Delete'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
