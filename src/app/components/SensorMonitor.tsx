import { useEffect, useState } from 'react'
import { Gauge, Compass, Circle } from 'lucide-react'
import { useWeDo2 } from '../hooks/useWeDo2'
import { DeviceType } from '../services/bluetoothService'

const TILT_ICONS: Record<string, { icon: string; label: string; color: string }> = {
  neutral:  { icon: '⬤', label: 'Neutral',    color: 'text-slate-400' },
  backward: { icon: '↓', label: 'Atrás',       color: 'text-red-500'   },
  forward:  { icon: '↑', label: 'Adelante',    color: 'text-green-500' },
  left:     { icon: '←', label: 'Izquierda',   color: 'text-blue-500'  },
  right:    { icon: '→', label: 'Derecha',      color: 'text-blue-500'  },
  unknown:  { icon: '?', label: 'Desconocido', color: 'text-slate-300' },
}

// MAX_DISTANCE = 10 in LegoDeviceSDK.jar
const MAX_DISTANCE_CM = 10

export function SensorMonitor() {
  const { proximity, connectedSensors, isConnected, buttonPressed } = useWeDo2()
  const [distanceHistory, setDistanceHistory] = useState<number[]>([])

  const hasDistance = isConnected && Object.values(connectedSensors).includes(DeviceType.DISTANCE_SENSOR)
  const hasTilt     = isConnected && Object.values(connectedSensors).includes(DeviceType.TILT_SENSOR)

  useEffect(() => {
    if (proximity?.value != null) {
      setDistanceHistory(prev => [...prev, proximity.value!].slice(-20))
    }
  }, [proximity?.value])

  useEffect(() => {
    if (!hasDistance) setDistanceHistory([])
  }, [hasDistance])

  const tiltInfo = proximity?.tilt ? TILT_ICONS[proximity.tilt] : null
  const distancePct = proximity?.value != null
    ? Math.min((proximity.value / MAX_DISTANCE_CM) * 100, 100)
    : 0

  return (
    <div className="space-y-2">
      {/* Botón + Inclinación — fila */}
      <div className="grid grid-cols-2 gap-2">
        {/* Botón verde */}
        <div className="rounded-xl border border-slate-200 bg-white p-2.5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className={`w-5 h-5 rounded-md flex items-center justify-center text-white transition-colors ${buttonPressed && isConnected ? 'bg-green-500' : 'bg-slate-300'}`}>
              <Circle className="w-2.5 h-2.5" />
            </div>
            <span className="text-xs font-semibold text-slate-600">Botón verde</span>
          </div>
          <div className="flex justify-center py-1">
            <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-100 ${
              !isConnected
                ? 'bg-slate-100 border-slate-200'
                : buttonPressed
                ? 'bg-green-500 border-green-400 shadow-md shadow-green-200 scale-95'
                : 'bg-slate-100 border-slate-200'
            }`}>
              <span className={`text-xs font-medium transition-colors ${buttonPressed && isConnected ? 'text-white' : 'text-slate-400'}`}>
                {!isConnected ? '—' : buttonPressed ? '✓' : 'libre'}
              </span>
            </div>
          </div>
        </div>

        {/* Inclinación */}
        <div className="rounded-xl border border-slate-200 bg-white p-2.5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="w-5 h-5 rounded-md flex items-center justify-center bg-purple-500 text-white">
              <Compass className="w-2.5 h-2.5" />
            </div>
            <span className="text-xs font-semibold text-slate-600">Inclinación</span>
          </div>
          {!isConnected || !hasTilt ? (
            <p className="text-xs text-slate-400 text-center py-2">
              {!isConnected ? 'Sin conexión' : 'Sin sensor'}
            </p>
          ) : (
            <div className="flex flex-col items-center justify-center py-0.5">
              <span className={`text-3xl leading-none ${tiltInfo?.color ?? 'text-slate-300'} transition-all`}>
                {tiltInfo?.icon ?? '⬤'}
              </span>
              <p className="text-xs text-slate-500 mt-1">{tiltInfo?.label ?? '...'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Distancia — fila completa */}
      <div className="rounded-xl border border-slate-200 bg-white p-2.5">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md flex items-center justify-center bg-green-500 text-white">
              <Gauge className="w-2.5 h-2.5" />
            </div>
            <span className="text-xs font-semibold text-slate-600">Distancia</span>
          </div>
          {isConnected && hasDistance && proximity?.value != null && (
            <span className="text-lg font-bold tabular-nums text-green-600">
              {proximity.value.toFixed(1)}
              <span className="text-xs text-slate-400 ml-0.5 font-normal">cm</span>
            </span>
          )}
        </div>

        {!isConnected || !hasDistance ? (
          <p className="text-xs text-slate-400 text-center py-2">
            {!isConnected ? 'Sin conexión' : 'Sin sensor de distancia'}
          </p>
        ) : (
          <div className="space-y-1.5">
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-green-500 transition-all"
                style={{ width: `${distancePct}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>0</span>
              <span>{MAX_DISTANCE_CM} cm</span>
            </div>
            {distanceHistory.length > 0 && (
              <div className="h-10 flex items-end gap-0.5 mt-1">
                {distanceHistory.map((v, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-green-400 rounded-t transition-all opacity-80"
                    style={{ height: `${Math.max((v / MAX_DISTANCE_CM) * 100, 4)}%` }}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
