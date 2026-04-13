import { useInfiniteQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { getUserFollowers, getUserFollowing } from '../../api/users';
import Avatar from '../ui/Avatar';
import { Link } from 'react-router-dom';
import Button from '../ui/Button';

interface FollowListModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  type: 'followers' | 'following';
}

export default function FollowListModal({ isOpen, onClose, username, type }: FollowListModalProps) {
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['follow-list', username, type],
    queryFn: ({ pageParam = 1 }) => 
      type === 'followers' 
        ? getUserFollowers(username, pageParam) 
        : getUserFollowing(username, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => 
      lastPage.meta?.current_page < lastPage.meta?.last_page ? lastPage.meta.current_page + 1 : undefined,
    enabled: isOpen && !!username
  });

  const users = data?.pages.flatMap(page => page.data) || [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={type === 'followers' ? 'Followers' : 'Following'}>
      <div className="max-h-[60vh] overflow-y-auto px-2 pb-4 hide-scrollbar">
        {isLoading ? (
          <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-[var(--color-chirp)]" /></div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-[var(--text-muted)]">
            {type === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
          </div>
        ) : (
          <div className="space-y-4">
            {users.map((user: any) => (
              <div key={user.id} className="flex flex-col gap-2 p-3 bg-[var(--hover-bg)]/50 rounded-xl">
                 <div className="flex items-center gap-3">
                   <Link to={`/${user.username}`} onClick={onClose}>
                     <Avatar name={user.name} src={user.avatar} username={user.username} size="sm" />
                   </Link>
                   <div className="flex-1 min-w-0">
                     <Link to={`/${user.username}`} onClick={onClose} className="font-bold text-[var(--text-color)] hover:underline truncate block">
                       {user.name}
                     </Link>
                     <div className="text-[var(--text-muted)] text-sm truncate">@{user.username}</div>
                   </div>
                   {/* Could add a follow button here if needed, but keeping it simple for now */}
                   <Link to={`/${user.username}`} onClick={onClose}>
                      <Button variant="outline" size="sm" className="h-8 py-0 px-3 text-xs">Profile</Button>
                   </Link>
                 </div>
                 {user.bio && (
                   <p className="text-sm text-[var(--text-color)] mt-1 ml-11 line-clamp-2">{user.bio}</p>
                 )}
              </div>
            ))}
            
            {hasNextPage && (
              <div className="flex justify-center pt-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => fetchNextPage()} 
                  isLoading={isFetchingNextPage}
                >
                  Load More
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
