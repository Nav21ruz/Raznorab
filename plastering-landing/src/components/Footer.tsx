import { business } from '../data/content'

export function Footer() {
  return (
    <footer className="border-t border-stone-200 bg-stone-50 py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row">
        <div className="text-sm font-semibold text-stone-900">{business.name}</div>
        <div className="text-sm text-stone-500">
          © {new Date().getFullYear()} {business.name}. {business.tagline}.
        </div>
      </div>
    </footer>
  )
}
