import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from 'react'
import {
  mapBluetoothError,
  isWebBluetoothSupported,
  getBluetoothAdapterAvailable,
  requestWeDo2Device,
  connectGattAndGetMotorCharacteristic,
  reconnectMotorCharacteristic,
  subscribeGattDisconnected,
  disconnectGatt,
  writeMotorPower,
  setLed,
  setLedRgb as setLedRgbCmd,
  setLedAbsoluteMode,
  setLedDiscreteMode,
  beep,
  beepNote,
  stopBeep,
  powerOff as powerOffCmd,
  readBatteryLevel,
  readDeviceName,
  setDeviceName as setDeviceNameCmd,
  readFirmwareVersion,
  readManufacturer,
  LedColor,
  DeviceType,
  Port,
  Note,
  TiltDirection,
  PortDevice,
  ProximityReading,
} from '../services/bluetoothService'

// Combined sensor state — keeps useBlockProgram's proximity.value / proximity.tilt API intact
interface ProximityData {
  value: number | null        // distance in cm from motion sensor
  tilt: TiltDirection | null  // direction from tilt sensor
}

// Which device type is connected on each port (keyed by port ID)
type ConnectedSensors = Partial<Record<number, DeviceType>>

export interface HubInfo {
  battery: number
  name: string
  firmware: string
  manufacturer: string
}

export { Note }

interface WeDo2State {
  device: BluetoothDevice | null
  isConnected: boolean
  connecting: boolean
  error: string | null
  clearError: () => void
  connect: () => Promise<void>
  searchForHub: () => Promise<void>
  completeHubConnection: () => Promise<void>
  disconnect: () => void
  reconnect: () => Promise<void>
  sendPowerCommand: (power: number, direction?: 'forward' | 'backward', port?: number) => Promise<void>
  sendLedCommand: (color: LedColor) => Promise<void>
  runMotorTest: (port?: number) => Promise<void>
  connectionModalOpen: boolean
  openConnectionModal: () => void
  closeConnectionModal: () => void
  proximity: ProximityData | null
  connectedSensors: ConnectedSensors
  buttonPressed: boolean
  playBeep: (frequency?: number, durationMs?: number) => Promise<void>
  stopPiezo: () => Promise<void>
  playNote: (note: Note, octave?: number, durationMs?: number) => Promise<void>
  sendLedRgb: (r: number, g: number, b: number) => Promise<void>
  switchLedToRgbMode: () => Promise<void>
  switchLedToPresetMode: () => Promise<void>
  powerOffHub: () => Promise<void>
  readHubInfo: () => Promise<HubInfo>
  renameHub: (name: string) => Promise<void>
}

