import { Layers, PaintRoller, Brush, Hammer, RectangleHorizontal, SprayCan, type LucideIcon } from 'lucide-react'
import { services } from '../data/content'

const icons: Record<(typeof services)[number]['icon'], LucideIcon> = {
  Layers,
  PaintRoller,
  Brush,
  Hammer,
  RectangleHorizontal,
  SprayCan,
}

export function Services() {
  return (
    <section id="services" className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold text-stone-900">Услуги</h2>
          <p className="mt-3 text-stone-600">
            Полный цикл штукатурных и шпаклевочных работ — от демонтажа старой отделки до финишной
            подготовки под покраску или обои.
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => {
            const Icon = icons[service.icon]
            return (
              <div
                key={service.title}
                className="rounded-2xl border border-stone-200 p-6 transition-shadow hover:shadow-md"
              >
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-orange-700">
                  <Icon size={22} />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-stone-900">{service.title}</h3>
                <p className="mt-2 text-sm text-stone-600">{service.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
