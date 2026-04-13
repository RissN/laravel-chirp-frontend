import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-[var(--bg-color)] text-[var(--text-color)] selection:bg-[var(--color-chirp)]/30">
      <AdminSidebar />
      <main className="flex-1 overflow-auto bg-[var(--bg-color)]">
        <Outlet />
      </main>
    </div>
  );
}
