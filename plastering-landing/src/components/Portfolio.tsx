import { Camera } from 'lucide-react'
import { portfolioItems } from '../data/content'

function PortfolioPhoto({ src, label }: { src?: string; label: string }) {
  if (src) {
    return <img src={src} alt={label} className="h-full w-full object-cover" />
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-stone-100 text-stone-400">
      <Camera size={20} />
      <span className="text-xs font-medium">{label}</span>
    </div>
  )
}

export function Portfolio() {
  return (
    <section id="portfolio" className="bg-stone-50 py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold text-stone-900">Портфолио</h2>
          <p className="mt-3 text-stone-600">
            Примеры объектов. Фотографии «до / после» добавляются по мере сдачи работ.
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {portfolioItems.map((item) => (
            <div
              key={item.title}
              className="overflow-hidden rounded-2xl border border-stone-200 bg-white"
            >
              <div className="grid aspect-[4/3] grid-cols-2 gap-px bg-stone-200">
                <PortfolioPhoto src={item.beforeSrc} label="Фото «до»" />
                <PortfolioPhoto src={item.afterSrc} label="Фото «после»" />
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-stone-900">{item.title}</h3>
                <p className="mt-1 text-sm text-stone-500">{item.note}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
