import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, FileText, Flag, ClipboardList,
  LogOut, ShieldCheck, Feather
} from 'lucide-react';
import { useAdminStore } from '../../../store/adminStore';
import { adminLogout } from '../../../api/admin';

const navItems = [
  { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, end: true },
  { name: 'Users', path: '/admin/users', icon: Users },
  { name: 'Posts', path: '/admin/moderation', icon: FileText },
  { name: 'Reports', path: '/admin/reports', icon: Flag },
  { name: 'Audit Logs', path: '/admin/logs', icon: ClipboardList },
];

export default function AdminSidebar() {
  const { admin, logout } = useAdminStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try { await adminLogout(); } catch (_) {}
    logout();
    navigate('/admin/login');
  };

  return (
    <aside className="w-64 sticky top-0 h-screen bg-[var(--bg-color)] border-r border-[var(--border-color)]/30 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-[var(--border-color)]/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[var(--color-chirp)] rounded-xl flex items-center justify-center">
            <ShieldCheck size={20} className="text-white" />
          </div>
          <div>
            <p className="font-black text-[var(--text-color)] text-sm">Admin Panel</p>
            <p className="text-[var(--text-muted)] text-xs flex items-center gap-1">
              <Feather size={10} /> Chirp
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[var(--color-chirp)]/10 text-[var(--color-chirp)] font-bold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-color)] hover:bg-[var(--hover-bg)]'
              }`
            }
          >
            <item.icon size={18} />
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* Admin Info */}
      <div className="p-4 border-t border-[var(--border-color)]/30">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--hover-bg)] mb-3 border border-[var(--border-color)]/10">
          <div className="w-8 h-8 rounded-xl bg-[var(--color-chirp)] flex items-center justify-center text-white font-bold text-sm">
            {admin?.name?.[0]?.toUpperCase() ?? 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[var(--text-color)] text-sm font-bold truncate">{admin?.name ?? 'Admin'}</p>
            <p className="text-[var(--text-muted)] text-xs capitalize">{admin?.role ?? 'moderator'}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
