import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
}

export default function Button({
  className = '',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  children,
  disabled,
  ...props
}: ButtonProps) {
  
  const baseStyles = 'inline-flex items-center justify-center font-bold rounded-full transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-100 border border-transparent shadow-sm',
    secondary: 'bg-[var(--text-color)] text-[var(--bg-color)] hover:bg-[var(--text-muted)] border border-transparent',
    outline: 'bg-transparent text-[var(--color-chirp)] border border-[var(--border-color)] hover:bg-[var(--color-chirp)]/10',
    ghost: 'bg-transparent text-[var(--text-color)] hover:bg-[var(--hover-bg)] border border-transparent',
  };

  const sizes = {
    sm: 'px-4 py-1.5 text-sm',
    md: 'px-5 py-2 text-base',
    lg: 'px-8 py-3 text-lg',
  };

  const classes = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

  return (
    <motion.div
      whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
      className={`inline-block ${fullWidth ? 'w-full' : ''}`}
    >
      <button
        className={classes}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : null}
        {children}
      </button>
    </motion.div>
  );
}