function useWeDo2State(): WeDo2State {
  const [device, setDevice] = useState<BluetoothDevice | null>(null)
  const [characteristic, setCharacteristic] = useState<BluetoothRemoteGATTCharacteristic | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [connectionModalOpen, setConnectionModalOpen] = useState(false)
  const [proximity, setProximity] = useState<ProximityData | null>(null)
  const [connectedSensors, setConnectedSensors] = useState<ConnectedSensors>({})
  const [buttonPressed, setButtonPressed] = useState(false)

  const deviceRef = useRef<BluetoothDevice | null>(null)
  const sessionUnsubscribeRef = useRef<(() => void) | null>(null)
  const connectInFlightRef = useRef(false)

  const clearConnectionState = useCallback(() => {
    setIsConnected(false)
    setCharacteristic(null)
    setProximity(null)
    setConnectedSensors({})
    setButtonPressed(false)
  }, [])

  const handleGattDisconnected = useCallback(() => {
    sessionUnsubscribeRef.current?.()
    sessionUnsubscribeRef.current = null
    clearConnectionState()
    setError(null)
  }, [clearConnectionState])

  const tearDownSession = useCallback(() => {
    sessionUnsubscribeRef.current?.()
    sessionUnsubscribeRef.current = null
    disconnectGatt(deviceRef.current)
    deviceRef.current = null
    setDevice(null)
    clearConnectionState()
  }, [clearConnectionState])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const delay = useCallback((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)), [])

  const handleProximity = useCallback((r: ProximityReading) => {
    setProximity(prev => ({ value: r.distanceCm, tilt: prev?.tilt ?? null }))
  }, [])

  const handleTilt = useCallback((r: { direction: TiltDirection }) => {
    setProximity(prev => ({ value: prev?.value ?? null, tilt: r.direction }))
  }, [])

  const handleButton = useCallback((pressed: boolean) => {
    setButtonPressed(pressed)
  }, [])

  const handlePortChange = useCallback((d: PortDevice) => {
    setConnectedSensors(prev => {
      const next = { ...prev }
      if (d.connected) {
        next[d.port as number] = d.deviceType
      } else {
        delete next[d.port as number]
        // Clear sensor data when the sensor is unplugged
        if (d.deviceType === DeviceType.DISTANCE_SENSOR)
          setProximity(prev2 => prev2 ? { ...prev2, value: null } : null)
        if (d.deviceType === DeviceType.TILT_SENSOR)
          setProximity(prev2 => prev2 ? { ...prev2, tilt: null } : null)
      }
      return next
    })
  }, [])

  useEffect(() => {
    return () => {
      sessionUnsubscribeRef.current?.()
      sessionUnsubscribeRef.current = null
      disconnectGatt(deviceRef.current)
      deviceRef.current = null
    }
  }, [])

  const searchForHub = useCallback(async () => {
    if (connectInFlightRef.current) {
      return
    }

    connectInFlightRef.current = true
    setError(null)
    setConnecting(true)

    tearDownSession()

    try {
      if (!isWebBluetoothSupported()) {
        setError(
          'Web Bluetooth no está disponible. Usa un navegador compatible (ej. Chrome) y HTTPS o localhost.',
        )
        return
      }

      const adapterOk = await getBluetoothAdapterAvailable()
      if (!adapterOk) {
        setError(
          'Bluetooth está apagado o no se encontró adaptador. Activa Bluetooth y vuelve a intentar.',
        )
        return
      }

      let bluetoothDevice: BluetoothDevice
      try {
        bluetoothDevice = await requestWeDo2Device()
      } catch (err) {
        const { message, silent } = mapBluetoothError(err)
        if (!silent && message) {
          setError(message)
        }
        return
      }

      deviceRef.current = bluetoothDevice
      setDevice(bluetoothDevice)

      sessionUnsubscribeRef.current = subscribeGattDisconnected(
        bluetoothDevice,
        handleGattDisconnected,
      )
    } finally {
      connectInFlightRef.current = false
      setConnecting(false)
    }
  }, [handleGattDisconnected, tearDownSession])

  const completeHubConnection = useCallback(async () => {
    if (connectInFlightRef.current) {
      return
    }
    const bluetoothDevice = deviceRef.current
    if (!bluetoothDevice) {
      setError('No se seleccionó ningún hub.')
      return
    }

    connectInFlightRef.current = true
    setConnecting(true)
    setError(null)

    try {
      if (!sessionUnsubscribeRef.current) {
        sessionUnsubscribeRef.current = subscribeGattDisconnected(
          bluetoothDevice,
          handleGattDisconnected,
        )
      }

      const motorCharacteristic =
        await connectGattAndGetMotorCharacteristic(
          bluetoothDevice,
          handleTilt,
          null,
          handleButton,
          null,
          handlePortChange,
          handleProximity,
        )
      setCharacteristic(motorCharacteristic)
      setIsConnected(true)
      setError(null)
    } catch (err) {
      sessionUnsubscribeRef.current?.()
      sessionUnsubscribeRef.current = null
      deviceRef.current = null
      setDevice(null)
      clearConnectionState()
      const { message, silent } = mapBluetoothError(err)
      if (!silent && message) {
        setError(message)
      } else if (!silent) {
        setError('No se pudo conectar al dispositivo.')
      }
    } finally {
      connectInFlightRef.current = false
      setConnecting(false)
    }
  }, [clearConnectionState, handleGattDisconnected, handleProximity, handleTilt, handlePortChange, handleButton])

  const connect = useCallback(async () => {
    await searchForHub()
    if (deviceRef.current) {
      await completeHubConnection()
    }
  }, [searchForHub, completeHubConnection])

  const disconnect = useCallback(() => {
    if (connectInFlightRef.current) {
      return
    }
    setError(null)
    tearDownSession()
  }, [tearDownSession])

  const reconnect = useCallback(async () => {
    if (connectInFlightRef.current) {
      return
    }
    const dev = deviceRef.current
    if (!dev) {
      setError('No hay dispositivo emparejado. Conéctate primero.')
      return
    }

    connectInFlightRef.current = true
    setError(null)
    setConnecting(true)

    try {
      sessionUnsubscribeRef.current?.()
      sessionUnsubscribeRef.current = null

      const motorCharacteristic = await reconnectMotorCharacteristic(dev)
      sessionUnsubscribeRef.current = subscribeGattDisconnected(
        dev,
        handleGattDisconnected,
      )
      setCharacteristic(motorCharacteristic)
      setIsConnected(true)
      setError(null)
    } catch (err) {
      const { message, silent } = mapBluetoothError(err)
      if (!silent && message) {
        setError(message)
      } else if (!silent) {
        setError('No se pudo reconectar al dispositivo.')
      }
    } finally {
      connectInFlightRef.current = false
      setConnecting(false)
    }
  }, [handleGattDisconnected])

  const sendPowerCommand = useCallback(
    async (power: number, direction: 'forward' | 'backward' = 'forward', port: number = 1) => {
      console.log('sendPowerCommand llamado', {
        power,
        direction,
        port,
        isConnected: !!characteristic,
      })

      if (!characteristic) {
        const msg = 'Dispositivo no conectado'
        setError(msg)
        throw new Error(msg)
      }

      setError(null)

      try {
        const dir = power === 0 ? 'forward' : direction
        await writeMotorPower(characteristic, power, dir, port)
        console.log('sendPowerCommand éxito', { power, direction: dir, port })
      } catch (err) {
        const { message, silent } = mapBluetoothError(err)
        const resolved =
          !silent && message
            ? message
            : 'No se pudo enviar el comando del motor. Verifica la conexión.'
        console.error('sendPowerCommand falló', err)
        setError(resolved)
        throw err instanceof Error ? err : new Error(resolved)
      }
    },
    [characteristic],
  )

  const sendLedCommand = useCallback(
    async (color: LedColor) => {
      if (!characteristic) {
        const msg = 'Dispositivo no conectado'
        setError(msg)
        throw new Error(msg)
      }

      setError(null)

      try {
        await setLed(characteristic, color)
        console.log('sendLedCommand éxito', { color })
      } catch (err) {
        const { message, silent } = mapBluetoothError(err)
        const resolved =
          !silent && message
            ? message
            : 'No se pudo enviar el comando LED. Verifica la conexión.'
        console.error('sendLedCommand falló', err)
        setError(resolved)
        throw err instanceof Error ? err : new Error(resolved)
      }
    },
    [characteristic],
  )

  const runMotorTest = useCallback(
    async (port: number = 1) => {
      if (!characteristic) {
        const msg = 'Dispositivo no conectado'
        setError(msg)
        throw new Error(msg)
      }

      setError(null)
      try {
        await writeMotorPower(characteristic, 100, 'forward', port)
        await delay(3000)
        await writeMotorPower(characteristic, 50, 'forward', port)
        await delay(3000)
        await writeMotorPower(characteristic, 0, 'forward', port)
        console.log('[WeDo] Test de motor completo', { port })
      } catch (err) {
        const { message, silent } = mapBluetoothError(err)
        const resolved =
          !silent && message
            ? message
            : 'Test de motor falló. Verifica la conexión.'
        console.error('runMotorTest falló', err)
        setError(resolved)
        throw err instanceof Error ? err : new Error(resolved)
      }
    },
    [characteristic, delay],
  )

  const playBeep = useCallback(async (frequency = 1000, durationMs = 300) => {
    if (!characteristic) return
    await beep(characteristic, frequency, durationMs)
  }, [characteristic])

  const stopPiezo = useCallback(async () => {
    if (!characteristic) return
    await stopBeep(characteristic)
  }, [characteristic])

  const playNote = useCallback(async (note: Note, octave = 4, durationMs = 300) => {
    if (!characteristic) return
    await beepNote(characteristic, note, octave, durationMs)
  }, [characteristic])

  const sendLedRgb = useCallback(async (r: number, g: number, b: number) => {
    if (!characteristic) return
    await setLedRgbCmd(characteristic, r, g, b)
  }, [characteristic])

  const switchLedToRgbMode = useCallback(async () => {
    if (!device) return
    await setLedAbsoluteMode(device)
  }, [device])

  const switchLedToPresetMode = useCallback(async () => {
    if (!device) return
    await setLedDiscreteMode(device)
  }, [device])

  const powerOffHub = useCallback(async () => {
    if (!device) return
    await powerOffCmd(device)
  }, [device])

  const readHubInfo = useCallback(async (): Promise<HubInfo> => {
    if (!device) throw new Error('No hay dispositivo conectado')
    const [battery, name, firmware, manufacturer] = await Promise.all([
      readBatteryLevel(device),
      readDeviceName(device),
      readFirmwareVersion(device),
      readManufacturer(device),
    ])
    return { battery, name, firmware, manufacturer }
  }, [device])

  const renameHub = useCallback(async (name: string) => {
    if (!device) return
    await setDeviceNameCmd(device, name)
  }, [device])

  const openConnectionModal = useCallback(() => {
    setConnectionModalOpen(true)
  }, [])

  const closeConnectionModal = useCallback(() => {
    setConnectionModalOpen(false)
  }, [])

  return {
    device,
    isConnected,
    connecting,
    error,
    clearError,
    connect,
    searchForHub,
    completeHubConnection,
    disconnect,
    reconnect,
    sendPowerCommand,
    sendLedCommand,
    runMotorTest,
    connectionModalOpen,
    openConnectionModal,
    closeConnectionModal,
    proximity,
    connectedSensors,
    buttonPressed,
    playBeep,
    stopPiezo,
    playNote,
    sendLedRgb,
    switchLedToRgbMode,
    switchLedToPresetMode,
    powerOffHub,
    readHubInfo,
    renameHub,
  }
}

const WeDo2Context = createContext<WeDo2State | null>(null)

export function WeDo2Provider({ children }: { children: ReactNode }) {
  const value = useWeDo2State()
  return <WeDo2Context.Provider value={value}>{children}</WeDo2Context.Provider>
}

export function useWeDo2() {
  const ctx = useContext(WeDo2Context)
  if (ctx == null) {
    throw new Error('useWeDo2 debe usarse dentro de un WeDo2Provider')
  }
  return ctx
}
