// ─────────────────────────────────────────────────────────────────────────────
// LEGO WeDo 2.0 – Bluetooth LE driver (TypeScript)
// ─────────────────────────────────────────────────────────────────────────────

/** LEGO WeDo 2.0 command service UUID discovered from Python/WeDo tests. */
export const WEDO2_COMMAND_SERVICE_UUID = '00004f0e-1212-efde-1523-785feabcd123'

/** LEGO WeDo 2.0 primary GATT service UUID for notifications and legacy control. */
export const WEDO2_SERVICE_UUID = '00001523-1212-efde-1523-785feabcd123'

// Standard BLE service UUIDs needed for hub info reads
const BLE_BATTERY_SERVICE_UUID      = '0000180f-0000-1000-8000-00805f9b34fb'
const BLE_DEVICE_INFO_SERVICE_UUID  = '0000180a-0000-1000-8000-00805f9b34fb'

export const WEDO2_SERVICE_UUIDS = [
  WEDO2_COMMAND_SERVICE_UUID,
  WEDO2_SERVICE_UUID,
]

// All services we need access to — includes standard BLE services for hub info
export const WEDO2_ALL_SERVICE_UUIDS = [
  ...WEDO2_SERVICE_UUIDS,
  BLE_BATTERY_SERVICE_UUID,
  BLE_DEVICE_INFO_SERVICE_UUID,
]

// Hub I/O characteristics (IoServiceDefinition.cs)
export const CHAR_INPUT_VALUE  = '00001560-1212-efde-1523-785feabcd123' // notify: sensor readings
export const CHAR_INPUT_FORMAT = '00001561-1212-efde-1523-785feabcd123' // notify: input format ack
export const CHAR_INPUT_CMD    = '00001563-1212-efde-1523-785feabcd123' // write:  configure input
export const CHAR_OUTPUT_CMD   = '00001565-1212-efde-1523-785feabcd123' // write:  motor/LED/piezo

// Hub-control service characteristics
export const CHAR_NAME         = '00001524-1212-efde-1523-785feabcd123' // read/write: device name
export const CHAR_BUTTON       = '00001526-1212-efde-1523-785feabcd123' // notify: green button
export const CHAR_PORT_TYPE    = '00001527-1212-efde-1523-785feabcd123' // notify: attach/detach
export const CHAR_LOW_VOLTAGE  = '00001528-1212-efde-1523-785feabcd123' // notify: low-battery alert
export const CHAR_HIGH_CURRENT = '00001529-1212-efde-1523-785feabcd123' // notify: over-current alert
export const CHAR_LOW_SIGNAL   = '0000152a-1212-efde-1523-785feabcd123' // notify: weak signal alert
export const CHAR_POWER_OFF    = '0000152b-1212-efde-1523-785feabcd123' // write:  shut down the hub
export const CHAR_VCC_PORT     = '0000152c-1212-efde-1523-785feabcd123' // read/write: Vcc control
export const CHAR_BATTERY_TYPE = '0000152d-1212-efde-1523-785feabcd123' // read: alkaline vs rechargeable
export const CHAR_DISCONNECT   = '0000152e-1212-efde-1523-785feabcd123' // write: force disconnect

// Standard BLE characteristics
export const CHAR_BATTERY_LEVEL = '00002a19-0000-1000-8000-00805f9b34fb'
export const CHAR_FW_REVISION   = '00002a26-0000-1000-8000-00805f9b34fb'
export const CHAR_SW_REVISION   = '00002a28-0000-1000-8000-00805f9b34fb'
export const CHAR_MANUFACTURER  = '00002a29-0000-1000-8000-00805f9b34fb'

export const WEDO2_WRITE_CHARACTERISTIC_UUIDS = [
  CHAR_OUTPUT_CMD,
  CHAR_INPUT_CMD,
]

export const WEDO2_NOTIFY_CHARACTERISTIC_UUIDS = [
  CHAR_INPUT_VALUE,
  CHAR_INPUT_FORMAT,
  CHAR_PORT_TYPE,
  CHAR_BUTTON,
  CHAR_LOW_VOLTAGE,
]

// Internal port IDs (announced via CHAR_PORT_TYPE on connect)
const PORT_PIEZO = 5  // device type 0x16
const PORT_LED   = 6  // device type 0x17

// Ports 3–6 are internal (voltage/current/piezo/LED); never fire onPortChange
const INTERNAL_PORTS = new Set([3, 4, 5, 6])

// Input-command IDs (BluetoothInputCommand.cs)
const INPUT_FORMAT       = 0x01
const INPUT_ACTION_WRITE = 0x02

