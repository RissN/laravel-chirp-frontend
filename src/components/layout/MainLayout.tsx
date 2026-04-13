import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Search, Bell, Mail, Bookmark } from 'lucide-react';
import Sidebar from './Sidebar';
import RightPanel from './RightPanel';
import TweetComposerModal from '../tweet/TweetComposerModal';
import { useNotificationStore } from '../../store/notificationStore';

export default function MainLayout() {
  const location = useLocation();
  const { unreadCount } = useNotificationStore();

  const mobileNavLinks = [
    { name: 'Home', path: '/home', icon: Home },
    { name: 'Explore', path: '/explore', icon: Search },
    { name: 'Notifications', path: '/notifications', icon: Bell, badge: unreadCount },
    { name: 'Messages', path: '/messages', icon: Mail },
    { name: 'Bookmarks', path: '/bookmarks', icon: Bookmark },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-color)] text-[var(--text-color)]" style={{ backgroundImage: 'var(--gradient-mesh)' }}>
      <div className="container mx-auto flex max-w-[1300px] justify-center px-2 sm:px-4">
        
        {/* Left Sidebar */}
        <header className={`hidden sm:flex w-20 ${location.pathname.startsWith('/messages') ? '' : 'xl:w-[260px] xl:px-4'} flex-col border-r border-[var(--border-color)]/30 pb-4 pt-2 px-2 sticky top-0 h-screen`}>
          <Sidebar />
        </header>

        {/* Main Feed */}
        <main className={`flex-1 min-h-screen border-r border-[var(--border-color)]/30 w-full pb-16 sm:pb-0 relative ${location.pathname.startsWith('/messages') ? 'max-w-[1000px]' : 'max-w-[640px]'}`}>
          <Outlet />
        </main>

        {/* Right Panel */}
        {!location.pathname.startsWith('/messages') && (
          <aside className="hidden lg:block w-[340px] pl-6 pr-2 pb-3 sticky top-0 h-screen overflow-y-auto hide-scrollbar">
            <RightPanel />
          </aside>
        )}
        
        {/* Mobile Bottom Nav */}
        <nav className="sm:hidden fixed bottom-0 w-full bg-[var(--bg-color)]/90 backdrop-blur-lg border-t border-[var(--border-color)] flex justify-around py-2 px-1 z-50">
          {mobileNavLinks.map((link) => {
            const isActive = location.pathname === link.path ||
              (link.path !== '/home' && location.pathname.startsWith(link.path));
            const Icon = link.icon;
            return (
              <Link
                key={link.name}
                to={link.path}
                className={`
                  flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200
                  ${isActive 
                    ? 'text-[var(--color-chirp)]' 
                    : 'text-[var(--text-muted)] hover:text-[var(--text-color)]'
                  }
                `}
              >
                <div className="relative">
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  {link.badge && link.badge > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                  )}
                </div>
                <span className="text-[10px] font-medium">{link.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      <TweetComposerModal />
    </div>
  );
}
