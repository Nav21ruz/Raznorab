import { ShieldCheck, Wrench, Droplets, Clock, Receipt, Camera, type LucideIcon } from 'lucide-react'
import { advantages } from '../data/content'

const icons: Record<(typeof advantages)[number]['icon'], LucideIcon> = {
  ShieldCheck,
  Wrench,
  Droplets,
  Clock,
  Receipt,
  Camera,
}

export function WhyUs() {
  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-3xl font-bold text-stone-900">Почему выбирают нас</h2>

        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {advantages.map((advantage) => {
            const Icon = icons[advantage.icon]
            return (
              <div key={advantage.title} className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-700">
                  <Icon size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-stone-900">{advantage.title}</h3>
                  <p className="mt-1 text-sm text-stone-600">{advantage.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
