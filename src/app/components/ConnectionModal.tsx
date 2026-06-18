import { useEffect, useId } from 'react'
import { Loader2, X } from 'lucide-react'
import { useWeDo2 } from '../hooks/useWeDo2'

const FILL = '#0095DA'
const DARK = '#0074AA'

// Wave center = center of the brick body (see transform below)
const WX = 140
const WY = 105

function HubIllustration({ pulse = false }: { pulse?: boolean }) {
  const dur = pulse ? '1.3s' : '2.4s'
  const d1  = '0s'
  const d2  = pulse ? '0.43s' : '0.8s'
  const d3  = pulse ? '0.86s' : '1.6s'

  return (
    <svg viewBox="0 0 280 210" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden className="w-full h-full">
      {/* ── Wave rings ── */}
      <circle cx={WX} cy={WY} r="1" stroke={FILL} strokeWidth="2.5" fill="none">
        <animate attributeName="r"       values={`62;108`} dur={dur} begin={d1} repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.6;0"    dur={dur} begin={d1} repeatCount="indefinite"/>
      </circle>
      <circle cx={WX} cy={WY} r="1" stroke={FILL} strokeWidth="2" fill="none">
        <animate attributeName="r"       values={`62;108`} dur={dur} begin={d2} repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.42;0"   dur={dur} begin={d2} repeatCount="indefinite"/>
      </circle>
      <circle cx={WX} cy={WY} r="1" stroke={FILL} strokeWidth="1.5" fill="none">
        <animate attributeName="r"       values={`62;108`} dur={dur} begin={d3} repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.25;0"   dur={dur} begin={d3} repeatCount="indefinite"/>
      </circle>

      {/* ── LEGO brick in blue — same geometry as icon.svg ── */}
      {/* translate centers the 64×46 brick (×2.4) in the 280×210 viewBox */}
      <g transform="translate(68, 28) scale(2.4)">
        {/* Body depth */}
        <rect x="2" y="23" width="60" height="23" rx="6" fill={DARK}/>
        {/* Main body */}
        <rect x="0" y="18" width="60" height="24" rx="6" fill={FILL}/>
        {/* Top highlight */}
        <rect x="0" y="18" width="60" height="8" rx="6" fill="rgba(255,255,255,0.18)"/>

        {/* Left stud — cylinder side */}
        <rect x="9" y="10" width="16" height="11" fill={DARK}/>
        {/* Left stud — top ellipse */}
        <ellipse cx="17" cy="10" rx="8" ry="5" fill={FILL}/>
        {/* Left stud — highlight arc */}
        <ellipse cx="15" cy="8.5" rx="4.5" ry="2.5" fill="rgba(255,255,255,0.28)"/>
        {/* Left stud — hollow center */}
        <circle cx="17" cy="10" r="2.8" fill={DARK}/>

        {/* Right stud — cylinder side */}
        <rect x="35" y="10" width="16" height="11" fill={DARK}/>
        {/* Right stud — top ellipse */}
        <ellipse cx="43" cy="10" rx="8" ry="5" fill={FILL}/>
        {/* Right stud — highlight arc */}
        <ellipse cx="41" cy="8.5" rx="4.5" ry="2.5" fill="rgba(255,255,255,0.28)"/>
        {/* Right stud — hollow center */}
        <circle cx="43" cy="10" r="2.8" fill={DARK}/>
      </g>
    </svg>
  )
}

