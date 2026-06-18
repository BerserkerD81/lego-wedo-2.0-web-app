import { Bluetooth, WifiOff, Loader2 } from 'lucide-react'
import { useWeDo2 } from '../hooks/useWeDo2'

export function StatusBar() {
  const {
    isConnected, connecting, device, error,
    clearError, openConnectionModal, reconnect, disconnect,
  } = useWeDo2()

  return (
    <div className="shrink-0">
      {error && (
        <div className="flex items-center justify-between gap-3 bg-red-50 border-b border-red-200 text-red-700 px-4 py-2 text-xs">
          <span>{error}</span>
          <button onClick={clearError} className="shrink-0 underline hover:no-underline">
            Cerrar
          </button>
        </div>
      )}

      <div className="flex items-center gap-3 bg-white border-b border-slate-200 px-3 sm:px-4 py-2">
        {/* Icon */}
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition ${
            isConnected
              ? 'bg-emerald-500'
              : connecting
              ? 'bg-blue-500'
              : 'bg-slate-100'
          }`}
        >
          {connecting ? (
            <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
          ) : isConnected ? (
            <Bluetooth className="w-3.5 h-3.5 text-white" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-slate-400" />
          )}
        </div>

        {/* Status text */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span
            className={`text-sm font-medium ${
              isConnected ? 'text-emerald-700' : connecting ? 'text-blue-600' : 'text-slate-500'
            }`}
          >
            {isConnected ? 'Conectado' : connecting ? 'Conectando...' : 'Sin conexión'}
          </span>
          {device?.name && (
            <span className="text-xs text-slate-400 truncate">· {device.name}</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 shrink-0">
          {!isConnected && !device && !connecting && (
            <button
              onClick={openConnectionModal}
              className="text-xs font-medium bg-slate-900 hover:bg-slate-700 text-white rounded-lg px-3 py-1.5 transition"
            >
              Conectar
            </button>
          )}
          {!isConnected && device && !connecting && (
            <>
              <button
                onClick={reconnect}
                className="text-xs font-medium bg-slate-900 hover:bg-slate-700 text-white rounded-lg px-3 py-1.5 transition"
              >
                Reconectar
              </button>
              <button
                onClick={openConnectionModal}
                className="text-xs text-slate-500 hover:text-slate-800 rounded-lg px-2 py-1.5 hover:bg-slate-100 transition"
              >
                Otro hub
              </button>
            </>
          )}
          {isConnected && (
            <button
              onClick={disconnect}
              className="text-xs text-slate-500 hover:text-slate-800 rounded-lg px-3 py-1.5 hover:bg-slate-100 transition"
            >
              Desconectar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
