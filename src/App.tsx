import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useNotificationStore } from './store/notificationStore';
import { useThemeStore } from './store/themeStore';
import { useEffect } from 'react';
import { getMe } from './api/auth';
import { initEcho } from './api/echo';
import MainLayout from './components/layout/MainLayout';

import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Home from './pages/Home/Home';
import Explore from './pages/Explore/Explore';
import Notifications from './pages/Notifications/Notifications';
import Messages from './pages/Messages/Messages';
import Bookmarks from './pages/Bookmarks/Bookmarks';
import Profile from './pages/Profile/Profile';
import TweetDetail from './pages/Tweet/TweetDetail';
import Settings from './pages/Settings/Settings';

// Admin Panel
import AdminLogin from './pages/Admin/Login';
import AdminLayout from './pages/Admin/Layout/AdminLayout';
import AdminDashboard from './pages/Admin/Dashboard';
import AdminUsers from './pages/Admin/UsersManager';
import AdminModeration from './pages/Admin/Moderation';
import AdminReports from './pages/Admin/Reports';
import AdminAuditLogs from './pages/Admin/AuditLogs';
import { useAdminStore } from './store/adminStore';

function App() {
  const { token, user, setUser, logout, isAuthenticated } = useAuthStore();
  const { incrementUnreadCount } = useNotificationStore();
  const { isDark } = useThemeStore();
  const { isAuthenticated: isAdminAuthenticated } = useAdminStore();

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  useEffect(() => {
    const fetchUser = async () => {
      if (token && !user) {
        try {
          const res = await getMe();
          setUser(res.data);
        } catch (error) {
          logout();
        }
      }
    };
    fetchUser();
  }, [token, user, setUser, logout]);

  // WebSocket Subscription
  useEffect(() => {
    if (token && user) {
      const echo = initEcho(token);
      
      echo.private(`user.${user.id}.notifications`)
        .listen('.notification.created', (_e: any) => {
          incrementUnreadCount();
        });

      echo.private(`user.${user.id}.messages`)
        .listen('.message.new', (_e: any) => {
          // You could also increment a message unread count here if needed
        });

      return () => {
        echo.leave(`user.${user.id}.notifications`);
        echo.leave(`user.${user.id}.messages`);
      };
    }
  }, [token, user, incrementUnreadCount]);

  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/home" />} />
      <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/home" />} />
      
      {/* Private Routes inside MainLayout */}
      <Route path="/" element={isAuthenticated ? <MainLayout /> : <Navigate to="/login" />}>
        <Route index element={<Navigate to="/home" />} />
        <Route path="home" element={<Home />} />
        <Route path="explore" element={<Explore />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="messages" element={<Messages />} />
        <Route path="bookmarks" element={<Bookmarks />} />
        <Route path="settings" element={<Settings />} />
        <Route path="tweet/:id" element={<TweetDetail />} />
        <Route path=":username" element={<Profile />} />
      </Route>
      {/* Admin Panel (Isolated) */}
      <Route path="/admin/login" element={isAdminAuthenticated ? <Navigate to="/admin" /> : <AdminLogin />} />
      <Route path="/admin" element={isAdminAuthenticated ? <AdminLayout /> : <Navigate to="/admin/login" />}>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="moderation" element={<AdminModeration />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="logs" element={<AdminAuditLogs />} />
      </Route>
    </Routes>
  );
}

export default App;
