import { useState, useCallback } from 'react'
import { Music, Square } from 'lucide-react'
import { useWeDo2 } from '../hooks/useWeDo2'
import { Note } from '../services/bluetoothService'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'

const NOTES: { note: Note; label: string }[] = [
  { note: Note.C,   label: 'Do' },
  { note: Note.D,   label: 'Re' },
  { note: Note.E,   label: 'Mi' },
  { note: Note.F,   label: 'Fa' },
  { note: Note.G,   label: 'Sol' },
  { note: Note.A,   label: 'La' },
  { note: Note.B,   label: 'Si' },
]

const NOTE_COLORS = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-400', 'bg-teal-400', 'bg-blue-400', 'bg-purple-400']

export function PiezoControl() {
  const { playNote, playBeep, stopPiezo, isConnected } = useWeDo2()
  const [octave, setOctave] = useState(4)
  const [duration, setDuration] = useState(500)
  const [freq, setFreq] = useState(440)
  const [playing, setPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleNote = useCallback(async (note: Note) => {
    if (!isConnected || playing) return
    setPlaying(true)
    setError(null)
    try {
      await playNote(note, octave, duration)
    } catch (e) {
      setError(`Error: ${(e as Error).message ?? e}`)
      console.error('[Piezo] playNote failed', e)
    } finally {
      setPlaying(false)
    }
  }, [isConnected, playing, playNote, octave, duration])

  const handleBeep = useCallback(async () => {
    if (!isConnected || playing) return
    setPlaying(true)
    setError(null)
    try {
      await playBeep(freq, duration)
    } catch (e) {
      setError(`Error: ${(e as Error).message ?? e}`)
      console.error('[Piezo] playBeep failed', e)
    } finally {
      setPlaying(false)
    }
  }, [isConnected, playing, playBeep, freq, duration])

  const handleStop = useCallback(async () => {
    if (!isConnected) return
    setError(null)
    try {
      await stopPiezo()
    } catch (e) {
      console.error('[Piezo] stop failed', e)
    }
    setPlaying(false)
  }, [isConnected, stopPiezo])

  return (
    <Card className="border-2">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 text-white">
            <Music className="h-5 w-5" />
          </div>
          Piezo / Sonido
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Piano keys */}
        <div>
          <div className="text-xs text-muted-foreground mb-2">Notas musicales</div>
          <div className="flex gap-1">
            {NOTES.map(({ note, label }, i) => (
              <button
                key={note}
                onClick={() => handleNote(note)}
                disabled={!isConnected || playing}
                className={`flex-1 h-16 rounded-lg text-white text-xs font-medium transition-all hover:opacity-80 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${NOTE_COLORS[i]}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Octave */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-14">Octava</span>
          <div className="flex gap-1">
            {[3, 4, 5].map(o => (
              <button
                key={o}
                onClick={() => setOctave(o)}
                className={`px-3 py-1 rounded text-sm transition-colors ${octave === o ? 'bg-indigo-500 text-white' : 'bg-slate-100 hover:bg-slate-200'}`}
              >
                {o}
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-14">Duración</span>
          <input
            type="range"
            min={100}
            max={2000}
            step={100}
            value={duration}
            onChange={e => setDuration(Number(e.target.value))}
            className="flex-1"
          />
          <span className="text-xs tabular-nums w-12 text-right">{duration} ms</span>
        </div>

        {error && (
          <div className="text-xs text-red-600 bg-red-50 rounded px-3 py-2 font-mono break-all">
            {error}
          </div>
        )}

        {/* Custom frequency */}
        <div className="border-t pt-3 space-y-2">
          <div className="text-xs text-muted-foreground">Frecuencia personalizada</div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={1}
              max={1500}
              step={10}
              value={freq}
              onChange={e => setFreq(Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-xs tabular-nums w-14 text-right">{freq} Hz</span>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleBeep}
              disabled={!isConnected || playing}
              className="flex-1"
            >
              Tocar {freq} Hz
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleStop}
              disabled={!isConnected}
            >
              <Square className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