// Command IDs (BluetoothOutputCommand.cs)
const CMD_MOTOR_POWER = 0x01
const CMD_PIEZO_PLAY  = 0x02
const CMD_PIEZO_STOP  = 0x03
const CMD_RGB         = 0x04
const CMD_DIRECT      = 0x05

const RESET_BYTES = [0x44, 0x11, 0xAA]

// Piezo limits (BluetoothPiezoTonePlayer.cs)
export const PIEZO_MIN_FREQUENCY   = 1
export const PIEZO_MAX_FREQUENCY   = 1500
export const PIEZO_MAX_DURATION_MS = 65535

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface PortDevice {
  port: Port
  deviceType: DeviceType
  connected: boolean
}

export interface ProximityReading {
  port: Port
  distanceCm: number
}

// ─── Enums ───────────────────────────────────────────────────────────────────

export enum Port {
  A = 0x01,
  B = 0x02,
}

export enum DeviceType {
  NONE            = 0x00,
  MOTOR           = 0x01,
  VOLTAGE_SENSOR  = 0x14,
  CURRENT_SENSOR  = 0x15,
  PIEZO           = 0x16,
  RGB_LED         = 0x17,
  TILT_SENSOR     = 0x22,
  DISTANCE_SENSOR = 0x23,
}

export enum Note {
  C   = 1,
  CIS = 2,  // C#
  D   = 3,
  DIS = 4,  // D#
  E   = 5,
  F   = 6,
  FIS = 7,  // F#
  G   = 8,
  GIS = 9,  // G#
  A   = 10,
  AIS = 11, // A#
  B   = 12,
}

// A4 reference values for noteToFrequency()
const NOTE_BASE_FREQ       = 440.0
const NOTE_BASE_HALF_STEPS = Note.A

/** Convert a musical note + octave to Hz. Port of BluetoothPiezoTonePlayer.PlayNote. */
export function noteToFrequency(note: Note, octave = 4): number {
  const halfSteps = note - NOTE_BASE_HALF_STEPS + (octave - 4) * 12
  const freq = NOTE_BASE_FREQ * Math.pow(2 ** (1 / 12), halfSteps)
  return Math.round(Math.min(freq, PIEZO_MAX_FREQUENCY))
}


export const LED_COLOR_INDEX = {
  off:        0x00,
  pink:       0x01,
  purple:     0x02,
  blue:       0x03,
  light_blue: 0x04,
  cyan:       0x05,
  green:      0x06,
  yellow:     0x07,
  orange:     0x08,
  red:        0x09,
  white:      0x0a,
} as const

export type LedColor = keyof typeof LED_COLOR_INDEX

function buildOutputFrame(connectId: number, commandId: number, payload: number[]): Uint8Array {
  return new Uint8Array([connectId, commandId, payload.length, ...payload])
}

// Send an Input-Format command so the hub starts streaming sensor data.
// Port of BluetoothInputCommand.WriteInputFormat + ReadValueForConnectId.
async function sendConfigureInput(
  inputChar: BluetoothRemoteGATTCharacteristic,
  portId: number,
  deviceType: DeviceType,
): Promise<void> {
  let mode: number, unit: number
  if (deviceType === DeviceType.TILT_SENSOR) {
    mode = 0x01; unit = 0x02  // direction mode, SI units
  } else if (deviceType === DeviceType.DISTANCE_SENSOR) {
    mode = 0x00; unit = 0x02  // detect mode, SI units
  } else {
    return
  }

  const cmd = new Uint8Array([
    INPUT_FORMAT,
    INPUT_ACTION_WRITE,
    portId,
    deviceType,
    mode,
    0x01, 0x00, 0x00, 0x00,  // deltaInterval = 1 (LE uint32)
    unit,
    0x01,                      // notifications enabled
  ])
  try {
    await writeCharacteristic(inputChar, cmd)
    // Force an initial snapshot so the callback fires immediately on connect.
    await writeCharacteristic(inputChar, new Uint8Array([0x00, 0x01, portId]))
  } catch (e) {
    console.warn(`[WeDo] configure-input failed on port ${portId}:`, e)
  }
}

/** Manually configure a sensor port to start streaming data. */
export async function configureInput(
  device: BluetoothDevice,
  port: Port | number,
  deviceType: DeviceType,
): Promise<void> {
  const services = await device.gatt!.getPrimaryServices()
  for (const svc of services) {
    try {
      const c = await svc.getCharacteristic(CHAR_INPUT_CMD)
      await sendConfigureInput(c, Number(port), deviceType)
      return
    } catch { /* try next */ }
  }
  throw new Error('CHAR_INPUT_CMD not found')
}

function buildMotorFrame(port: number, power: number): Uint8Array {
  const signedByte = power < 0 ? (power & 0xff) : power
  return buildOutputFrame(port, CMD_MOTOR_POWER, [signedByte])
}

