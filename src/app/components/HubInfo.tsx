import { useState, useCallback } from 'react'
import { Cpu, Battery, RefreshCw, Power, Check, Pencil } from 'lucide-react'
import { useWeDo2, HubInfo } from '../hooks/useWeDo2'

export function HubInfoPanel() {
  const { isConnected, readHubInfo, renameHub, powerOffHub, disconnect } = useWeDo2()
  const [info, setInfo] = useState<HubInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [renaming, setRenaming] = useState(false)

  const handleRead = useCallback(async () => {
    if (!isConnected || loading) return
    setLoading(true)
    try {
      const data = await readHubInfo()
      setInfo(data)
      setNameInput(data.name)
    } catch (e) {
      console.error('[HubInfo] read failed', e)
    } finally {
      setLoading(false)
    }
  }, [isConnected, loading, readHubInfo])

  const handleRename = useCallback(async () => {
    if (!nameInput.trim()) return
    setRenaming(true)
    try {
      await renameHub(nameInput.trim())
      setInfo(prev => prev ? { ...prev, name: nameInput.trim() } : null)
      setEditingName(false)
    } catch (e) {
      console.error('[HubInfo] rename failed', e)
    } finally {
      setRenaming(false)
    }
  }, [nameInput, renameHub])

  const handlePowerOff = useCallback(async () => {
    if (!window.confirm('¿Apagar el hub? Se desconectará.')) return
    await powerOffHub()
    disconnect()
  }, [powerOffHub, disconnect])

  const batteryColor =
    !info ? 'bg-slate-200'
    : info.battery > 50 ? 'bg-green-500'
    : info.battery > 20 ? 'bg-yellow-500'
    : 'bg-red-500'

  const batteryTextColor =
    !info ? 'text-slate-400'
    : info.battery > 50 ? 'text-green-600'
    : info.battery > 20 ? 'text-yellow-600'
    : 'text-red-600'

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-2.5">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-md flex items-center justify-center bg-slate-600 text-white">
            <Cpu className="w-3 h-3" />
          </div>
          <span className="text-xs font-semibold text-slate-600">Info del Hub</span>
        </div>
        <button
          onClick={handleRead}
          disabled={!isConnected || loading}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 px-2 py-1 rounded-lg hover:bg-slate-100 transition disabled:opacity-40"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          Leer
        </button>
      </div>

      {!info ? (
        <p className="text-xs text-slate-400 text-center py-3">
          {isConnected ? 'Pulsa "Leer" para ver los datos' : 'Sin conexión'}
        </p>
      ) : (
        <div className="space-y-2">
          {/* Batería */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Battery className="w-3 h-3" /> Batería
              </div>
              <span className={`text-xs font-semibold ${batteryTextColor}`}>{info.battery}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div className={`h-full rounded-full transition-all ${batteryColor}`} style={{ width: `${info.battery}%` }} />
            </div>
          </div>

          {/* Nombre */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Nombre</span>
            {editingName ? (
              <div className="flex items-center gap-1">
                <input
                  className="text-xs border border-slate-300 rounded px-1.5 py-0.5 w-24"
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  maxLength={14}
                  onKeyDown={e => e.key === 'Enter' && handleRename()}
                  autoFocus
                />
                <button onClick={handleRename} disabled={renaming} className="text-green-600 hover:text-green-700">
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <span className="text-xs">{info.name || '(sin nombre)'}</span>
                <button onClick={() => setEditingName(true)} className="text-slate-400 hover:text-slate-600">
                  <Pencil className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Firmware */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Firmware</span>
            <span className="text-xs">{info.firmware}</span>
          </div>

          {/* Fabricante */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Fabricante</span>
            <span className="text-xs">{info.manufacturer}</span>
          </div>
        </div>
      )}

      {isConnected && (
        <div className={`${info ? 'mt-3 pt-2.5 border-t border-slate-100' : 'mt-2'}`}>
          <button
            onClick={handlePowerOff}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-medium transition"
          >
            <Power className="w-3.5 h-3.5" />
            Apagar hub
          </button>
        </div>
      )}
    </div>
  )
}
