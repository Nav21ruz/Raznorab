import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export function LegalLayout({ title, updatedAt, children }: { title: string; updatedAt: string; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-gray-950">
      <div className="max-w-2xl mx-auto px-5 py-6">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 mb-6">
          <ArrowLeft className="w-4 h-4" />
          На главную
        </Link>
        <h1 className="text-2xl font-bold text-white mb-1">{title}</h1>
        <p className="text-xs text-gray-600 mb-8">Действует с {updatedAt}</p>
        <div className="flex flex-col gap-5 text-sm text-gray-400 leading-relaxed [&_h2]:text-white [&_h2]:font-semibold [&_h2]:text-base [&_h2]:mt-2 [&_strong]:text-gray-200 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1.5">
          {children}
        </div>
      </div>
    </div>
  )
}
