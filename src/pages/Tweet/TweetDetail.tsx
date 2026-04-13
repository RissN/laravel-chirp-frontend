import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Fragment } from 'react';
import { getTweetDetail, getTweetReplies } from '../../api/tweets';
import TweetCard from '../../components/tweet/TweetCard';
import TweetComposer from '../../components/tweet/TweetComposer';

export default function TweetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: tweetData, isLoading } = useQuery({
    queryKey: ['tweet', id],
    queryFn: () => getTweetDetail(Number(id)),
    enabled: !!id
  });

  const {
    data: repliesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status: repliesStatus
  } = useInfiniteQuery({
    queryKey: ['replies', id],
    queryFn: ({ pageParam = 1 }) => getTweetReplies(Number(id), pageParam as number),
    initialPageParam: 1,
    getNextPageParam: (lastPage: any) => {
      if (lastPage.meta.current_page < lastPage.meta.last_page) {
        return lastPage.meta.current_page + 1;
      }
      return undefined;
    },
    enabled: !!id
  });

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const bottom = e.currentTarget.scrollHeight - e.currentTarget.scrollTop <= e.currentTarget.clientHeight + 100;
    if (bottom && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  return (
    <div className="h-screen overflow-y-auto hide-scrollbar animate-fade-in" onScroll={handleScroll}>
      <div className="sticky top-0 z-10 bg-[var(--bg-color)]/80 backdrop-blur-md border-b border-[var(--border-color)] p-4 flex gap-6 items-center">
        <ArrowLeft size={20} className="cursor-pointer hover:bg-[var(--hover-bg)] rounded-full transition" onClick={() => navigate(-1)} />
        <h1 className="text-xl font-bold">Post</h1>
      </div>

      {isLoading ? (
        <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-[var(--color-chirp)] w-8 h-8" /></div>
      ) : tweetData?.data ? (
        <>
          <TweetCard tweet={tweetData.data} />
          <TweetComposer isReply={true} parentId={tweetData.data.id} replyingTo={tweetData.data.user.username} />
          
          <div className="pb-20">
            {repliesStatus === 'pending' ? (
              <div className="flex justify-center p-8">
                <Loader2 className="animate-spin text-[var(--color-chirp)] w-6 h-6" />
              </div>
            ) : repliesStatus === 'error' ? (
              <div className="p-4 text-center text-red-500">Error loading replies</div>
            ) : (
              <>
                {repliesData.pages.map((page: any, i: number) => (
                  <Fragment key={i}>
                    {page.data.map((reply: any) => (
                      <TweetCard key={reply.id} tweet={reply} />
                    ))}
                  </Fragment>
                ))}
                
                {isFetchingNextPage && (
                  <div className="flex justify-center p-4">
                    <Loader2 className="animate-spin text-[var(--color-chirp)] w-6 h-6" />
                  </div>
                )}
                
                {repliesData.pages[0].data.length === 0 && (
                  <div className="p-8 text-center text-[var(--text-muted)]">
                    No replies yet. Be the first!
                  </div>
                )}
              </>
            )}
          </div>
        </>
      ) : (
        <div className="p-8 text-center text-[var(--text-muted)]">Tweet not found</div>
      )}
    </div>
  );
}
