import { Fragment, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { getTimeline, getForYouTimeline } from '../../api/tweets';
import TweetComposer from '../../components/tweet/TweetComposer';
import TweetCard from '../../components/tweet/TweetCard';


type TabType = 'for-you' | 'following';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('for-you');

  const forYouQuery = useInfiniteQuery({
    queryKey: ['timeline-for-you'],
    queryFn: ({ pageParam = 1 }) => getForYouTimeline(pageParam as number),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.meta.current_page < lastPage.meta.last_page) {
        return lastPage.meta.current_page + 1;
      }
      return undefined;
    },
    enabled: activeTab === 'for-you',
  });

  const followingQuery = useInfiniteQuery({
    queryKey: ['timeline'],
    queryFn: ({ pageParam = 1 }) => getTimeline(pageParam as number),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.meta.current_page < lastPage.meta.last_page) {
        return lastPage.meta.current_page + 1;
      }
      return undefined;
    },
    enabled: activeTab === 'following',
  });

  const activeQuery = activeTab === 'for-you' ? forYouQuery : followingQuery;
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } = activeQuery;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const bottom = e.currentTarget.scrollHeight - e.currentTarget.scrollTop === e.currentTarget.clientHeight;
    if (bottom && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  return (
    <div 
      className="h-screen overflow-y-auto hide-scrollbar animate-fade-in" 
      onScroll={handleScroll}
    >
      {/* Twitter-style Tab Header */}
      <div className="sticky-header">
        <div className="home-tabs">
          <button
            className={`home-tab ${activeTab === 'for-you' ? 'home-tab-active' : ''}`}
            onClick={() => setActiveTab('for-you')}
          >
            <span className="home-tab-label">For you</span>
            {activeTab === 'for-you' && <div className="home-tab-indicator" />}
          </button>
          <button
            className={`home-tab ${activeTab === 'following' ? 'home-tab-active' : ''}`}
            onClick={() => setActiveTab('following')}
          >
            <span className="home-tab-label">Following</span>
            {activeTab === 'following' && <div className="home-tab-indicator" />}
          </button>
        </div>
      </div>

      <TweetComposer />

      {/* Timeline Feed */}
      <div className="pb-20">
        {status === 'pending' ? (
          <div className="flex justify-center p-8">
            <Loader2 className="animate-spin text-[var(--color-chirp)] w-8 h-8" />
          </div>
        ) : status === 'error' ? (
          <div className="p-4 text-center text-red-500">Error loading timeline</div>
        ) : (
          <>
            {data.pages.map((page, i) => (
              <Fragment key={i}>
                {page.data.map((tweet: any) => (
                  <TweetCard key={tweet.id} tweet={tweet} />
                ))}
              </Fragment>
            ))}
            
            {isFetchingNextPage && (
              <div className="flex justify-center p-4">
                <Loader2 className="animate-spin text-[var(--color-chirp)] w-6 h-6" />
              </div>
            )}
            
            {!hasNextPage && data.pages[0].data.length > 0 && (
              <div className="p-4 text-center text-sm text-[var(--text-muted)]">
                You have caught up with all tweets.
              </div>
            )}
            
            {data.pages[0].data.length === 0 && (
              <div className="p-8 text-center text-[var(--text-muted)]">
                {activeTab === 'following' 
                  ? 'Welcome to Chirp! Start following people to see tweets here.'
                  : 'No popular tweets yet. Be the first to post!'
                }
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