function buildLedCommand(color: LedColor): Uint8Array {
  return buildOutputFrame(PORT_LED, CMD_RGB, [LED_COLOR_INDEX[color]])
}

function buildLedRgbFrame(r: number, g: number, b: number): Uint8Array {
  return buildOutputFrame(PORT_LED, CMD_RGB, [r & 0xff, g & 0xff, b & 0xff])
}

function buildPiezoFrame(frequency: number, durationMs: number): Uint8Array {
  const freq = Math.max(PIEZO_MIN_FREQUENCY, Math.min(PIEZO_MAX_FREQUENCY, Math.round(frequency)))
  const dur  = Math.max(0, Math.min(PIEZO_MAX_DURATION_MS, Math.round(durationMs)))
  return buildOutputFrame(PORT_PIEZO, CMD_PIEZO_PLAY, [
    freq & 0xff, (freq >> 8) & 0xff,
    dur  & 0xff, (dur  >> 8) & 0xff,
  ])
}

function buildPiezoStopFrame(): Uint8Array {
  return buildOutputFrame(PORT_PIEZO, CMD_PIEZO_STOP, [])
}

function buildResetSensorFrame(port: number): Uint8Array {
  return buildOutputFrame(port, CMD_DIRECT, RESET_BYTES)
}

// --- Tilt decoding ---------------------------------------------------------
// Values verified against TiltSensor$TiltSensorDirection in LegoDeviceSDK.jar
const TILT_DIRECTION_MAP = {
  0:  'neutral',
  3:  'backward',
  5:  'right',
  7:  'left',
  9:  'forward',
  10: 'unknown',
} as const

export type TiltDirection = 'neutral' | 'backward' | 'right' | 'left' | 'forward' | 'unknown'

interface TiltReading {
  direction: TiltDirection
  raw: number
  timestamp: number
}

// Número de lecturas iniciales a ignorar para evitar el primer valor espurio del hub.
// Bajar a 1 da más velocidad, subir a 3+ da más estabilidad pero más latencia.
const TILT_WARMUP_READS = 1

export interface WeDoNotification {
  uuid: string
  rawHex: string
  // For distance packets: centimetres (0–10). For tilt: the direction int (0/3/5/7/9/10).
  value: number | null
  tilt: TiltDirection | null
}

function makeRawNotification(uuid: string, bytes: Uint8Array): WeDoNotification {
  return {
    uuid: normalizeUuid(uuid),
    rawHex: Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(''),
    value: null,
    tilt: null,
  }
}

// --- Helpers ---------------------------------------------------------------
function normalizeUuid(uuid: string): string {
  return String(uuid || '').toLowerCase()
}

function isKnownWriteCharacteristic(c: BluetoothRemoteGATTCharacteristic): boolean {
  return WEDO2_WRITE_CHARACTERISTIC_UUIDS.includes(normalizeUuid(c.uuid))
}

function isKnownNotifyCharacteristic(c: BluetoothRemoteGATTCharacteristic): boolean {
  return WEDO2_NOTIFY_CHARACTERISTIC_UUIDS.includes(normalizeUuid(c.uuid))
}

function isWritable(c: BluetoothRemoteGATTCharacteristic): boolean {
  return !!(
    c.properties?.write ||
    c.properties?.writeWithoutResponse ||
    typeof (c as any).writeValue === 'function' ||
    typeof (c as any).writeValueWithResponse === 'function' ||
    typeof (c as any).writeValueWithoutResponse === 'function'
  )
}

async function findWriteCharacteristic(device: BluetoothDevice): Promise<BluetoothRemoteGATTCharacteristic> {
  const services: BluetoothRemoteGATTService[] = []

  for (const uuid of WEDO2_SERVICE_UUIDS) {
    try {
      const service = await device.gatt!.getPrimaryService(uuid)
      services.push(service)
    } catch {
      // ignore missing service
    }
  }

  if (services.length === 0) {
    services.push(...(await device.gatt!.getPrimaryServices()))
  }
  const knownCandidates: BluetoothRemoteGATTCharacteristic[] = []
  let firstGeneric: BluetoothRemoteGATTCharacteristic | null = null

  console.log('[WeDo] Primary services:', services.map((service) => service.uuid))

  for (const service of services) {
    const chars = await service.getCharacteristics()
    console.log(
      '[WeDo] Service characteristics',
      service.uuid,
      chars.map((c) => c.uuid),
    )

    for (const c of chars) {
      if (isKnownWriteCharacteristic(c)) {
        knownCandidates.push(c)
      }
      if (!firstGeneric && isWritable(c)) {
        firstGeneric = c
      }
    }
  }

  for (const uuid of WEDO2_WRITE_CHARACTERISTIC_UUIDS) {
    const match = knownCandidates.find((c) => normalizeUuid(c.uuid) === uuid)
    if (match) {
      console.log('[WeDo] Write characteristic selected:', match.uuid)
      return match
    }
  }

  for (const uuid of WEDO2_WRITE_CHARACTERISTIC_UUIDS) {
    for (const service of services) {
      try {
        const c = await service.getCharacteristic(uuid)
        console.log('[WeDo] getCharacteristic by UUID', uuid, '->', c.uuid)
        return c
      } catch (error) {
        console.log('[WeDo] getCharacteristic failed for', uuid, 'on', service.uuid, (error as Error)?.message)
      }
    }
  }

  if (firstGeneric) {
    console.warn('[WeDo] Using generic writable characteristic:', firstGeneric.uuid)
    return firstGeneric
  }

  throw new Error('No writable WeDo 2.0 characteristic found')
}