function HubIconMini({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect width="24" height="24" rx="5" fill="#0095DA"/>
      <rect x="3" y="8" width="18" height="13" rx="2.5" fill="white"/>
      <circle cx="7.5"  cy="8" r="2" fill="white"/>
      <circle cx="7.5"  cy="8" r="1.1" fill="#0095DA"/>
      <circle cx="16.5" cy="8" r="2" fill="white"/>
      <circle cx="16.5" cy="8" r="1.1" fill="#0095DA"/>
      <circle cx="12" cy="14.5" r="3.5" fill="#0095DA"/>
      <circle cx="12" cy="14.5" r="2.2" fill="white"/>
      <circle cx="12" cy="14.5" r="1.1" fill="#0095DA"/>
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
    const t = window.setTimeout(() => closeConnectionModal(), 900)
    return () => window.clearTimeout(t)
  }, [connectionModalOpen, isConnected, closeConnectionModal])

  useEffect(() => {
    if (!connectionModalOpen) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [connectionModalOpen])

  if (!connectionModalOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        aria-label="Cerrar"
        onClick={() => { if (!connecting && !searching) closeConnectionModal() }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative z-[101] w-full max-w-sm rounded-3xl bg-white shadow-2xl overflow-hidden transition-all duration-300 ${
          showSuccessGlow ? 'ring-2 ring-emerald-400' : ''
        }`}
      >
        {/* Accent bar */}
        <div className={`h-1 w-full transition-colors duration-500 ${showSuccessGlow ? 'bg-emerald-400' : 'bg-[#0095DA]'}`} />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-1">
          <span id={titleId} className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            LEGO WeDo 2.0
          </span>
          <button
            type="button"
            onClick={() => { if (!searching && !connectingGatt) closeConnectionModal() }}
            disabled={searching || connectingGatt}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div role="alert" className="mx-5 mt-3 rounded-xl bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-700 flex items-center justify-between">
            <span>{error}</span>
            <button type="button" onClick={clearError} className="text-red-500 hover:text-red-700 ml-2">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ── Success state ── */}
        {showSuccessGlow && (
          <div className="flex flex-col items-center px-6 pb-8 pt-4 text-center">
            <div className="w-28 h-24 mb-4">
              <HubIllustration />
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <p className="text-base font-semibold text-slate-800">¡Conectado!</p>
            <p className="text-sm text-slate-500 mt-0.5">Smart Hub listo para usar</p>
          </div>
        )}

        {/* ── Idle: waiting to search ── */}
        {!showSuccessGlow && !searching && !device && (
          <div className="flex flex-col items-center px-6 pb-7 pt-3">
            <div className="w-44 h-44 mb-1">
              <HubIllustration />
            </div>
            <p className="text-base font-semibold text-slate-800 mb-1">Smart Hub WeDo 2.0</p>
            <p className="text-sm text-slate-500 text-center mb-6">
              Conecta tu hub LEGO por Bluetooth para empezar a programar
            </p>
            <button
              type="button"
              onClick={() => { clearError(); void searchForHub() }}
              disabled={connecting}
              className="w-full rounded-2xl bg-slate-900 text-white text-sm font-medium px-6 py-3 flex items-center justify-center gap-2.5 hover:bg-slate-700 disabled:opacity-50 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M12 2L8.5 5.5l7 7-7 7L12 23l10-10.5L12 2z" strokeLinejoin="round" strokeLinecap="round"/>
              </svg>
              Buscar Hub
            </button>
          </div>
        )}

        {/* ── Searching ── */}
        {!showSuccessGlow && searching && (
          <div className="flex flex-col items-center px-6 pb-7 pt-3">
            <div className="w-44 h-44 mb-1">
              <HubIllustration pulse />
            </div>
            <p className="text-base font-semibold text-slate-800 mb-1">Buscando hub…</p>
            <p className="text-sm text-slate-500 text-center">Asegúrate de que el Bluetooth está activado</p>
          </div>
        )}

        {/* ── Device found ── */}
        {!showSuccessGlow && showDevicePicked && (
          <div className="flex flex-col items-center px-6 pb-7 pt-3 gap-4">
            <div className="w-44 h-44">
              <HubIllustration />
            </div>
            <p className="text-sm text-slate-500">Hub encontrado</p>
            <button
              type="button"
              onClick={() => { clearError(); void completeHubConnection() }}
              disabled={connecting}
              className="w-full flex flex-col items-center gap-1.5 rounded-2xl border-2 border-slate-900/10 bg-slate-50 hover:bg-slate-100 px-6 py-5 transition disabled:opacity-60"
            >
              <svg className="w-8 h-8 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
                <path d="M12 2L8.5 5.5l7 7-7 7L12 23l10-10.5L12 2z" strokeLinejoin="round" strokeLinecap="round"/>
              </svg>
              <span className="text-sm font-semibold text-slate-800">Conectar</span>
              {device?.name && <span className="text-xs text-slate-400">{device.name}</span>}
            </button>
          </div>
        )}

        {/* ── Connecting GATT ── */}
        {!showSuccessGlow && connectingGatt && (
          <div className="flex flex-col items-center px-6 pb-8 pt-6 gap-3">
            <Loader2 className="h-9 w-9 animate-spin text-slate-400" />
            <p className="text-sm text-slate-500">Conectando…</p>
          </div>
        )}
      </div>
    </div>
  )
}

export function ConnectedHubBadge() {
  const { isConnected, device } = useWeDo2()
  if (!isConnected) return null

  return (
    <div
      className="pointer-events-none absolute right-3 top-3 z-40 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 ring-2 ring-emerald-500/60 sm:right-4"
      title={device?.name ? `Conectado: ${device.name}` : 'Smart Hub conectado'}
      role="status"
      aria-label={device?.name ? `Smart Hub conectado: ${device.name}` : 'Smart Hub conectado'}
    >
      <HubIconMini className="h-6 w-6" />
    </div>
  )
}
