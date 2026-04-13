import { useQuery } from '@tanstack/react-query';
import { Loader2, Bookmark } from 'lucide-react';
import TweetCard from '../../components/tweet/TweetCard';
import { getBookmarks } from '../../api/bookmarks';
import { useAuthStore } from '../../store/authStore';

export default function Bookmarks() {
  const { user } = useAuthStore();
  const { data, isLoading } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: () => getBookmarks(1)
  });

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-10 bg-[var(--bg-color)]/80 backdrop-blur-md border-b border-[var(--border-color)] p-4">
        <h1 className="text-xl font-bold text-[var(--text-color)]">Bookmarks</h1>
        <p className="text-xs text-[var(--text-muted)]">@{user?.username || 'user'}</p>
      </div>

      <div>
        {isLoading ? (
          <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-[var(--color-chirp)]" /></div>
        ) : !data?.data || data.data.length === 0 ? (
          <div className="p-12 text-center max-w-sm mx-auto">
            <Bookmark className="mx-auto text-[var(--color-chirp)] mb-4" size={48} />
            <h2 className="text-3xl font-bold text-[var(--text-color)]">Save Tweets for later</h2>
            <p className="text-[var(--text-muted)] mt-2">
              Don't let the good ones fly away! Bookmark Tweets to easily find them again in the future.
            </p>
          </div>
        ) : (
          data.data.map((tweet: any) => (
            <TweetCard key={tweet.id} tweet={tweet} />
          ))
        )}
      </div>
    </div>
  );
}
