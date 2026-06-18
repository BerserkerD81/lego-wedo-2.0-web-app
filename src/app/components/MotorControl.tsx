import { useState, useCallback } from 'react'
import { Square, ChevronRight, ChevronLeft } from 'lucide-react'
import { useWeDo2 } from '../hooks/useWeDo2'

interface MotorControlProps {
  port: 1 | 2
  label: 'A' | 'B'
}

export function MotorControl({ port, label }: MotorControlProps) {
  const { sendPowerCommand, isConnected } = useWeDo2()
  const [power, setPower] = useState(50)
  const [sending, setSending] = useState(false)
  const [active, setActive] = useState<'backward' | 'forward' | null>(null)

  const send = useCallback(
    async (direction: 'forward' | 'backward', pwr: number) => {
      if (!isConnected || sending) return
      setSending(true)
      setActive(direction)
      try {
        await sendPowerCommand(pwr, direction, port)
      } catch (err) {
        console.error('Error motor', err)
      } finally {
        setSending(false)
      }
    },
    [isConnected, sending, port, sendPowerCommand],
  )

  const handleStop = useCallback(async () => {
    if (!isConnected || sending) return
    setSending(true)
    setActive(null)
    try {
      await sendPowerCommand(0, 'forward', port)
    } catch (err) {
      console.error('Error stop', err)
    } finally {
      setSending(false)
    }
  }, [isConnected, sending, port, sendPowerCommand])

  const accent = port === 1 ? 'bg-blue-500' : 'bg-violet-500'
  const accentText = port === 1 ? 'text-blue-600' : 'text-violet-600'
  const accentRange = port === 1 ? '#3b82f6' : '#8b5cf6'

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-2.5 space-y-1.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className={`w-5 h-5 rounded-md flex items-center justify-center text-white text-xs font-bold ${accent}`}>
            {label}
          </div>
          <span className="text-xs font-semibold text-slate-700">Motor {label}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-slate-400">Velocidad</span>
          <span className={`text-xs font-bold tabular-nums w-8 text-right ${accentText}`}>{power}%</span>
        </div>
      </div>

      {/* Range input — mucho más compacto que el Slider de shadcn */}
      <input
        type="range"
        min={0} max={100} step={5}
        value={power}
        onChange={e => setPower(Number(e.target.value))}
        disabled={!isConnected}
        className="w-full h-1 rounded-full cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ accentColor: accentRange }}
      />

      {/* Atrás / Adelante */}
      <div className="grid grid-cols-2 gap-1.5">
        <button
          onClick={() => send('backward', power)}
          disabled={!isConnected || sending || power === 0}
          className={`flex items-center justify-center gap-1 py-1.5 rounded-lg border text-xs font-medium transition
            ${active === 'backward' ? 'border-slate-400 bg-slate-100' : 'border-slate-200 hover:bg-slate-50 text-slate-700'}
            disabled:opacity-40`}
        >
          <ChevronLeft className="w-3 h-3" /> Atrás
        </button>
        <button
          onClick={() => send('forward', power)}
          disabled={!isConnected || sending || power === 0}
          className={`flex items-center justify-center gap-1 py-1.5 rounded-lg border text-xs font-medium transition
            ${active === 'forward' ? 'border-slate-400 bg-slate-100' : 'border-slate-200 hover:bg-slate-50 text-slate-700'}
            disabled:opacity-40`}
        >
          Adelante <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Stop — prominente */}
      <button
        onClick={handleStop}
        disabled={!isConnected || sending}
        className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 active:bg-red-700 text-white text-xs font-bold transition disabled:opacity-40"
      >
        <Square className="w-3 h-3" />
        Parar motor {label}
      </button>
    </div>
  )
}
