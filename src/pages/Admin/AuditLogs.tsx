import { useQuery } from '@tanstack/react-query';
import { getAuditLogs } from '../../api/admin';
import { Loader2 } from 'lucide-react';

const actionColors: Record<string, string> = {
  ban_user: 'text-red-400',
  suspend_user: 'text-yellow-400',
  unban_user: 'text-green-400',
  delete_user: 'text-red-400',
  delete_tweet: 'text-orange-400',
  resolve_report: 'text-blue-400',
};

export default function AdminAuditLogs() {
  const { data, isLoading } = useQuery<any>({
    queryKey: ['admin-logs'],
    queryFn: () => getAuditLogs(),
    refetchInterval: 10000,
  });

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-[var(--text-color)]">Audit Logs</h1>
        <p className="text-[var(--text-muted)] text-sm mt-1">Full trail of all admin actions</p>
      </div>

      <div className="bg-transparent border border-[var(--border-color)]/30 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border-color)]/30">
              <th className="text-left px-6 py-4 text-[var(--text-muted)] font-medium">Admin</th>
              <th className="text-left px-6 py-4 text-[var(--text-muted)] font-medium">Action</th>
              <th className="text-left px-6 py-4 text-[var(--text-muted)] font-medium">Target</th>
              <th className="text-left px-6 py-4 text-[var(--text-muted)] font-medium">IP</th>
              <th className="text-left px-6 py-4 text-[var(--text-muted)] font-medium">Time</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="text-center py-12"><Loader2 className="animate-spin text-[var(--color-chirp)] mx-auto" size={24} /></td></tr>
            ) : data?.data?.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12 text-[var(--text-muted)]">No activity yet</td></tr>
            ) : (
              data?.data?.map((log: any) => (
                <tr key={log.id} className="border-b border-[var(--border-color)]/30 hover:bg-[var(--hover-bg)] transition-all">
                  <td className="px-6 py-4 text-[var(--text-color)] font-medium">{log.admin?.name ?? '—'}</td>
                  <td className="px-6 py-4">
                    <span className={`font-mono text-xs font-bold uppercase tracking-wide ${actionColors[log.action] ?? 'text-[var(--text-muted)]'}`}>
                      {log.action.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[var(--text-muted)] text-xs">
                    <strong className="text-[var(--text-color)] opacity-80">{log.target_type?.split('\\').pop()}</strong> #{log.target_id}
                    {log.meta?.username && <span className="ml-1 text-[var(--text-muted)] opacity-60">(@{log.meta.username})</span>}
                  </td>
                  <td className="px-6 py-4 text-[var(--text-muted)] font-mono text-xs">{log.ip_address ?? '—'}</td>
                  <td className="px-6 py-4 text-[var(--text-muted)] opacity-70 text-xs">{new Date(log.created_at).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
