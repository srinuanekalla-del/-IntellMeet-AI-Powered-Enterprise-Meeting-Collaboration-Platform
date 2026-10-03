import { InputHTMLAttributes } from 'react';

export const Input = ({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) => (
  <input
    className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 ${className}`}
    {...props}
  />
);
