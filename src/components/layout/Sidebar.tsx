import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Bell, Mail, Bookmark, User, LogOut, Feather, Moon, Sun, Plus, Settings } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { useNotificationStore } from '../../store/notificationStore';
import { useComposerStore } from '../../store/composerStore';

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const { unreadCount } = useNotificationStore();
  const { openComposer } = useComposerStore();
  const location = useLocation();
  const isMessagesPage = location.pathname.startsWith('/messages');

  const navLinks = [
    { name: 'Home', path: '/home', icon: Home },
    { name: 'Explore', path: '/explore', icon: Search },
    { name: 'Notifications', path: '/notifications', icon: Bell, badge: unreadCount },
    { name: 'Messages', path: '/messages', icon: Mail },
    { name: 'Bookmarks', path: '/bookmarks', icon: Bookmark },
    { name: 'Profile', path: `/${user?.username}`, icon: User },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center justify-center ${isMessagesPage ? '' : 'xl:justify-start'} px-2 mb-2`}>
        <Link 
          to="/home" 
          className="p-3 rounded-2xl hover:bg-[var(--hover-bg)] transition-all duration-300 group"
        >
          <Feather 
            size={28} 
            className="text-[var(--color-chirp)] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-8deg]" 
            fill="currentColor" 
          />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-1 mt-1">
        {navLinks.map((link, index) => {
          const isActive = location.pathname === link.path || 
            (link.path !== '/home' && location.pathname.startsWith(link.path));
          const Icon = link.icon;
          return (
            <Link
              key={link.name}
              to={link.path}
              className={`
                flex items-center justify-center ${isMessagesPage ? '' : 'xl:justify-start'} gap-4 px-4 py-3 rounded-2xl
                transition-all duration-200 group relative
                ${isActive 
                  ? 'text-[var(--text-color)] font-bold bg-[var(--hover-bg)]/40 after:absolute after:left-1 after:top-1/2 after:-translate-y-1/2 after:w-1 after:h-1/2 after:bg-[var(--color-chirp)] after:rounded-full' 
                  : 'text-[var(--text-color)] hover:bg-[var(--hover-bg)]'
                }
              `}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="relative">
                <Icon 
                  size={24} 
                  className={`transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-[var(--color-chirp)]' : ''}`}
                  strokeWidth={isActive ? 2.5 : 2}
                  fill={isActive && !['Explore', 'Settings'].includes(link.name) ? 'currentColor' : 'none'}
                />
                {link.badge !== undefined && link.badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[var(--color-chirp)] text-white text-[10px] font-bold rounded-full border-2 border-[var(--bg-color)] min-w-[18px] h-[18px] flex items-center justify-center">
                    {link.badge > 99 ? '99+' : link.badge}
                  </span>
                )}
              </div>
              <span className={`hidden ${isMessagesPage ? '' : 'xl:block'} text-[15px] ${isActive ? 'text-[var(--text-color)] font-bold' : ''}`}>
                {link.name}
              </span>
            </Link>
          );
        })}

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={`flex items-center justify-center ${isMessagesPage ? '' : 'xl:justify-start'} gap-4 px-4 py-3 rounded-2xl transition-all duration-200 hover:bg-[var(--hover-bg)] group w-full text-[var(--text-color)]`}
        >
          <div className="transition-transform duration-500 group-hover:rotate-180">
            {isDark ? <Sun size={24} /> : <Moon size={24} />}
          </div>
          <span className={`hidden ${isMessagesPage ? '' : 'xl:block'} text-[15px]`}>
            {isDark ? 'Light Mode' : 'Dark Mode'}
          </span>
        </button>
      </nav>

      {/* Post Button */}
      <div className="px-1 mt-4 mb-6 relative flex justify-center">
        <button onClick={() => openComposer('tweet')} className={`btn-gradient h-12 flex items-center justify-center shadow-lg active:scale-95 ${isMessagesPage ? 'w-12 rounded-full' : 'w-12 xl:w-full xl:h-12'}`}>
          <span className={`hidden ${isMessagesPage ? '' : 'xl:block'} text-[15px] font-bold tracking-wide`}>Post</span>
          <Plus size={24} className={isMessagesPage ? '' : 'xl:hidden'} strokeWidth={3} />
        </button>
      </div>

      {/* User Bottom Card */}
      {user && (
        <div className="px-1 pb-4 flex justify-center w-full">
          <div className={`flex items-center ${isMessagesPage ? 'w-12 h-12 rounded-full p-0 justify-center' : 'w-full p-2 rounded-2xl xl:justify-between'} bg-[var(--hover-bg)]/20 hover:bg-[var(--hover-bg)]/40 border border-[var(--border-color)]/5 transition-all duration-300 cursor-pointer group`}>
            <div className={`flex items-center ${isMessagesPage ? 'justify-center mx-auto' : 'gap-3 min-w-0'}`}>
              <img 
                src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=random`} 
                alt={user.name} 
                className={`shrink-0 rounded-full object-cover ring-2 ring-[var(--color-chirp)]/20 group-hover:ring-[var(--color-chirp)]/50 transition-all ${isMessagesPage ? 'w-10 h-10' : 'w-10 h-10'}`}
              />
              {!isMessagesPage && (
                <div className="hidden xl:block min-w-0">
                  <p className="font-bold text-sm truncate text-[var(--text-color)]">{user.name}</p>
                  <p className="text-xs text-[var(--text-muted)] truncate font-medium">@{user.username}</p>
                </div>
              )}
            </div>
            {!isMessagesPage && (
              <button 
                onClick={(e) => { e.preventDefault(); logout(); }} 
                className="hidden xl:flex p-2 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all duration-200"
                title="Log out"
              >
                <LogOut size={18} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
