import { ArrowRight, Star } from 'lucide-react'
import { business } from '../data/content'

const stats = [
  { value: `${business.yearsExperience}+`, label: 'лет опыта' },
  { value: `${business.objectsCompleted}+`, label: 'сданных объектов' },
  { value: `${business.warrantyYears} года`, label: 'гарантии' },
]

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden bg-stone-50">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 md:grid-cols-2 md:items-center md:py-24">
        <div className="animate-fade-in">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-700">
            <Star size={14} className="fill-orange-700" />
            {business.city}
          </span>

          <h1 className="mt-5 text-4xl font-extrabold leading-tight text-stone-900 md:text-5xl">
            Ровные стены и потолки без переплаты
          </h1>

          <p className="mt-5 max-w-lg text-lg text-stone-600">
            Штукатурка и шпаклевка под ключ: от замера до сдачи объекта. Фиксированная смета,
            договор и гарантия на все виды работ.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#contacts"
              className="inline-flex items-center gap-2 rounded-full bg-orange-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-700"
            >
              Заказать замер
              <ArrowRight size={16} />
            </a>
            <a
              href="#prices"
              className="inline-flex items-center gap-2 rounded-full border border-stone-300 px-6 py-3 text-sm font-semibold text-stone-700 transition-colors hover:border-stone-400"
            >
              Смотреть цены
            </a>
          </div>

          <div className="mt-10 flex gap-8">
            {stats.map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl font-bold text-stone-900">{stat.value}</div>
                <div className="text-sm text-stone-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative hidden md:block">
          <div
            className="aspect-square rounded-3xl border border-stone-200 shadow-xl"
            style={{
              background:
                'repeating-linear-gradient(135deg, #e7e5e4 0px, #e7e5e4 2px, #f5f5f4 2px, #f5f5f4 24px)',
            }}
          >
            <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
              <div className="rounded-2xl bg-white/80 px-6 py-4 shadow-lg backdrop-blur">
                <p className="text-sm font-medium text-stone-500">Здесь будут фото ваших работ</p>
                <p className="mt-1 text-xs text-stone-400">Портфолио «до / после»</p>
              </div>
            </div>
          </div>

          <div className="absolute -bottom-5 -left-5 rounded-2xl border border-stone-200 bg-white px-5 py-4 shadow-lg">
            <div className="text-sm font-semibold text-stone-900">Гарантия {business.warrantyYears} года</div>
            <div className="text-xs text-stone-500">на все виды работ</div>
          </div>
        </div>
      </div>
    </section>
  )
}
