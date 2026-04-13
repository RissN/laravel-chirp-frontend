import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { updateSettings } from '../../api/users';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../components/ui/ToastProvider';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Settings() {
  const { user, setUser } = useAuthStore();
  const { showToast } = useToast();
  
  const [form, setForm] = useState({
    email: user?.email || '',
    current_password: '',
    new_password: '',
    new_password_confirmation: ''
  });
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (user?.email && form.email !== user.email && !form.email) {
      setForm(prev => ({ ...prev, email: user.email }));
    }
  }, [user]);

  const settingsMutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: (res) => {
      if (res.data) setUser(res.data);
      setForm(prev => ({ 
        ...prev, 
        current_password: '', 
        new_password: '', 
        new_password_confirmation: '' 
      }));
      setError('');
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 3000);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to update settings';
      setError(msg);
      showToast(msg, 'error');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Basic validation
    if (!form.email.trim()) {
      setError('Email is required');
      return;
    }
    if (form.new_password && form.new_password !== form.new_password_confirmation) {
      setError('New passwords do not match');
      return;
    }
    if (form.new_password && form.new_password.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }

    settingsMutation.mutate(form);
  };

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-10 bg-[var(--bg-color)]/80 backdrop-blur-md border-b border-[var(--border-color)] p-4">
        <h1 className="text-xl font-bold">Settings</h1>
      </div>
      
      <div className="p-4 sm:p-8 max-w-2xl">
        <h2 className="text-lg font-bold mb-6">Account Settings</h2>
        
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8" noValidate>
          <div className="space-y-4">
            <h3 className="font-bold text-[var(--text-color)] border-b border-[var(--border-color)]/50 pb-2">Account Information</h3>
            <Input 
              label="Email Address" 
              type="email" 
              value={form.email} 
              onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))} 
            />
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-[var(--text-color)] border-b border-[var(--border-color)]/50 pb-2">Change Password</h3>
            <p className="text-sm text-[var(--text-muted)] mb-4">Leave blank if you don't want to change your password.</p>
            
            <Input 
              label="Current Password" 
              type="password" 
              value={form.current_password} 
              onChange={(e) => setForm(prev => ({ ...prev, current_password: e.target.value }))} 
            />
            <Input 
              label="New Password" 
              type="password" 
              value={form.new_password} 
              onChange={(e) => setForm(prev => ({ ...prev, new_password: e.target.value }))} 
            />
            <Input 
              label="Confirm New Password" 
              type="password" 
              value={form.new_password_confirmation} 
              onChange={(e) => setForm(prev => ({ ...prev, new_password_confirmation: e.target.value }))} 
            />
          </div>

          <div className="pt-4 flex justify-end">
            <AnimatePresence mode="popLayout">
              {isSuccess ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="px-6 py-2.5 bg-green-500/10 text-green-500 border border-green-500/20 rounded-full font-bold flex items-center gap-2"
                >
                  <CheckCircle2 size={20} />
                  Saved Successfully
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Button type="submit" isLoading={settingsMutation.isPending} className="btn-gradient px-8 text-white border-0 shadow-lg active:scale-95">
                    Save Changes
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </form>
      </div>
    </div>
  );
}