// --- Pure testable helpers ---------------------------------------------------

/**
 * Process a raw CHAR_BUTTON notification byte array.
 * Returns the new pressed state if it changed, or null if it should be ignored
 * (empty data or same state as before — hub re-emits on every cycle).
 */
export function processButtonBytes(
  bytes: Uint8Array,
  lastState: boolean | null,
): { pressed: boolean; changed: boolean } | null {
  if (bytes.length === 0) return null
  const pressed = Boolean(bytes[0])
  if (pressed === lastState) return { pressed, changed: false }
  return { pressed, changed: true }
}

/**
 * Process a raw CHAR_LOW_VOLTAGE notification.
 * Returns true if a low-battery alert should fire.
 */
export function processLowVoltageBytes(bytes: Uint8Array): boolean {
  return bytes.length > 0 && Boolean(bytes[0])
}

/**
 * Decode a CHAR_PORT_TYPE packet.
 * Returns { portId, connected, deviceType } for external ports,
 * or null if the packet is for an internal port or is malformed.
 */
export function decodePortTypePacket(
  bytes: Uint8Array,
): { portId: number; connected: boolean; deviceType: DeviceType } | null {
  if (bytes.length < 2) return null
  const portId = bytes[0]
  if (INTERNAL_PORTS.has(portId)) return null

  if (bytes[1] === 0x01 && bytes.length >= 4) {
    return { portId, connected: true, deviceType: bytes[3] as DeviceType }
  }
  if (bytes[1] === 0x00) {
    return { portId, connected: false, deviceType: DeviceType.NONE }
  }
  return null
}

/**
 * Decode a CHAR_INPUT_VALUE sensor packet.
 * Returns { portId, distanceCm } for distance sensors
 * or { portId, direction } for tilt sensors, based on the provided device type.
 */
export function decodeSensorPacket(
  bytes: Uint8Array,
  deviceType: DeviceType,
): { portId: number; distanceCm: number } | { portId: number; direction: string } | null {
  if (bytes.length < 3 || (bytes[0] !== 0x02 && bytes[0] !== 0x04)) return null
  const portId = bytes[1]

  if (deviceType === DeviceType.DISTANCE_SENSOR && bytes.length >= 6) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
    const cm = view.getFloat32(2, true)
    if (Number.isNaN(cm)) return null
    return { portId, distanceCm: cm }
  }

  if (deviceType === DeviceType.TILT_SENSOR && bytes.length >= 6) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
    const raw = view.getFloat32(2, true)
    const dirKey = Math.round(raw)
    const direction = TILT_DIRECTION_MAP[dirKey as keyof typeof TILT_DIRECTION_MAP] ?? null
    if (direction === null) return null
    return { portId, direction }
  }

  return null
}

