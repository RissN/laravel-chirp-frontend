export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  bio: string | null;
  avatar: string | null;
  header_image: string | null;
  location: string | null;
  website: string | null;
  birth_date: string | null;
  is_verified: boolean;
  is_private: boolean;
  followers_count: number;
  following_count: number;
  tweets_count: number;
  joined_at: string;
  is_following: boolean;
  is_followed_by: boolean;
  follow_status: 'pending' | 'accepted' | null;
}

export interface Tweet {
  id: number;
  content: string | null;
  media: string[] | null;
  tweet_type: 'tweet' | 'reply' | 'retweet' | 'quote';
  likes_count: number;
  replies_count: number;
  retweets_count: number;
  bookmarks_count: number;
  views_count: number;
  created_at: string;
  updated_at: string;
  user: User;
  parent?: Tweet | null;
  original_tweet?: Tweet | null;
  is_liked: boolean;
  is_retweeted: boolean;
  is_bookmarked: boolean;
}

export interface Notification {
  id: number;
  actor: User;
  type: 'like' | 'retweet' | 'follow' | 'reply' | 'mention' | 'quote';
  data: any;
  read_at: string | null;
  created_at: string;
  notifiable: Tweet | User | null;
}

export interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string | null;
  media: string[] | null;
  read_at: string | null;
  created_at: string;
  sender: User;
}

export interface Conversation {
  id: number;
  other_user: User;
  last_message: Message | null;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    path: string;
    per_page: number;
    to: number;
    total: number;
  };
  success: boolean;
  message?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}
