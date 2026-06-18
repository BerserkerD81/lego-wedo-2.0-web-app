import { useState } from 'react'
import { X, Save } from 'lucide-react'

const AUTHOR_KEY = 'lego_author_name'

interface Props {
  onClose: () => void
  onSave: (name: string, author: string) => Promise<void>
  defaultName?: string
}

export function SaveDialog({ onClose, onSave, defaultName = '' }: Props) {
  const [name, setName] = useState(defaultName)
  const [author, setAuthor] = useState(() => localStorage.getItem(AUTHOR_KEY) ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    if (!name.trim()) { setError('Escribe un nombre para el programa'); return }
    if (!author.trim()) { setError('Escribe tu nombre'); return }
    setSaving(true)
    setError(null)
    try {
      localStorage.setItem(AUTHOR_KEY, author.trim())
      await onSave(name.trim(), author.trim())
      onClose()
    } catch (e) {
      setError((e as Error).message)
      setSaving(false)
    }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave()
    if (e.key === 'Escape') onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <Save className="w-4 h-4 text-amber-500" />
            Guardar programa
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 rounded-md p-0.5">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <label className="block">
            <span className="text-xs font-medium text-slate-600">Nombre del programa</span>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKey}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
              placeholder="Mi programa..."
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-slate-600">Tu nombre</span>
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              onKeyDown={handleKey}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
              placeholder="Nombre o alias..."
            />
          </label>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-amber-400 hover:bg-amber-500 active:bg-amber-600 text-slate-900 font-medium rounded-lg py-2.5 text-sm flex items-center justify-center gap-2 transition disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}
