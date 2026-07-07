import { processSteps } from '../data/content'

export function Process() {
  return (
    <section className="bg-stone-50 py-20">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-3xl font-bold text-stone-900">Как мы работаем</h2>

        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {processSteps.map((step, index) => (
            <div key={step.title} className="relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-600 text-sm font-bold text-white">
                {index + 1}
              </div>
              <h3 className="mt-4 font-semibold text-stone-900">{step.title}</h3>
              <p className="mt-1.5 text-sm text-stone-600">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
