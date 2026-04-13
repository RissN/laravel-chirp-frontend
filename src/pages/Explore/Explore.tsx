import { useSearchParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Hash } from 'lucide-react';
import { getExplore } from '../../api/tweets';
import { searchAll } from '../../api/search';
import { toggleFollowUser } from '../../api/users';
import TweetCard from '../../components/tweet/TweetCard';
import Avatar from '../../components/ui/Avatar';

export default function Explore() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q');
  const queryClient = useQueryClient();

  const followMutation = useMutation({
    mutationFn: (username: string) => toggleFollowUser(username),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['search', q] });
    }
  });

  // Search logic
  const { data: searchResults, isLoading: isSearchLoading } = useQuery({
    queryKey: ['search', q],
    queryFn: () => searchAll(q!),
    enabled: !!q
  });

  // Explore logic
  const { data: exploreData, isLoading: isExploreLoading } = useQuery({
    queryKey: ['explore'],
    queryFn: () => getExplore(1),
    enabled: !q
  });

  if (q) {
    return (
      <div className="min-h-screen">
        <div className="sticky top-0 z-10 bg-[var(--bg-color)]/80 backdrop-blur-md border-b border-[var(--border-color)] p-4">
          <h1 className="text-xl font-bold">Search results for "{q}"</h1>
        </div>

        {isSearchLoading ? (
          <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-[var(--color-chirp)]" /></div>
        ) : (
          <div>
            {searchResults?.data?.users?.length && searchResults.data.users.length > 0 ? (
              <div className="border-b border-[var(--border-color)]">
                <h2 className="px-4 py-3 font-bold text-lg">People</h2>
                {searchResults.data.users.map((user: any) => (
                  <div key={user.id} className="flex items-center gap-3 p-4 hover:bg-[var(--hover-bg)] border-t border-[var(--border-color)] transition-colors">
                    <Avatar name={user.name} src={user.avatar} size="md" username={user.username} />
                    <div className="flex-1 min-w-0 pr-2">
                      <Link to={`/${user.username}`} className="font-bold hover:underline block truncate">{user.name}</Link>
                      <p className="text-[var(--text-muted)] text-[15px]">@{user.username}</p>
                    </div>
                    <button
                      onClick={() => followMutation.mutate(user.username)}
                      disabled={followMutation.isPending}
                      className="px-4 py-1.5 text-[14px] font-black rounded-full bg-[var(--text-color)] text-[var(--bg-color)] hover:opacity-90 transition-all active:scale-95 whitespace-nowrap"
                    >
                      Follow
                    </button>
                  </div>
                ))}
              </div>
            ) : null}

            <h2 className="px-4 py-3 font-bold text-lg">Tweets</h2>
            {searchResults?.data?.tweets?.length && searchResults.data.tweets.length > 0 ? (
              searchResults.data.tweets.map((tweet: any) => (
                <TweetCard key={tweet.id} tweet={tweet} />
              ))
            ) : (
              <div className="p-8 text-center text-[var(--text-muted)]">No tweets found.</div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Render Explore timeline
  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-10 bg-[var(--bg-color)]/80 backdrop-blur-md border-b border-[var(--border-color)] p-4">
        <h1 className="text-xl font-bold">Explore</h1>
      </div>

      <div className="p-8 border-b border-[var(--border-color)] bg-[var(--hover-bg)] flex items-center gap-4">
        <div className="p-4 bg-[var(--color-chirp)]/10 rounded-2xl text-[var(--color-chirp)]">
           <Hash size={40} />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Trending across Chirp</h2>
          <p className="text-[var(--text-muted)] mt-1">See what's happening right now.</p>
        </div>
      </div>

      <div>
        {isExploreLoading ? (
          <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-[var(--color-chirp)]" /></div>
        ) : (
          exploreData?.data?.map((tweet: any) => (
            <TweetCard key={tweet.id} tweet={tweet} />
          ))
        )}
      </div>
    </div>
  );
}
