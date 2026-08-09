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
      <h1 className="text-2xl font-bold text-text-primary mb-2">Стоп-слова</h1>
      <p className="text-sm text-text-muted mb-4">
        Список автоматически маскирует совпадения в заказах, задачах, сообщениях чата и профиле строителя —
        прямо на уровне базы данных, это нельзя обойти в обход интерфейса.
      </p>

      <div className="flex items-start gap-2.5 p-3 mb-6 bg-bg-card border border-border-1 rounded-xl text-xs text-text-secondary">
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-copper-hover" />
        <span>
          Паттерн — регулярное выражение Postgres (POSIX). Границы слова: <code className="text-text-secondary">\m</code> (начало),{' '}
          <code className="text-text-secondary">\M</code> (конец), <code className="text-text-secondary">\y</code> (любая сторона). Например{' '}
          <code className="text-text-secondary">\mслово\M</code> — только это слово целиком, <code className="text-text-secondary">\mслово\w*</code> — слово и любые окончания.
        </span>
      </div>

      <div className="flex gap-2 mb-6">
        <input
          value={pattern}
          onChange={(e) => setPattern(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
          placeholder="\mпаттерн\M"
          className="flex-1 px-3.5 py-2.5 bg-bg-card border border-border-2 rounded-xl text-sm text-text-primary outline-none focus:border-copper-500 focus:ring-1 focus:ring-copper-500/30 placeholder:text-text-muted font-mono"
        />
        <Button onClick={handleAdd} loading={addWord.isPending}>
          <Plus className="w-4 h-4" /> Добавить
        </Button>
      </div>

      {isLoading && <Spinner className="mt-16" />}

      {!isLoading && words?.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-bg-card border border-border-1 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8 text-text-muted" />
          </div>
          <p className="text-text-secondary font-medium">Список пуст</p>
          <p className="text-sm text-text-muted mt-1">Добавьте паттерны, которые нужно скрывать</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {words?.map((w) => (
          <div key={w.id} className="flex items-center gap-3 p-3 bg-bg-card border border-border-1 rounded-xl">
            <code className="flex-1 text-sm text-text-primary font-mono truncate">{w.pattern}</code>
            <button
              onClick={() => deleteWord.mutate(w.id)}
              disabled={deleteWord.isPending}
              className="shrink-0 p-1.5 rounded-lg text-text-muted hover:text-error-text hover:bg-error-bg transition-colors disabled:opacity-50"
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