// --- Notifications -----------------------------------------------------------
async function startNotifications(
  device: BluetoothDevice,
  onTilt: ((reading: TiltReading) => void) | null,
  onNotify: ((payload: WeDoNotification) => void) | null,
  onButton?: ((pressed: boolean) => void) | null,
  onLowBattery?: (() => void) | null,
  onPortChange?: ((d: PortDevice) => void) | null,
  onProximity?: ((r: ProximityReading) => void) | null,
): Promise<void> {
  const services = await device.gatt!.getPrimaryServices()

  // portId → DeviceType, populated from CHAR_PORT_TYPE announcements
  const portDevices = new Map<number, DeviceType>()

  // Per-characteristic tilt debounce state
  const tiltWarmup = new Map<string, { count: number; last: TiltDirection | null }>()

  // Button debounce state: hub re-emits the same byte multiple times per press
  let lastButtonState: boolean | null = null

  // CHAR_INPUT_CMD characteristic — needed to auto-configure sensors on attach
  let inputCmdChar: BluetoothRemoteGATTCharacteristic | null = null
  for (const svc of services) {
    try { inputCmdChar = await svc.getCharacteristic(CHAR_INPUT_CMD); break } catch {}
  }

  for (const service of services) {
    const chars = await service.getCharacteristics()
    const allNotify = chars.filter(c => !!(c.properties?.notify || c.properties?.indicate))
    const knownNotify = allNotify.filter(isKnownNotifyCharacteristic)
    const notifyChars = knownNotify.length > 0 ? knownNotify : allNotify

    for (const c of notifyChars) {
      tiltWarmup.set(c.uuid, { count: 0, last: null })

      c.addEventListener('characteristicvaluechanged', (event) => {
        const target = event.target as BluetoothRemoteGATTCharacteristic
        const value = target?.value
        if (!value) return
        const bytes = new Uint8Array(value.buffer, value.byteOffset, value.byteLength)
        const uuid = normalizeUuid(c.uuid)
        console.log('[WeDo] Notify', { uuid, hex: Array.from(bytes).map(b => b.toString(16).padStart(2,'0')).join('') })

        // ── Button ───────────────────────────────────────────────────────────
        if (uuid === CHAR_BUTTON) {
          if (!onButton || bytes.length === 0) return
          const pressed = Boolean(bytes[0])
          if (pressed === lastButtonState) return
          lastButtonState = pressed
          try { onButton(pressed) } catch (e) { console.warn('[WeDo] onButton', e) }
          return
        }

        // ── Low-voltage ──────────────────────────────────────────────────────
        if (uuid === CHAR_LOW_VOLTAGE) {
          if (onLowBattery && bytes.length > 0 && Boolean(bytes[0]))
            try { onLowBattery() } catch (e) { console.warn('[WeDo] onLowBattery', e) }
          return
        }

        // ── Port attach / detach ─────────────────────────────────────────────
        if (uuid === CHAR_PORT_TYPE) {
          if (bytes.length < 2) return
          const portId = bytes[0]

          // Internal ports (piezo=5, LED=6, voltage=3, current=4):
          // cache their type but never fire onPortChange.
          if (INTERNAL_PORTS.has(portId)) {
            if (bytes[1] === 0x01 && bytes.length >= 4) {
              portDevices.set(portId, bytes[3] as DeviceType)
              console.log('[WeDo] Internal port', portId, '→ type', bytes[3].toString(16))
            }
            return
          }

          // External port (A=1, B=2)
          let connected: boolean
          let newDev: DeviceType
          if (bytes[1] === 0x01 && bytes.length >= 4) {
            newDev = bytes[3] as DeviceType
            connected = true
          } else if (bytes[1] === 0x00) {
            newDev = DeviceType.NONE
            connected = false
          } else return

          const prevDev = portDevices.get(portId) ?? DeviceType.NONE
          if (prevDev === newDev) return
          portDevices.set(portId, newDev)

          // Auto-configure sensor so it starts streaming immediately
          if (connected && inputCmdChar &&
              (newDev === DeviceType.TILT_SENSOR || newDev === DeviceType.DISTANCE_SENSOR)) {
            sendConfigureInput(inputCmdChar, portId, newDev)
          }

          if (onPortChange) {
            const reportedDev = connected ? newDev : prevDev
            try { onPortChange({ port: portId as Port, deviceType: reportedDev, connected }) }
            catch (e) { console.warn('[WeDo] onPortChange', e) }
          }
          return
        }

        // ── Sensor data (INPUT_VALUE) ─────────────────────────────────────────
        // Packet layout: [msgType(0x02=snapshot|0x04=stream), portId, value(float32 LE)]
        // Route by deviceType from portDevices map — NOT by byte pattern, because
        // both sensors produce identical packet structures on different ports.
        if (uuid === CHAR_INPUT_VALUE) {
          if (bytes.length < 3 || (bytes[0] !== 0x02 && bytes[0] !== 0x04)) return
          const portId   = bytes[1]
          const devType  = portDevices.get(portId) ?? DeviceType.NONE
          const rawHex   = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')

          if (devType === DeviceType.DISTANCE_SENSOR && bytes.length >= 6) {
            const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
            const cm = view.getFloat32(2, true)
            if (!Number.isNaN(cm)) {
              if (onProximity)
                try { onProximity({ port: portId as Port, distanceCm: cm }) }
                catch (e) { console.warn('[WeDo] onProximity', e) }
              if (onNotify)
                try { onNotify({ uuid, rawHex, value: cm, tilt: null }) }
                catch (e) { console.warn('[WeDo] onNotify', e) }
            }

          } else if (devType === DeviceType.TILT_SENSOR && bytes.length >= 6) {
            const view   = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
            const raw    = view.getFloat32(2, true)
            const dirKey = Math.round(raw)
            const direction = TILT_DIRECTION_MAP[dirKey as keyof typeof TILT_DIRECTION_MAP] ?? null
            if (direction !== null) {
              const ws = tiltWarmup.get(c.uuid)!
              ws.count++
              if (ws.count > TILT_WARMUP_READS) {
                if (onTilt && direction === ws.last)
                  try { onTilt({ direction, raw: dirKey, timestamp: Date.now() }) }
                  catch (e) { console.warn('[WeDo] onTilt', e) }
                if (onNotify)
                  try { onNotify({ uuid, rawHex, value: dirKey, tilt: direction }) }
                  catch (e) { console.warn('[WeDo] onNotify', e) }
              }
              ws.last = direction
            }

          } else if (onNotify) {
            try { onNotify(makeRawNotification(c.uuid, bytes)) }
            catch (e) { console.warn('[WeDo] onNotify', e) }
          }
          return
        }

        // ── Generic notify (other characteristics) ────────────────────────────
        if (onNotify) {
          try { onNotify(makeRawNotification(c.uuid, bytes)) }
          catch (e) { console.warn('[WeDo] onNotify', e) }
        }
      })

      try {
        await c.startNotifications()
        console.log('[WeDo] Notifications enabled on', c.uuid)
      } catch (err) {
        console.warn('[WeDo] Could not enable notifications on', c.uuid, err)
      }
    }
  }
}

