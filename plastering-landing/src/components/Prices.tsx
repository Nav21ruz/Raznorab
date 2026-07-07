import { prices } from '../data/content'

export function Prices() {
  return (
    <section id="prices" className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold text-stone-900">Цены</h2>
          <p className="mt-3 text-stone-600">
            Ориентировочная стоимость работ. Точная цена определяется после бесплатного замера и
            зависит от состояния поверхностей и сложности объекта.
          </p>
        </div>

        <div className="mt-10 overflow-x-auto rounded-2xl border border-stone-200">
          <table className="w-full min-w-[480px] text-left">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-sm text-stone-500">
                <th className="px-6 py-4 font-medium">Услуга</th>
                <th className="px-6 py-4 font-medium">Ед.</th>
                <th className="px-6 py-4 font-medium">Цена</th>
              </tr>
            </thead>
            <tbody>
              {prices.map((row, index) => (
                <tr
                  key={row.service}
                  className={index !== prices.length - 1 ? 'border-b border-stone-100' : ''}
                >
                  <td className="px-6 py-4 font-medium text-stone-900">{row.service}</td>
                  <td className="px-6 py-4 text-stone-500">{row.unit}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-stone-700">
                    {row.priceFrom}–{row.priceTo} ₽
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-sm text-stone-500">
          Стоимость материалов рассчитывается отдельно и указывается в смете до начала работ.
        </p>
      </div>
    </section>
  )
}
