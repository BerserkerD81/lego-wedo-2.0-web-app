import { useState, useCallback } from 'react'
import { Lightbulb } from 'lucide-react'
import { useWeDo2 } from '../hooks/useWeDo2'
import { LedColor } from '../services/bluetoothService'

const LED_COLORS: { value: LedColor; label: string; color: string }[] = [
  { value: 'off',    label: 'Apagado',  color: '#6b7280' },
  { value: 'pink',   label: 'Rosa',     color: '#ec4899' },
  { value: 'purple', label: 'Morado',   color: '#a855f7' },
  { value: 'blue',   label: 'Azul',     color: '#3b82f6' },
  { value: 'cyan',   label: 'Cian',     color: '#06b6d4' },
  { value: 'green',  label: 'Verde',    color: '#10b981' },
  { value: 'yellow', label: 'Amarillo', color: '#eab308' },
  { value: 'orange', label: 'Naranja',  color: '#f97316' },
  { value: 'red',    label: 'Rojo',     color: '#ef4444' },
  { value: 'white',  label: 'Blanco',   color: '#f3f4f6' },
]

type LedMode = 'preset' | 'rgb'

export function LedControl() {
  const { sendLedCommand, sendLedRgb, switchLedToRgbMode, switchLedToPresetMode, isConnected } = useWeDo2()
  const [selectedColor, setSelectedColor] = useState<LedColor>('off')
  const [sending, setSending] = useState(false)
  const [mode, setMode] = useState<LedMode>('preset')
  const [r, setR] = useState(0)
  const [g, setG] = useState(0)
  const [b, setB] = useState(255)

  const handleSetColor = useCallback(
    async (color: LedColor) => {
      if (!isConnected || sending) return
      setSending(true)
      setSelectedColor(color)
      try {
        await sendLedCommand(color)
      } catch (err) {
        console.error('Error enviando comando LED', err)
      } finally {
        setSending(false)
      }
    },
    [isConnected, sending, sendLedCommand],
  )

  const handleSetRgb = useCallback(async () => {
    if (!isConnected || sending) return
    setSending(true)
    try {
      await sendLedRgb(r, g, b)
    } catch (err) {
      console.error('Error enviando RGB', err)
    } finally {
      setSending(false)
    }
  }, [isConnected, sending, sendLedRgb, r, g, b])

  const currentColor = LED_COLORS.find(c => c.value === selectedColor)
  const rgbHex = `rgb(${r},${g},${b})`

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-2.5 space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-md flex items-center justify-center bg-yellow-500 text-white">
            <Lightbulb className="w-3 h-3" />
          </div>
          <span className="text-xs font-semibold text-slate-600">Control de LED</span>
          {mode === 'preset' && (
            <div
              className="w-3.5 h-3.5 rounded-full border border-white ring-1 ring-slate-200 ml-1 transition-all"
              style={{ backgroundColor: currentColor?.color }}
              title={currentColor?.label}
            />
          )}
        </div>
        <div className="flex gap-1">
          {(['preset', 'rgb'] as LedMode[]).map(m => (
            <button
              key={m}
              onClick={async () => {
                setMode(m)
                if (!isConnected) return
                if (m === 'rgb') await switchLedToRgbMode()
                else await switchLedToPresetMode()
              }}
              className={`px-2 py-0.5 rounded text-xs font-medium transition ${mode === m ? 'bg-yellow-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {m === 'preset' ? 'Colores' : 'RGB'}
            </button>
          ))}
        </div>
      </div>

      {mode === 'preset' ? (
        <div className="grid grid-cols-5 gap-1.5">
          {LED_COLORS.map(ledColor => (
            <button
              key={ledColor.value}
              type="button"
              onClick={() => handleSetColor(ledColor.value)}
              disabled={!isConnected || sending}
              className={`h-8 rounded-lg border-2 transition-all hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${
                selectedColor === ledColor.value
                  ? 'border-slate-800 ring-2 ring-slate-400 ring-offset-1'
                  : 'border-slate-200 hover:border-slate-400'
              }`}
              style={{ backgroundColor: ledColor.color }}
              title={ledColor.label}
              aria-label={ledColor.label}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg border-2 border-white shadow-sm flex-shrink-0 transition-all"
              style={{ backgroundColor: rgbHex }}
            />
            <div className="flex-1 space-y-1.5">
              {([
                ['R', r, setR, '#ef4444'],
                ['G', g, setG, '#22c55e'],
                ['B', b, setB, '#3b82f6'],
              ] as [string, number, (v: number) => void, string][]).map(([label, val, setter, accentColor]) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="text-xs font-bold w-3" style={{ color: accentColor }}>{label}</span>
                  <input
                    type="range"
                    min={0} max={255}
                    value={val}
                    onChange={e => setter(Number(e.target.value))}
                    className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
                    style={{ accentColor }}
                  />
                  <span className="text-xs tabular-nums w-7 text-right text-slate-500">{val}</span>
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={handleSetRgb}
            disabled={!isConnected || sending}
            className="w-full py-2 rounded-lg text-white text-xs font-semibold transition-all hover:opacity-90 active:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            style={{ backgroundColor: rgbHex }}
          >
            {sending ? 'Aplicando...' : 'Aplicar color'}
          </button>
        </div>
      )}
    </div>
  )
}