// --- Robust write ---------------------------------------------------------
// Always attempt write-with-response first (matches Python SDK response=True behavior).
// If the characteristic only supports write-without-response Chrome throws NotSupportedError
// — in that case we catch it and retry without response.
async function writeCharacteristic(characteristic: BluetoothRemoteGATTCharacteristic, data: Uint8Array): Promise<void> {
  const hex = Array.from(data).map((b) => b.toString(16).padStart(2, '0')).join('')
  console.log('[WeDo] Write request', { uuid: characteristic.uuid, hex })

  const char = characteristic as any

  if (typeof char.writeValueWithResponse === 'function') {
    try {
      return await char.writeValueWithResponse(data)
    } catch (e) {
      if ((e as DOMException)?.name !== 'NotSupportedError') throw e
      // characteristic is write-without-response only — fall through
    }
  }
  if (typeof char.writeValueWithoutResponse === 'function') return char.writeValueWithoutResponse(data)
  if (typeof char.writeValue === 'function') return char.writeValue(data)
  throw new Error('Characteristic has no write method')
}

// --- Public API -----------------------------------------------------------
export function isWebBluetoothSupported(): boolean {
  return typeof navigator !== 'undefined' && !!(navigator as any).bluetooth
}

export async function getBluetoothAdapterAvailable(): Promise<boolean> {
  if (!isWebBluetoothSupported()) return false
  const bt = (navigator as any).bluetooth
  if (typeof bt.getAvailability !== 'function') return true
  try { return await bt.getAvailability() } catch { return true }
}

export function requestWeDo2Device(): Promise<BluetoothDevice> {
  return (navigator as any).bluetooth.requestDevice({
    acceptAllDevices: true,
    optionalServices: WEDO2_ALL_SERVICE_UUIDS,
  })
}

export async function connectGattAndGetMotorCharacteristic(
  device: BluetoothDevice,
  onTilt: ((reading: TiltReading) => void) | null,
  onNotify: ((payload: WeDoNotification) => void) | null,
  onButton?: ((pressed: boolean) => void) | null,
  onLowBattery?: (() => void) | null,
  onPortChange?: ((d: PortDevice) => void) | null,
  onProximity?: ((r: ProximityReading) => void) | null,
): Promise<BluetoothRemoteGATTCharacteristic> {
  await device.gatt!.connect()
  await new Promise(r => setTimeout(r, 300))
  const writeChar = await findWriteCharacteristic(device)
  await startNotifications(device, onTilt, onNotify, onButton, onLowBattery, onPortChange, onProximity)
  console.log('[WeDo] Connected. writeCharacteristic:', writeChar.uuid)
  return writeChar
}

export async function reconnectMotorCharacteristic(device: BluetoothDevice): Promise<BluetoothRemoteGATTCharacteristic> {
  if (!device.gatt!.connected) {
    await device.gatt!.connect()
  }
  return findWriteCharacteristic(device)
}

export function subscribeGattDisconnected(device: BluetoothDevice, onDisconnected: () => void): () => void {
  device.addEventListener('gattserverdisconnected', onDisconnected)
  return () => device.removeEventListener('gattserverdisconnected', onDisconnected)
}

