import { useState } from 'react'
import { Plus, LogOut, HardHat } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useObjects } from '../hooks/useObjects'
import { useEntries } from '../hooks/useEntries'
import { ObjectCard } from '../components/objects/ObjectCard'
import { ObjectForm } from '../components/objects/ObjectForm'
import { Modal } from '../components/shared/Modal'
import { Button } from '../components/shared/Button'
import { Spinner } from '../components/shared/Spinner'

export function ObjectsPage() {
  const [showForm, setShowForm] = useState(false)
  const { data: objects, isLoading } = useObjects()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <HardHat className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900">Журнал объекта</span>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setShowForm(true)} size="sm">
              <Plus className="w-4 h-4" /> Объект
            </Button>
            <button
              onClick={() => supabase.auth.signOut()}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
              title="Выйти"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Мои объекты</h1>

        {isLoading && <Spinner className="mt-12" />}

        {!isLoading && objects?.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <HardHat className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Нет объектов</p>
            <p className="text-sm mt-1">Нажмите «+ Объект» чтобы начать</p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {objects?.map((obj) => (
            <ObjectCardWithStats key={obj.id} object={obj} />
          ))}
        </div>
      </main>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Новый объект">
        <ObjectForm onSuccess={() => setShowForm(false)} />
      </Modal>
    </div>
  )
}

function ObjectCardWithStats({ object }: { object: import('../types').ConstructionObject }) {
  const { data: entries } = useEntries(object.id)
  return (
    <ObjectCard
      object={object}
      entriesCount={entries?.length ?? 0}
      lastDate={entries?.[0]?.date}
    />
  )
}
