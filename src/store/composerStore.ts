import { create } from 'zustand';

interface ComposerState {
  isOpen: boolean;
  type: 'tweet' | 'reply';
  parentTweet: any | null;
  openComposer: (type?: 'tweet' | 'reply', parentTweet?: any) => void;
  closeComposer: () => void;
}

export const useComposerStore = create<ComposerState>((set) => ({
  isOpen: false,
  type: 'tweet',
  parentTweet: null,
  openComposer: (type = 'tweet', parentTweet = null) => set({ isOpen: true, type, parentTweet }),
  closeComposer: () => set({ isOpen: false, parentTweet: null }),
}));
