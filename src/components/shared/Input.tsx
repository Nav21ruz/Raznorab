import { type InputHTMLAttributes, forwardRef } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, Props>(({ label, error, className = '', ...props }, ref) => {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-gray-400">{label}</label>}
      <input
        ref={ref}
        {...props}
        className={`px-3 py-2.5 bg-gray-900 border rounded-xl text-sm text-gray-100 outline-none transition-all placeholder:text-gray-600
          ${error ? 'border-red-500 focus:border-red-400' : 'border-gray-700 focus:border-copper-500 focus:ring-1 focus:ring-copper-500/30'}
          disabled:opacity-50 ${className}`}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
})

Input.displayName = 'Input'
