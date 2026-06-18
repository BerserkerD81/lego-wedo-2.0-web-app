import { useEffect, useId } from 'react'
import { Bluetooth, Loader2, X } from 'lucide-react'
import { useWeDo2 } from '../hooks/useWeDo2'

function HubIllustration({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect x="14" y="28" width="92" height="56" rx="10" fill="#334155" />
      <rect x="18" y="32" width="84" height="48" rx="7" fill="#64748b" />
      <circle cx="38" cy="22" r="7" fill="#FFD500" />
      <circle cx="60" cy="22" r="7" fill="#FFD500" />
      <circle cx="82" cy="22" r="7" fill="#FFD500" />
      <circle cx="38" cy="22" r="3.5" fill="#FFE14D" />
      <circle cx="60" cy="22" r="3.5" fill="#FFE14D" />
      <circle cx="82" cy="22" r="3.5" fill="#FFE14D" />
      <rect x="44" y="48" width="32" height="22" rx="4" fill="#1e293b" />
      <rect x="50" y="52" width="8" height="6" rx="1" fill="#3b82f6" />
      <rect x="62" y="52" width="8" height="6" rx="1" fill="#10b981" />
    </svg>
  )
}

function HubIconMini({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect x="4" y="8" width="16" height="11" rx="2.5" fill="#10b981" />
      <circle cx="9" cy="6" r="2" fill="#6ee7b7" />
      <circle cx="15" cy="6" r="2" fill="#6ee7b7" />
    </svg>
  )
}

export function ConnectionModal() {
  const titleId = useId()
  const {
    connectionModalOpen,
    closeConnectionModal,
    searchForHub,
    completeHubConnection,
    device,
    isConnected,
    connecting,
    error,
    clearError,
  } = useWeDo2()

  const searching = connecting && !device
  const connectingGatt = connecting && !!device && !isConnected
  const showDevicePicked = !!device && !isConnected && !connectingGatt
  const showSuccessGlow = isConnected && connectionModalOpen

  useEffect(() => {
    if (!connectionModalOpen || !isConnected) return undefined
    const t = window.setTimeout(() => {
      closeConnectionModal()
    }, 900)
    return () => window.clearTimeout(t)
  }, [connectionModalOpen, isConnected, closeConnectionModal])

  useEffect(() => {
    if (!connectionModalOpen) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [connectionModalOpen])

  if (!connectionModalOpen) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
        aria-label="Cerrar diálogo de conexión"
        onClick={() => {
          if (!connecting && !searching) {
            closeConnectionModal()
          }
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative z-[101] w-full max-w-md rounded-[1.75rem] border border-slate-200/90 bg-white p-6 shadow-2xl shadow-slate-900/15 sm:p-8 transition-[box-shadow] duration-300 ${
          showSuccessGlow
            ? 'ring-2 ring-emerald-400/90'
            : 'ring-1 ring-slate-900/5'
        }`}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2
            id={titleId}
            className="text-xl tracking-tight text-slate-900"
          >
            Smart Hub WeDo 2.0
          </h2>
          <button
            type="button"
            onClick={() => {
              if (!searching && !connectingGatt) {
                closeConnectionModal()
              }
            }}
            disabled={searching || connectingGatt}
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        {error ? (
          <div
            role="alert"
            className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900"
          >
            {error}
            <button
              type="button"
              className="ml-2 underline"
              onClick={clearError}
            >
              Cerrar
            </button>
          </div>
        ) : null}

        {showSuccessGlow ? (
          <div className="flex flex-col items-center py-6 text-center">
            <p className="text-lg text-emerald-700">¡Conectado!</p>
            <p className="mt-1 text-sm text-emerald-800/90">Tu Smart Hub está listo.</p>
          </div>
        ) : null}

        {!showSuccessGlow && searching ? (
          <div className="flex flex-col items-center py-4">
            <p className="mb-6 text-center text-sm text-slate-600">
              Buscando tu LEGO WeDo 2.0 Smart Hub…
            </p>
            <div className="relative flex h-40 w-40 items-center justify-center">
              <span
                className="absolute inline-flex h-[7.5rem] w-[7.5rem] rounded-full bg-blue-500/25 animate-ping"
                aria-hidden
              />
              <span
                className="absolute inline-flex h-[6.5rem] w-[6.5rem] rounded-full bg-blue-500/15 animate-ping [animation-delay:0.4s]"
                aria-hidden
              />
              <div className="relative z-10 w-28 drop-shadow-md">
                <HubIllustration className="h-full w-full" />
              </div>
            </div>
          </div>
        ) : null}

        {!showSuccessGlow && !searching && !device ? (
          <div className="flex flex-col items-center py-2">
            <div className="mb-5 w-32 opacity-90">
              <HubIllustration className="h-full w-full" />
            </div>
            <p className="mb-5 text-center text-sm text-slate-600">
              Empareja tu LEGO WeDo 2.0 Smart Hub por Bluetooth.
            </p>
            <button
              type="button"
              onClick={() => {
                clearError()
                void searchForHub()
              }}
              disabled={connecting}
              className="rounded-2xl bg-blue-500 px-6 py-3 text-sm text-white shadow-md transition hover:bg-blue-600 disabled:opacity-50"
            >
              Buscar Hub
            </button>
          </div>
        ) : null}

        {!showSuccessGlow && showDevicePicked ? (
          <div className="flex flex-col items-center gap-4 py-2">
            <p className="text-center text-sm text-slate-700">
              Hub encontrado
            </p>
            <button
              type="button"
              onClick={() => {
                clearError()
                void completeHubConnection()
              }}
              disabled={connecting}
              className="flex w-full max-w-xs flex-col items-center justify-center gap-2 rounded-2xl border-2 border-blue-500/30 bg-gradient-to-b from-white to-slate-50 px-6 py-6 text-center shadow-lg transition hover:border-blue-500/50 hover:shadow-xl disabled:opacity-60"
            >
              <Bluetooth
                className="h-12 w-12 text-blue-500"
                strokeWidth={1.75}
                aria-hidden
              />
              <span className="text-lg text-slate-900">Conectar</span>
              {device?.name ? (
                <span className="text-xs text-slate-500">{device.name}</span>
              ) : null}
            </button>
          </div>
        ) : null}

        {!showSuccessGlow && connectingGatt ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="h-10 w-10 animate-spin text-blue-500" aria-hidden />
            <p className="text-sm text-slate-600">Conectando…</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function ConnectedHubBadge() {
  const { isConnected, device } = useWeDo2()

  if (!isConnected) {
    return null
  }

  return (
    <div
      className="pointer-events-none absolute right-3 top-3 z-40 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 shadow-sm ring-2 ring-emerald-500/70 sm:right-4"
      title={device?.name ? `Conectado: ${device.name}` : 'Smart Hub conectado'}
      role="status"
      aria-label={
        device?.name
          ? `Smart Hub conectado: ${device.name}`
          : 'Smart Hub conectado'
      }
    >
      <HubIconMini className="h-6 w-6" />
    </div>
  )
}
