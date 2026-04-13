import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Feather, Eye, EyeOff, ShieldCheck, ArrowRight } from 'lucide-react';
import { adminLogin } from '../../api/admin';
import { useAdminStore } from '../../store/adminStore';
import { motion } from 'framer-motion';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { setToken, setAdmin } = useAdminStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await adminLogin(form);
      setToken(res.data.token);
      setAdmin(res.data.admin);
      navigate('/admin');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed or unauthorized access.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#0a0a0a] overflow-hidden font-sans">
      {/* Dynamic Background Glow Vectors */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[15%] w-[40rem] h-[40rem] bg-[var(--color-chirp)] opacity-[0.03] rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-[10%] right-[10%] w-[30rem] h-[30rem] bg-[var(--color-chirp)] opacity-[0.02] rounded-full blur-[100px] mix-blend-screen" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-[420px] mx-4"
      >
        <div className="bg-[#121212]/80 backdrop-blur-3xl border border-white/5 rounded-[2rem] p-8 sm:p-10 shadow-2xl relative overflow-hidden group">
          
          {/* Subtle Top Border Highlight */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--color-chirp)]/50 to-transparent opacity-50" />

          {/* Header Branding */}
          <div className="flex flex-col items-center mb-10">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 20 }}
              className="w-16 h-16 bg-[var(--color-chirp)]/10 border border-[var(--color-chirp)]/20 rounded-2xl flex items-center justify-center mb-5 relative"
            >
              <div className="absolute inset-0 bg-[var(--color-chirp)] blur-[20px] opacity-20 rounded-2xl" />
              <ShieldCheck size={32} className="text-[var(--color-chirp)] relative z-10" />
            </motion.div>
            <h1 className="text-2xl font-black text-white tracking-tight">Admin Portal</h1>
            <p className="text-white/40 text-sm mt-1.5 flex items-center gap-1.5 font-medium">
              <Feather size={12} /> Chirp HQ Environment
            </p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center font-medium"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-white/50 text-xs font-bold uppercase tracking-wider mb-2 ml-1">Admin Email</label>
              <div className="relative group">
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full bg-white/[0.03] border border-white/[0.05] rounded-xl px-4 py-3.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[var(--color-chirp)]/50 focus:bg-[var(--color-chirp)]/5 transition-all"
                  placeholder="name@chirp.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-white/50 text-xs font-bold uppercase tracking-wider mb-2 ml-1">Password</label>
              <div className="relative group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full bg-white/[0.03] border border-white/[0.05] rounded-xl px-4 py-3.5 pr-12 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[var(--color-chirp)]/50 focus:bg-[var(--color-chirp)]/5 transition-all"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-white/30 hover:text-white/70 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !form.email || !form.password}
              className="w-full py-3.5 mt-2 bg-[var(--color-chirp)] hover:bg-[#ffb03a] text-black font-black rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4 text-black" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Authenticating
                </span>
              ) : (
                <>
                  Secure Login
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>
        
        {/* Footer info */}
        <p className="text-center text-white/20 text-xs font-semibold mt-8">
          Protected System. Unauthorized access is strictly prohibited.
        </p>
      </motion.div>
    </div>
  );
}
