import { type InputHTMLAttributes, forwardRef } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, Props>(({ label, error, className = '', ...props }, ref) => {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-text-secondary">{label}</label>}
      <input
        ref={ref}
        {...props}
        className={`px-3 py-2.5 bg-bg-card border rounded-xl text-sm text-text-primary outline-none transition-all placeholder:text-text-muted
          ${error ? 'border-error-text' : 'border-border-2 focus:border-copper-500 focus:ring-1 focus:ring-copper-500/30'}
          disabled:opacity-50 ${className}`}
      />
      {error && <p className="text-xs text-error-text">{error}</p>}
    </div>
  )
})

Input.displayName = 'Input'
