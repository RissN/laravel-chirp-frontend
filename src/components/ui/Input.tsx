import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        <label className="group relative block rounded-md border border-[var(--border-color)] bg-[var(--bg-color)] px-3 py-2 pt-5 focus-within:border-[var(--color-chirp)] focus-within:ring-1 focus-within:ring-[var(--color-chirp)] transition-all">
          <input
            ref={ref}
            className={`peer w-full border-none bg-transparent p-0 text-[var(--text-color)] placeholder-transparent focus:border-transparent focus:outline-none focus:ring-0 sm:text-base ${className}`}
            placeholder={label}
            {...props}
          />
          <span className="absolute left-3 top-2 -translate-y-1/2 text-xs text-[var(--text-muted)] transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-xs peer-focus:text-[var(--color-chirp)]">
            {label}
          </span>
        </label>
        {error && <p className="mt-1 text-sm text-red-500 px-2">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
