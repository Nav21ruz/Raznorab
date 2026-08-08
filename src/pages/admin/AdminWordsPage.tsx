import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, ShieldAlert, Info } from 'lucide-react'
import { Button } from '../../components/shared/Button'
import { Spinner } from '../../components/shared/Spinner'
import { useBannedWords, useAddBannedWord, useDeleteBannedWord } from '../../hooks/useModeration'

export function AdminWordsPage() {
  const { data: words, isLoading } = useBannedWords()
  const addWord = useAddBannedWord()
  const deleteWord = useDeleteBannedWord()
  const [pattern, setPattern] = useState('')

  const handleAdd = () => {
    const trimmed = pattern.trim()
    if (!trimmed) return
    addWord.mutate(trimmed, {
      onSuccess: () => { setPattern(''); toast.success('Паттерн добавлен') },
      onError: () => toast.error('Не удалось добавить (возможно, уже есть такой паттерн)'),
    })
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">Стоп-слова</h1>
      <p className="text-sm text-gray-500 mb-4">
        Список автоматически маскирует совпадения в заказах, задачах, сообщениях чата и профиле строителя —
        прямо на уровне базы данных, это нельзя обойти в обход интерфейса.
      </p>

      <div className="flex items-start gap-2.5 p-3 mb-6 bg-gray-900 border border-gray-800 rounded-xl text-xs text-gray-400">
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-copper-400" />
        <span>
          Паттерн — регулярное выражение Postgres (POSIX). Границы слова: <code className="text-gray-300">\m</code> (начало),{' '}
          <code className="text-gray-300">\M</code> (конец), <code className="text-gray-300">\y</code> (любая сторона). Например{' '}
          <code className="text-gray-300">\mслово\M</code> — только это слово целиком, <code className="text-gray-300">\mслово\w*</code> — слово и любые окончания.
        </span>
      </div>

      <div className="flex gap-2 mb-6">
        <input
          value={pattern}
          onChange={(e) => setPattern(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
          placeholder="\mпаттерн\M"
          className="flex-1 px-3.5 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-sm text-gray-100 outline-none focus:border-copper-500 focus:ring-1 focus:ring-copper-500/30 placeholder:text-gray-600 font-mono"
        />
        <Button onClick={handleAdd} loading={addWord.isPending}>
          <Plus className="w-4 h-4" /> Добавить
        </Button>
      </div>

      {isLoading && <Spinner className="mt-16" />}

      {!isLoading && words?.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-900 border border-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8 text-gray-700" />
          </div>
          <p className="text-gray-400 font-medium">Список пуст</p>
          <p className="text-sm text-gray-600 mt-1">Добавьте паттерны, которые нужно скрывать</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {words?.map((w) => (
          <div key={w.id} className="flex items-center gap-3 p-3 bg-gray-900 border border-gray-800 rounded-xl">
            <code className="flex-1 text-sm text-gray-200 font-mono truncate">{w.pattern}</code>
            <button
              onClick={() => deleteWord.mutate(w.id)}
              disabled={deleteWord.isPending}
              className="shrink-0 p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
              aria-label="Удалить"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
