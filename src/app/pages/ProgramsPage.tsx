import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash2, Play, RefreshCw, Database, Clock, User, Layers, AlertCircle } from 'lucide-react'
import { listPrograms, getProgram, deleteProgram } from '../services/programsApi'
import type { ProgramMeta } from '../services/programsApi'
import { useLoadProgram } from '../context/LoadProgramContext'
import { NavBar } from '../components/NavBar'
import { ConnectionModal } from '../components/ConnectionModal'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('es', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function ProgramsPage() {
  const navigate = useNavigate()
  const { schedulePendingLoad } = useLoadProgram()

  const [programs, setPrograms] = useState<ProgramMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [loadingId, setLoadingId] = useState<number | null>(null)

  const refresh = async () => {
    setLoading(true)
    setError(null)
    try {
      setPrograms(await listPrograms())
    } catch {
      setError('No se pudo conectar con el servidor.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [])

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este programa? Esta acción no se puede deshacer.')) return
    setDeletingId(id)
    try {
      await deleteProgram(id)
      setPrograms((prev) => prev.filter((p) => p.id !== id))
    } catch {
      alert('Error al eliminar el programa')
    } finally {
      setDeletingId(null)
    }
  }

  const handleLoad = async (id: number) => {
    setLoadingId(id)
    try {
      const program = await getProgram(id)
      schedulePendingLoad(program.blocks)
      navigate('/editor')
    } catch {
      alert('Error al cargar el programa')
      setLoadingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
              <Database className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-slate-800">Programas guardados</h1>
              {!loading && !error && (
                <p className="text-xs text-slate-500">
                  {programs.length === 0
                    ? 'Sin programas aún'
                    : `${programs.length} programa${programs.length !== 1 ? 's' : ''}`}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 rounded-lg px-3 py-1.5 hover:bg-white border border-transparent hover:border-slate-200 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 p-4 text-sm flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && programs.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Database className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-600 font-medium">Aún no hay programas</p>
            <p className="text-sm text-slate-400 mt-1">
              Crea un programa en el Editor y guárdalo con el botón Guardar
            </p>
          </div>
        )}

        {/* Table */}
        {programs.length > 0 && (
          <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Nombre
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Autor
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">
                    Bloques
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">
                    Creado
                  </th>
                  <th className="px-4 py-3 w-32" />
                </tr>
              </thead>
              <tbody>
                {programs.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-amber-50/40 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-slate-800">{p.name}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 text-slate-600">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {p.author}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {p.block_count}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="flex items-center gap-1.5 text-slate-500 whitespace-nowrap">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {formatDate(p.created_at)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleLoad(p.id)}
                          disabled={loadingId === p.id}
                          className="rounded-lg px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-medium flex items-center gap-1.5 transition disabled:opacity-60"
                        >
                          <Play className="w-3 h-3" />
                          {loadingId === p.id ? 'Cargando...' : 'Cargar'}
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          disabled={deletingId === p.id}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition disabled:opacity-60"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConnectionModal />
    </div>
  )
}