export function disconnectGatt(device: BluetoothDevice | null): void {
  if (device?.gatt?.connected) {
    device.gatt.disconnect()
  }
}

export async function writeMotorPower(
  characteristic: BluetoothRemoteGATTCharacteristic,
  power: number,
  direction: 'forward' | 'backward',
  port: number = 1
): Promise<void> {
  const clamped = Math.min(100, Math.max(0, Math.round(power)))
  const signedPower =
    clamped === 0
      ? 0
      : direction === 'backward'
      ? -clamped
      : clamped

  const buffer = buildMotorFrame(port, signedPower)
  console.log('[WeDo] Motor write', { port, power: clamped, direction, buffer: Array.from(buffer) })
  await writeCharacteristic(characteristic, buffer)
}

/** Set motor speed directly: -100 (full reverse) to 100 (full forward), 0 = stop. */
export async function setMotorSpeed(
  characteristic: BluetoothRemoteGATTCharacteristic,
  port: Port | number,
  speed: number,
): Promise<void> {
  const clamped = Math.max(-100, Math.min(100, Math.round(speed)))
  const buffer = buildMotorFrame(Number(port), clamped)
  console.log('[WeDo] Motor speed', { port, speed: clamped, buffer: Array.from(buffer) })
  await writeCharacteristic(characteristic, buffer)
}

export async function stopMotor(
  characteristic: BluetoothRemoteGATTCharacteristic,
  port: Port | number,
): Promise<void> {
  await setMotorSpeed(characteristic, port, 0)
}

export async function stopAllMotors(characteristic: BluetoothRemoteGATTCharacteristic): Promise<void> {
  await stopMotor(characteristic, Port.A)
  await stopMotor(characteristic, Port.B)
}

export async function ledOff(characteristic: BluetoothRemoteGATTCharacteristic): Promise<void> {
  await setLed(characteristic, 'off')
}

export async function setLed(characteristic: BluetoothRemoteGATTCharacteristic, color: LedColor): Promise<void> {
  const buffer = buildLedCommand(color)
  console.log('[WeDo] LED', { color, buffer: Array.from(buffer) })
  await writeCharacteristic(characteristic, buffer)
}

export async function setLedRgb(
  characteristic: BluetoothRemoteGATTCharacteristic,
  r: number,
  g: number,
  b: number,
): Promise<void> {
  const buffer = buildLedRgbFrame(r, g, b)
  console.log('[WeDo] LED RGB', { r, g, b, buffer: Array.from(buffer) })
  await writeCharacteristic(characteristic, buffer)
}

// LED mode switching via CHAR_INPUT_CMD:
// DISCRETE mode (default): hub accepts indexed color commands [6, 0x04, 1, index]
// ABSOLUTE mode:            hub accepts raw RGB commands     [6, 0x04, 3, r, g, b]
// Must be set BEFORE sending the corresponding output command.
async function setLedInputMode(device: BluetoothDevice, mode: 0 | 1): Promise<void> {
  const services = await device.gatt!.getPrimaryServices()
  for (const svc of services) {
    try {
      const inputChar = await svc.getCharacteristic(CHAR_INPUT_CMD)
      const cmd = new Uint8Array([
        INPUT_FORMAT,
        INPUT_ACTION_WRITE,
        PORT_LED,
        DeviceType.RGB_LED,
        mode,
        0x01, 0x00, 0x00, 0x00,  // deltaInterval = 1 (LE uint32)
        0x00,                      // unit = RAW
        0x00,                      // notifications disabled
      ])
      await writeCharacteristic(inputChar, cmd)
      console.log('[WeDo] LED input mode →', mode === 1 ? 'ABSOLUTE (RGB)' : 'DISCRETE (index)')
      return
    } catch { /* try next service */ }
  }
  console.warn('[WeDo] Could not find CHAR_INPUT_CMD to switch LED mode')
}

/** Switch LED to absolute RGB mode. Must be called before setLedRgb(). */
export async function setLedAbsoluteMode(device: BluetoothDevice): Promise<void> {
  await setLedInputMode(device, 1)
}

/** Switch LED back to discrete (indexed-color) mode. */
export async function setLedDiscreteMode(device: BluetoothDevice): Promise<void> {
  await setLedInputMode(device, 0)
}

/** Play a tone on the internal piezo. Pass durationMs=0 to play until stopBeep(). */
export async function beep(
  characteristic: BluetoothRemoteGATTCharacteristic,
  frequency = 1000,
  durationMs = 300,
): Promise<void> {
  const buffer = buildPiezoFrame(frequency, durationMs)
  console.log('[WeDo] Beep', { frequency, durationMs, buffer: Array.from(buffer) })
  await writeCharacteristic(characteristic, buffer)
}

