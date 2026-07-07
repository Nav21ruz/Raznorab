import { useState, type FormEvent } from 'react'
import { Phone, MessageCircle, Send, MapPin } from 'lucide-react'
import { business } from '../data/content'

export function Contacts() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [comment, setComment] = useState('')
  const [sent, setSent] = useState(false)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const lines = [
      'Здравствуйте! Хочу заказать замер.',
      `Имя: ${name || '—'}`,
      `Телефон: ${phone || '—'}`,
      comment && `Комментарий: ${comment}`,
    ].filter(Boolean)

    const url = `https://wa.me/${business.whatsappNumber}?text=${encodeURIComponent(lines.join('\n'))}`
    window.open(url, '_blank', 'noopener,noreferrer')
    setSent(true)
  }

  return (
    <section id="contacts" className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold text-stone-900">Контакты</h2>
            <p className="mt-3 max-w-md text-stone-600">
              Оставьте заявку — свяжемся в течение дня и согласуем удобное время для бесплатного
              замера.
            </p>

            <div className="mt-8 flex flex-col gap-4">
              <a
                href={business.phoneHref}
                className="flex items-center gap-3 text-stone-700 hover:text-orange-600"
              >
                <Phone size={18} />
                {business.phone}
              </a>
              <a
                href={`https://wa.me/${business.whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-stone-700 hover:text-orange-600"
              >
                <MessageCircle size={18} />
                WhatsApp
              </a>
              <a
                href={`https://t.me/${business.telegramUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-stone-700 hover:text-orange-600"
              >
                <Send size={18} />
                Telegram
              </a>
              <div className="flex items-center gap-3 text-stone-700">
                <MapPin size={18} />
                {business.city}
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-stone-200 bg-stone-50 p-6 sm:p-8"
          >
            <div className="flex flex-col gap-4">
              <div>
                <label htmlFor="name" className="text-sm font-medium text-stone-700">
                  Имя
                </label>
                <input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Как к вам обращаться"
                  className="mt-1.5 w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-stone-900 outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label htmlFor="phone" className="text-sm font-medium text-stone-700">
                  Телефон
                </label>
                <input
                  id="phone"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+7 (___) ___-__-__"
                  className="mt-1.5 w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-stone-900 outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label htmlFor="comment" className="text-sm font-medium text-stone-700">
                  Комментарий
                </label>
                <textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Площадь, адрес, удобное время для замера"
                  rows={3}
                  className="mt-1.5 w-full resize-none rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-stone-900 outline-none focus:border-orange-500"
                />
              </div>

              <button
                type="submit"
                className="mt-2 rounded-full bg-orange-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-700"
              >
                Отправить в WhatsApp
              </button>

              {sent && (
                <p className="text-sm text-stone-500">
                  Заявка сформирована — отправьте сообщение в открывшемся окне WhatsApp.
                </p>
              )}
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}
