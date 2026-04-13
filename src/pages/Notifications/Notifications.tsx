import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, Repeat2, User as UserIcon, MessageSquare, AtSign, Loader2, Feather, ShieldAlert, Info } from 'lucide-react';
import { getNotifications, markNotificationsAsRead } from '../../api/notifications';
import Avatar from '../../components/ui/Avatar';
import { formatDistanceToNow } from 'date-fns';

export default function Notifications() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => getNotifications(1)
  });

  const markReadMutation = useMutation({
    mutationFn: markNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const renderNotificationIcon = (type: string) => {
    switch (type) {
      case 'like': return <Heart fill="#f91880" className="text-[#f91880]" size={24} />;
      case 'retweet': return <Repeat2 className="text-green-500" size={24} />;
      case 'follow': return <UserIcon fill="#1da1f2" className="text-[#1da1f2]" size={24} />;
      case 'reply': return <MessageSquare className="text-[var(--color-chirp)]" size={24} />;
      case 'mention': return <AtSign className="text-[var(--color-chirp)]" size={24} />;
      case 'quote': return <Feather className="text-[var(--color-chirp)]" size={24} />;
      case 'account_suspended': return <ShieldAlert className="text-red-500" size={24} />;
      case 'report_resolved': return <Info className="text-purple-500" size={24} />;
      default: return null;
    }
  };

  const renderNotificationText = (notif: any) => {
    const actorName = notif.actor?.name || 'Someone';
    switch (notif.type) {
      case 'like': return <><b>{actorName}</b> liked your tweet</>;
      case 'retweet': return <><b>{actorName}</b> retweeted your tweet</>;
      case 'follow': return <><b>{actorName}</b> followed you</>;
      case 'reply': return <><b>{actorName}</b> replied to your tweet</>;
      case 'mention': return <><b>{actorName}</b> mentioned you in a tweet</>;
      case 'quote': return <><b>{actorName}</b> quoted your tweet</>;
      case 'account_suspended': return <><b>Chirp Team</b> restricted your account</>;
      case 'report_resolved': return <><b>Chirp Team</b> updated your report</>;
      default: return <><b>{actorName}</b> interacted with you</>;
    }
  };

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-10 bg-[var(--bg-color)]/80 backdrop-blur-md border-b border-[var(--border-color)] flex justify-between items-center p-4">
        <h1 className="text-xl font-bold">Notifications</h1>
        <button 
          onClick={() => markReadMutation.mutate()} 
          className="text-sm text-[var(--color-chirp)] hover:underline"
          disabled={markReadMutation.isPending}
        >
          Mark all as read
        </button>
      </div>

      <div className="flex border-b border-[var(--border-color)]">
        <button className="flex-1 p-4 font-bold hover:bg-[var(--hover-bg)] transition relative text-[var(--color-chirp)]">
          All
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-[var(--color-chirp)] rounded-t-full" />
        </button>
        <button className="flex-1 p-4 font-normal text-[var(--text-muted)] hover:bg-[var(--hover-bg)] transition">
          Verified
        </button>
        <button className="flex-1 p-4 font-normal text-[var(--text-muted)] hover:bg-[var(--hover-bg)] transition">
          Mentions
        </button>
      </div>

      <div>
        {isLoading ? (
          <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-[var(--color-chirp)]" /></div>
        ) : !data?.data || data.data.length === 0 ? (
          <div className="p-12 text-center">
            <h2 className="text-3xl font-bold">No notifications yet</h2>
            <p className="text-[var(--text-muted)] mt-2">When people interact with you, it will show up here.</p>
          </div>
        ) : (
          data.data.map((notif: any) => (
            <div key={notif.id} className={`p-4 border-b border-[var(--border-color)] hover:bg-[var(--hover-bg)] transition flex gap-4 cursor-pointer ${!notif.read_at ? 'bg-[var(--color-chirp)]/5' : ''}`}>
              <div className="pt-1">
                {renderNotificationIcon(notif.type)}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                   {notif.type === 'account_suspended' || notif.type === 'report_resolved' ? (
                     <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center">
                       <ShieldAlert size={16} className="text-white" />
                     </div>
                   ) : (
                     <Avatar name={notif.actor?.name} src={notif.actor?.avatar} size="sm" username={notif.actor?.username} />
                   )}
                   <span className="text-xs text-[var(--text-muted)]">{formatDistanceToNow(new Date(notif.created_at))} ago</span>
                </div>
                <p className="text-[var(--text-color)]">{renderNotificationText(notif)}</p>
                
                {notif.notifiable?.content && notif.type !== 'account_suspended' && notif.type !== 'report_resolved' && (
                  <p className="text-[var(--text-muted)] text-sm mt-2 line-clamp-2 italic border-l-2 border-[var(--border-color)] pl-3">
                    "{notif.notifiable.content}"
                  </p>
                )}

                {notif.type === 'account_suspended' && notif.data?.reason && (
                  <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <p className="text-red-400 text-sm font-medium">Account Suspended</p>
                    <p className="text-red-400/80 text-sm mt-1">{notif.data.reason}</p>
                    {notif.data.until && <p className="text-red-400/60 text-xs mt-2">Until: {notif.data.until}</p>}
                  </div>
                )}

                {notif.type === 'report_resolved' && notif.data && (
                  <div className="mt-3 p-3 bg-white/5 border border-white/10 rounded-xl">
                    <p className="text-white text-sm">Your recent report has been marked as <b>{notif.data.status}</b>.</p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
