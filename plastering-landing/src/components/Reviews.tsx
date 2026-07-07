import { Star } from 'lucide-react'
import { reviews } from '../data/content'

export function Reviews() {
  return (
    <section id="reviews" className="bg-stone-50 py-20">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-3xl font-bold text-stone-900">Отзывы</h2>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review, index) => (
            <div key={index} className="rounded-2xl border border-stone-200 bg-white p-6">
              <div className="flex gap-0.5 text-orange-500">
                {Array.from({ length: review.rating }).map((_, i) => (
                  <Star key={i} size={16} className="fill-orange-500" />
                ))}
              </div>
              <p className="mt-4 text-sm text-stone-600">{review.text}</p>
              <div className="mt-4 text-sm font-medium text-stone-900">
                {review.name} <span className="font-normal text-stone-400">· {review.location}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
