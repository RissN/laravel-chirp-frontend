import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Feather, MessageCircle, TrendingUp, Users, Heart, Sparkles } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { login } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../components/ui/ToastProvider';

export default function Login() {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [bannedMsg, setBannedMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  
  const navigate = useNavigate();
  const { setToken, setUser } = useAuthStore();
  const { showToast } = useToast();

  const validate = () => {
    const errors: { [key: string]: string } = {};
    if (!emailOrUsername.trim()) errors.emailOrUsername = 'Email or username is required';
    if (!password) errors.password = 'Password is required';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    setIsLoading(true);
    setError('');
    setBannedMsg('');
    setFieldErrors({});

    try {
      const isEmail = emailOrUsername.includes('@');
      const credentials = isEmail 
        ? { email: emailOrUsername, password } 
        : { username: emailOrUsername, password };

      const res = await login(credentials);
      
      setToken(res.data.token);
      setUser(res.data.user);
      navigate('/home');
    } catch (err: any) {
      const errorCode = err.response?.data?.error_code;
      const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      if (errorCode === 'account_banned') {
        setBannedMsg(msg);
      } else {
        setError(msg);
        showToast(msg, 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    { icon: MessageCircle, text: 'See what\'s happening in the world right now.' },
    { icon: Users, text: 'Join the conversation with people you care about.' },
    { icon: TrendingUp, text: 'Find out what\'s trending across the globe.' },
    { icon: Heart, text: 'Share moments that matter to you.' },
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[var(--bg-color)]">
      {/* Left Side - Branding Hero */}
      <div className="hidden lg:flex lg:w-[55%] relative items-center justify-center bg-[var(--bg-color)] border-r border-[var(--border-color)]">
        {/* Content */}
        <div className="max-w-lg px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            <div className="flex items-center gap-4 mb-10">
              <div className="p-3 bg-[var(--color-chirp)]/10 rounded-2xl">
                <Feather size={42} className="text-[var(--color-chirp)]" />
              </div>
              <span className="text-[var(--text-color)] text-4xl font-black tracking-tight">Chirp</span>
            </div>

            <h1 className="text-[var(--text-color)] text-[3.2rem] font-black leading-[1.1] tracking-tight mb-8">
              Happening now
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
            className="space-y-5"
          >
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 + i * 0.1, ease: 'easeOut' }}
                className="flex items-center gap-4 group"
              >
                <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-[var(--color-chirp)]/10 flex items-center justify-center group-hover:bg-[var(--color-chirp)]/20 transition-all duration-300">
                  <feature.icon size={20} className="text-[var(--color-chirp)]" />
                </div>
                <p className="text-[var(--text-muted)] text-[15px] font-medium leading-snug">
                  {feature.text}
                </p>
              </motion.div>
            ))}
          </motion.div>

          {/* Decorative bottom text */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 1 }}
            className="mt-14 flex items-center gap-2 text-[var(--text-muted)] text-sm"
          >
            <Sparkles size={14} />
            <span>Join millions of people on Chirp</span>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-[420px]"
        >
          {/* Mobile Logo */}
          <div className="flex lg:hidden justify-center mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[var(--color-chirp)]/10 rounded-xl">
                <Feather size={32} className="text-[var(--color-chirp)]" />
              </div>
              <span className="text-[var(--text-color)] text-2xl font-black">Chirp</span>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-[28px] sm:text-[32px] font-black text-[var(--text-color)] tracking-tight leading-tight">
              Sign in to Chirp
            </h2>
            <p className="text-[var(--text-muted)] mt-2 text-[15px]">
              Welcome back! Please enter your details.
            </p>
          </div>

          {bannedMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-6"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">🚫</span>
                <p className="font-bold text-red-500 text-sm">Account Banned</p>
              </div>
              <p className="text-red-400 text-sm leading-relaxed">{bannedMsg}</p>
              <p className="text-red-400/60 text-xs mt-2">If you believe this is a mistake, please contact support.</p>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 text-red-500 p-4 rounded-xl text-sm mb-6 border border-red-500/20 font-medium"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <Input 
              label="Email or Username"
              value={emailOrUsername}
              onChange={(e) => {
                setEmailOrUsername(e.target.value);
                if (fieldErrors.emailOrUsername) setFieldErrors({ ...fieldErrors, emailOrUsername: '' });
              }}
              error={fieldErrors.emailOrUsername}
            />
            <Input 
              label="Password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: '' });
              }}
              error={fieldErrors.password}
            />
            
            <div className="pt-2">
              <Button
                type="submit"
                size="lg"
                isLoading={isLoading}
                fullWidth
                className="btn-gradient w-full text-white border-0 shadow-lg hover:shadow-xl transition-all text-[15px] py-3.5"
              >
                Sign in
              </Button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 py-2">
              <div className="flex-1 h-px bg-[var(--border-color)]" />
              <span className="text-[var(--text-muted)] text-sm font-medium">or</span>
              <div className="flex-1 h-px bg-[var(--border-color)]" />
            </div>

            <div className="text-center">
              <p className="text-[var(--text-muted)] text-[15px]">
                Don't have an account?{' '}
                <Link to="/register" className="text-[var(--color-chirp)] font-bold hover:underline">
                  Sign up
                </Link>
              </p>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-10 text-center">
            <p className="text-[var(--text-muted)] text-xs leading-relaxed">
              By signing in, you agree to the{' '}
              <span className="text-[var(--color-chirp)] hover:underline cursor-pointer">Terms of Service</span>
              {' '}and{' '}
              <span className="text-[var(--color-chirp)] hover:underline cursor-pointer">Privacy Policy</span>.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
