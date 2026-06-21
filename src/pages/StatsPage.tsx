import { useObjects } from '../hooks/useObjects'
import { useEntries } from '../hooks/useEntries'
import { Navbar } from '../components/shared/Navbar'
import { Spinner } from '../components/shared/Spinner'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
} from 'recharts'
import { format, parseISO, startOfWeek } from 'date-fns'
import { ru } from 'date-fns/locale'
import { BarChart2, Calendar } from 'lucide-react'
import type { ConstructionObject, Entry } from '../types'

export function StatsPage() {
  const { data: objects, isLoading } = useObjects()

  if (isLoading) return <><Navbar /><Spinner className="mt-24" /></>

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Статистика</h1>
          <p className="text-sm text-gray-500 mt-1">Сводка по всем объектам</p>
        </div>

        {objects?.map((obj) => (
          <ObjectStats key={obj.id} object={obj} />
        ))}

        {objects?.length === 0 && (
          <div className="text-center py-24 text-gray-600">
            <BarChart2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>Нет данных для статистики</p>
          </div>
        )}
      </main>
    </div>
  )
}

function ObjectStats({ object }: { object: ConstructionObject }) {
  const { data: entries } = useEntries(object.id)

  if (!entries || entries.length === 0) return null

  const weeklyData = buildWeeklyData(entries)

  const stats = [
    { label: 'Рабочих дней', value: entries.length, icon: Calendar, color: 'text-orange-400' },
    { label: 'Недель активности', value: weeklyData.length, icon: BarChart2, color: 'text-blue-400' },
  ]

  return (
    <div className="mb-8 bg-gray-900 border border-gray-800 rounded-2xl p-6 animate-fade-in">
      <h2 className="text-base font-semibold text-gray-200 mb-1">{object.name}</h2>
      <p className="text-xs text-gray-600 mb-5">{object.address}</p>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-gray-800/50 border border-gray-700/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="text-xs text-gray-500">{label}</span>
            </div>
            <div className="text-2xl font-bold text-white">{value}</div>
          </div>
        ))}
      </div>

      {weeklyData.length > 1 && (
        <>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Активность по неделям</h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="week" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '12px', color: '#e5e7eb', fontSize: 12 }}
                  cursor={{ fill: 'rgba(249,115,22,0.1)' }}
                />
                <Bar dataKey="days" name="Дней" fill="#f97316" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-5 mb-3">Динамика записей</h3>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={buildCumulativeData(entries)} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '12px', color: '#e5e7eb', fontSize: 12 }}
                />
                <Line type="monotone" dataKey="total" name="Всего записей" stroke="#f97316" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  )
}

function buildWeeklyData(entries: Entry[]) {
  const map = new Map<string, number>()
  for (const e of entries) {
    const d = parseISO(e.date)
    const weekStart = format(startOfWeek(d, { weekStartsOn: 1 }), 'dd.MM', { locale: ru })
    map.set(weekStart, (map.get(weekStart) ?? 0) + 1)
  }
  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([week, days]) => ({ week, days }))
}

function buildCumulativeData(entries: Entry[]) {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date))
  let total = 0
  return sorted.map((e) => ({
    date: format(parseISO(e.date), 'dd.MM'),
    total: ++total,
  }))
}
