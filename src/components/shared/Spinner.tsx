export function Spinner({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="w-8 h-8 border-2 border-border-2 border-t-copper-500 rounded-full animate-spin" />
    </div>
  )
}
