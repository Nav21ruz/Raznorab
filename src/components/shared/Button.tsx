import { type ButtonHTMLAttributes, type ReactNode } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
  loading?: boolean
}

const variants = {
  primary: 'bg-copper-500 hover:bg-copper-hover text-white shadow-lg shadow-copper-500/20',
  secondary: 'bg-bg-card hover:bg-border-1 text-text-primary border border-border-2',
  danger: 'bg-red-600 hover:bg-red-500 text-white',
  ghost: 'hover:bg-border-1 text-text-secondary hover:text-text-primary',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

export function Button({ variant = 'primary', size = 'md', children, loading, className = '', disabled, ...props }: Props) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`inline-flex items-center gap-2 rounded-xl font-medium transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {loading && (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  )
}