export async function beepNote(
  characteristic: BluetoothRemoteGATTCharacteristic,
  note: Note,
  octave = 4,
  durationMs = 300,
): Promise<void> {
  await beep(characteristic, noteToFrequency(note, octave), durationMs)
}

export async function stopBeep(characteristic: BluetoothRemoteGATTCharacteristic): Promise<void> {
  await writeCharacteristic(characteristic, buildPiezoStopFrame())
}

export async function resetSensor(
  characteristic: BluetoothRemoteGATTCharacteristic,
  port: Port | number,
): Promise<void> {
  await writeCharacteristic(characteristic, buildResetSensorFrame(Number(port)))
}

// --- Hub control (needs the device to reach the hub-control service) --------

async function readHubChar(device: BluetoothDevice, charUuid: string): Promise<DataView> {
  const services = await device.gatt!.getPrimaryServices()
  for (const svc of services) {
    try {
      const c = await svc.getCharacteristic(charUuid)
      return c.readValue()
    } catch { /* try next service */ }
  }
  throw new Error(`Characteristic ${charUuid} not found`)
}

async function writeHubChar(device: BluetoothDevice, charUuid: string, data: Uint8Array): Promise<void> {
  const services = await device.gatt!.getPrimaryServices()
  for (const svc of services) {
    try {
      const c = await svc.getCharacteristic(charUuid)
      await writeCharacteristic(c, data)
      return
    } catch { /* try next service */ }
  }
  throw new Error(`Characteristic ${charUuid} not found`)
}

/** Battery level as 0–100 %. */
export async function readBatteryLevel(device: BluetoothDevice): Promise<number> {
  const view = await readHubChar(device, CHAR_BATTERY_LEVEL)
  return view.getUint8(0)
}

export async function readDeviceName(device: BluetoothDevice): Promise<string> {
  const view = await readHubChar(device, CHAR_NAME)
  return new TextDecoder().decode(view).replace(/\0/g, '')
}

/** Rename the hub (persists across power cycles, max 14 bytes). */
export async function setDeviceName(device: BluetoothDevice, name: string): Promise<void> {
  const encoded = new TextEncoder().encode(name.slice(0, 14))
  await writeHubChar(device, CHAR_NAME, encoded)
}

export async function readFirmwareVersion(device: BluetoothDevice): Promise<string> {
  const view = await readHubChar(device, CHAR_FW_REVISION)
  return new TextDecoder().decode(view).replace(/\0/g, '')
}

export async function readManufacturer(device: BluetoothDevice): Promise<string> {
  const view = await readHubChar(device, CHAR_MANUFACTURER)
  return new TextDecoder().decode(view).replace(/\0/g, '')
}

/** Turn the hub off. The hub disconnects immediately after. */
export async function powerOff(device: BluetoothDevice): Promise<void> {
  try {
    await writeHubChar(device, CHAR_POWER_OFF, new Uint8Array([0x01]))
  } catch { /* disconnect race is expected */ }
}

/** Ask the hub to drop the BLE connection without powering off. */
export async function forceDisconnect(device: BluetoothDevice): Promise<void> {
  try {
    await writeHubChar(device, CHAR_DISCONNECT, new Uint8Array([0x01]))
  } catch { /* disconnect race is expected */ }
}

export interface BluetoothErrorResult {
  message: string | null
  silent: boolean
}

export function mapBluetoothError(err: unknown): BluetoothErrorResult {
  if (err == null) return { message: 'Algo salió mal.', silent: false }
  if (typeof err === 'string') return { message: err, silent: false }
  if (typeof err !== 'object') return { message: String(err), silent: false }

  const e = err as { name?: string; message?: string }
  const name = e.name
  const message = e.message || ''
  if (name === 'NotFoundError' || name === 'AbortError') return { message: null, silent: true }

  const MAP: Record<string, string> = {
    NetworkError:      'Bluetooth apagado o inalcanzable. Actívalo y vuelve a intentar.',
    SecurityError:     'Acceso Bluetooth bloqueado. Permite Bluetooth para este sitio.',
    InvalidStateError: 'Bluetooth ocupado o conexión inválida. Intenta reconectar.',
    NotSupportedError: 'Esta acción Bluetooth no está soportada en este dispositivo.',
    OperationError:    message || 'La operación Bluetooth falló. Intenta de nuevo.',
    TimeoutError:      'Bluetooth agotó el tiempo. Acércate al dispositivo y reintenta.',
  }

  if (name && MAP[name]) return { message: MAP[name], silent: false }
  if (typeof DOMException !== 'undefined' && err instanceof DOMException) {
    return { message: message || name || 'Error Bluetooth.', silent: false }
  }
  return { message: message || 'Algo salió mal.', silent: false }
}
