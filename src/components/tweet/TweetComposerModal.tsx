import { Modal } from '../ui/Modal';
import { X } from 'lucide-react';
import { useComposerStore } from '../../store/composerStore';
import TweetComposer from './TweetComposer';
import Avatar from '../ui/Avatar';

export default function TweetComposerModal() {
  const { isOpen, closeComposer, type, parentTweet } = useComposerStore();

  return (
    <Modal isOpen={isOpen} onClose={closeComposer} showCloseButton={false} contentClassName="p-0">
      {/* Custom Header for Modal matching Twitter style */}
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={closeComposer} className="p-2 -ml-2 rounded-full hover:bg-[var(--hover-bg)] text-[var(--text-color)] transition-colors">
          <X size={20} />
        </button>
        <button className="text-[var(--color-chirp)] font-bold text-[15px] hover:underline transition-all">Drafts</button>
      </div>

      {type === 'reply' && parentTweet && (
        <div className="flex gap-4 px-4 pt-4 pb-0 relative">
          <div className="flex flex-col items-center">
            <Avatar name={parentTweet.user.name} src={parentTweet.user.avatar} size="md" linkToProfile={false} />
            <div className="w-[2px] h-full bg-[var(--border-color)] mt-2 rounded-full min-h-[30px]" />
          </div>
          <div className="flex-1 pb-4">
            <div className="flex items-center gap-1 text-[15px]">
              <span className="font-bold text-[var(--text-color)]">{parentTweet.user.name}</span>
              <span className="text-[var(--text-muted)]">@{parentTweet.user.username}</span>
            </div>
            <p className="text-[var(--text-color)] mt-1 text-[15px] break-words line-clamp-3">
              {parentTweet.content}
            </p>
            <div className="text-[var(--text-muted)] text-[13px] mt-3">
              Replying to <span className="text-[var(--color-chirp)]">@{parentTweet.user.username}</span>
            </div>
          </div>
        </div>
      )}
      
      <div className={type === 'reply' ? 'mt-0' : ''}>
        <div className="px-4">
          <TweetComposer 
            isReply={type === 'reply'} 
            parentId={parentTweet?.id} 
            isModal={true}
            onSuccessCallback={closeComposer}
          />
        </div>
      </div>
    </Modal>
  );
}
