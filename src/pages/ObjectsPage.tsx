import { useState } from 'react'
import { Plus, HardHat } from 'lucide-react'
import { useObjects } from '../hooks/useObjects'
import { useEntries } from '../hooks/useEntries'
import { ObjectCard } from '../components/objects/ObjectCard'
import { ObjectForm } from '../components/objects/ObjectForm'
import { Modal } from '../components/shared/Modal'
import { Button } from '../components/shared/Button'
import { Spinner } from '../components/shared/Spinner'
import { Navbar } from '../components/shared/Navbar'
import type { ConstructionObject } from '../types'

export function ObjectsPage() {
  const [showForm, setShowForm] = useState(false)
  const { data: objects, isLoading } = useObjects()

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Мои объекты</h1>
            <p className="text-sm text-gray-500 mt-1">
              {objects?.length ? `${objects.length} объект(ов) в работе` : 'Добавьте первый объект'}
            </p>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4" /> Новый объект
          </Button>
        </div>

        {isLoading && <Spinner className="mt-16" />}

        {!isLoading && objects?.length === 0 && (
          <div className="text-center py-24">
            <div className="w-16 h-16 bg-gray-900 border border-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <HardHat className="w-8 h-8 text-gray-700" />
            </div>
            <p className="text-gray-400 font-medium">Нет объектов</p>
            <p className="text-sm text-gray-600 mt-1">Нажмите «Новый объект» чтобы начать</p>
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

function ObjectCardWithStats({ object }: { object: ConstructionObject }) {
  const { data: entries } = useEntries(object.id)
  return (
    <ObjectCard
      object={object}
      entriesCount={entries?.length ?? 0}
      lastDate={entries?.[0]?.date}
    />
  )
}
