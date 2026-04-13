import { useState, useEffect } from 'react';
import { Search, X, Loader2, UserPlus } from 'lucide-react';
import api from '../../api/axios';
import Avatar from '../ui/Avatar';

interface User {
  id: number;
  name: string;
  username: string;
  avatar: string;
}

interface NewMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (user: User) => void;
}

export default function NewMessageModal({ isOpen, onClose, onSelectUser }: NewMessageModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setLoading(true);
        try {
          const res = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
          setResults(res.data.data);
        } catch (error) {
          console.error("Search failed", error);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md glass-card overflow-hidden shadow-2xl animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-color)]/30">
          <h2 className="text-xl font-black text-[var(--text-color)]">New message</h2>
          <button onClick={onClose} className="p-2 hover:bg-[var(--hover-bg)]/50 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-[var(--border-color)]/30">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--color-chirp)] transition-colors" size={18} />
            <input 
              autoFocus
              type="text"
              placeholder="Search people"
              className="w-full pl-10 pr-4 py-2.5 bg-[var(--hover-bg)]/40 border border-transparent focus:border-[var(--color-chirp)]/30 focus:bg-transparent rounded-xl text-[15px] outline-none transition-all"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="animate-spin text-[var(--color-chirp)]" />
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((user) => (
                <button
                  key={user.id}
                  onClick={() => {
                    onSelectUser(user);
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 px-5 py-3 hover:bg-[var(--hover-bg)]/40 transition-colors text-left"
                >
                  <Avatar name={user.name} src={user.avatar} size="sm" linkToProfile={false} />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[15px] text-[var(--text-color)] truncate">{user.name}</p>
                    <p className="text-[13px] text-[var(--text-muted)] truncate">@{user.username}</p>
                  </div>
                  <UserPlus size={18} className="text-[var(--color-chirp)]" />
                </button>
              ))}
            </div>
          ) : query.length >= 2 ? (
            <div className="p-12 text-center text-[var(--text-muted)]">
              <p className="font-bold opacity-60">No results found</p>
            </div>
          ) : (
            <div className="p-12 text-center text-[var(--text-muted)]">
              <Search size={40} className="mx-auto mb-3 opacity-10" />
              <p className="text-sm font-medium opacity-60">Search for people and start chatting.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
