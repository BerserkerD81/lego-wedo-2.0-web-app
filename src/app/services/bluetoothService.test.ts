import { describe, it, expect } from 'vitest'
import {
  processButtonBytes,
  processLowVoltageBytes,
  decodePortTypePacket,
  decodeSensorPacket,
  noteToFrequency,
  Note,
  DeviceType,
  PIEZO_MIN_FREQUENCY,
  PIEZO_MAX_FREQUENCY,
} from './bluetoothService'

// ─── Button ──────────────────────────────────────────────────────────────────

describe('processButtonBytes', () => {
  it('devuelve pressed=true cuando el hub envía 0x01', () => {
    const result = processButtonBytes(new Uint8Array([0x01]), null)
    expect(result).toEqual({ pressed: true, changed: true })
  })

  it('devuelve pressed=false cuando el hub envía 0x00', () => {
    const result = processButtonBytes(new Uint8Array([0x00]), null)
    expect(result).toEqual({ pressed: false, changed: true })
  })

  it('devuelve null si el array está vacío (el hub a veces envía paquetes vacíos)', () => {
    expect(processButtonBytes(new Uint8Array([]), null)).toBeNull()
  })

  it('changed=false cuando el estado no cambió (debounce — el hub re-emite en cada ciclo)', () => {
    // Primer press
    const first = processButtonBytes(new Uint8Array([0x01]), null)
    expect(first?.changed).toBe(true)

    // El hub re-emite el mismo byte → no debe disparar callback
    const repeat = processButtonBytes(new Uint8Array([0x01]), true)
    expect(repeat?.changed).toBe(false)
  })

  it('changed=true al soltar después de presionar', () => {
    const release = processButtonBytes(new Uint8Array([0x00]), true)
    expect(release).toEqual({ pressed: false, changed: true })
  })

  it('secuencia completa: null → press → repeat → release → repeat', () => {
    let state: boolean | null = null

    const press = processButtonBytes(new Uint8Array([0x01]), state)
    expect(press).toEqual({ pressed: true, changed: true })
    state = press!.pressed

    const repeat1 = processButtonBytes(new Uint8Array([0x01]), state)
    expect(repeat1?.changed).toBe(false)

    const repeat2 = processButtonBytes(new Uint8Array([0x01]), state)
    expect(repeat2?.changed).toBe(false)

    const release = processButtonBytes(new Uint8Array([0x00]), state)
    expect(release).toEqual({ pressed: false, changed: true })
    state = release!.pressed

    const repeatRelease = processButtonBytes(new Uint8Array([0x00]), state)
    expect(repeatRelease?.changed).toBe(false)
  })

  it('cualquier byte distinto de cero es "presionado"', () => {
    expect(processButtonBytes(new Uint8Array([0x02]), null)?.pressed).toBe(true)
    expect(processButtonBytes(new Uint8Array([0xFF]), null)?.pressed).toBe(true)
  })
})

// ─── Low voltage ─────────────────────────────────────────────────────────────

describe('processLowVoltageBytes', () => {
  it('devuelve true con 0x01 (batería baja)', () => {
    expect(processLowVoltageBytes(new Uint8Array([0x01]))).toBe(true)
  })

  it('devuelve false con 0x00 (batería ok)', () => {
    expect(processLowVoltageBytes(new Uint8Array([0x00]))).toBe(false)
  })

  it('devuelve false con array vacío', () => {
    expect(processLowVoltageBytes(new Uint8Array([]))).toBe(false)
  })
})

// ─── Port type ───────────────────────────────────────────────────────────────

describe('decodePortTypePacket', () => {
  it('detecta sensor de distancia conectado en puerto A (0x01)', () => {
    // [portId=1, 0x01=attach, portIndex, deviceType=0x23=DISTANCE_SENSOR, hwRev×4, swRev×4]
    const bytes = new Uint8Array([0x01, 0x01, 0x00, 0x23, 0, 0, 0, 0, 0, 0, 0, 0])
    const result = decodePortTypePacket(bytes)
    expect(result).toEqual({ portId: 1, connected: true, deviceType: DeviceType.DISTANCE_SENSOR })
  })

  it('detecta sensor de inclinación conectado en puerto B (0x02)', () => {
    const bytes = new Uint8Array([0x02, 0x01, 0x00, 0x22, 0, 0, 0, 0, 0, 0, 0, 0])
    const result = decodePortTypePacket(bytes)
    expect(result).toEqual({ portId: 2, connected: true, deviceType: DeviceType.TILT_SENSOR })
  })

  it('detecta desconexión (0x00)', () => {
    const bytes = new Uint8Array([0x01, 0x00])
    const result = decodePortTypePacket(bytes)
    expect(result).toEqual({ portId: 1, connected: false, deviceType: DeviceType.NONE })
  })

  it('retorna null para puertos internos (piezo=5, LED=6)', () => {
    expect(decodePortTypePacket(new Uint8Array([5, 0x01, 0x00, 0x16]))).toBeNull()
    expect(decodePortTypePacket(new Uint8Array([6, 0x01, 0x00, 0x17]))).toBeNull()
  })

  it('retorna null si el paquete es demasiado corto', () => {
    expect(decodePortTypePacket(new Uint8Array([0x01]))).toBeNull()
    expect(decodePortTypePacket(new Uint8Array([]))).toBeNull()
  })

  it('retorna null para bytes de estado desconocido', () => {
    expect(decodePortTypePacket(new Uint8Array([0x01, 0xFF]))).toBeNull()
  })
})

// ─── Sensor data ─────────────────────────────────────────────────────────────

describe('decodeSensorPacket', () => {
  function makeFloat32LE(value: number): Uint8Array {
    const buf = new ArrayBuffer(4)
    new DataView(buf).setFloat32(0, value, true)
    return new Uint8Array(buf)
  }

  function makeSensorPacket(msgType: number, portId: number, floatValue: number): Uint8Array {
    const floatBytes = makeFloat32LE(floatValue)
    return new Uint8Array([msgType, portId, ...floatBytes])
  }

  it('decodifica distancia como float32 LE (paquete streaming 0x04)', () => {
    const bytes = makeSensorPacket(0x04, 0x01, 5.5)
    const result = decodeSensorPacket(bytes, DeviceType.DISTANCE_SENSOR)
    expect(result).toMatchObject({ portId: 1, distanceCm: expect.closeTo(5.5, 3) })
  })

  it('decodifica distancia con paquete snapshot (0x02)', () => {
    const bytes = makeSensorPacket(0x02, 0x01, 2.0)
    const result = decodeSensorPacket(bytes, DeviceType.DISTANCE_SENSOR)
    expect(result).toMatchObject({ portId: 1, distanceCm: expect.closeTo(2.0, 3) })
  })

  it('decodifica inclinación neutral (valor=0.0)', () => {
    const bytes = makeSensorPacket(0x04, 0x02, 0.0)
    const result = decodeSensorPacket(bytes, DeviceType.TILT_SENSOR)
    expect(result).toMatchObject({ portId: 2, direction: 'neutral' })
  })

  it('decodifica inclinación backward (valor=3.0)', () => {
    const bytes = makeSensorPacket(0x04, 0x01, 3.0)
    expect(decodeSensorPacket(bytes, DeviceType.TILT_SENSOR)).toMatchObject({ direction: 'backward' })
  })

  it('decodifica inclinación right (valor=5.0)', () => {
    const bytes = makeSensorPacket(0x04, 0x01, 5.0)
    expect(decodeSensorPacket(bytes, DeviceType.TILT_SENSOR)).toMatchObject({ direction: 'right' })
  })

  it('decodifica inclinación left (valor=7.0)', () => {
    const bytes = makeSensorPacket(0x04, 0x01, 7.0)
    expect(decodeSensorPacket(bytes, DeviceType.TILT_SENSOR)).toMatchObject({ direction: 'left' })
  })

  it('decodifica inclinación forward (valor=9.0)', () => {
    const bytes = makeSensorPacket(0x04, 0x01, 9.0)
    expect(decodeSensorPacket(bytes, DeviceType.TILT_SENSOR)).toMatchObject({ direction: 'forward' })
  })

  it('retorna null para dirección desconocida (valor=99.0)', () => {
    const bytes = makeSensorPacket(0x04, 0x01, 99.0)
    expect(decodeSensorPacket(bytes, DeviceType.TILT_SENSOR)).toBeNull()
  })

  it('retorna null si msgType no es 0x02 ni 0x04', () => {
    const bytes = makeSensorPacket(0x01, 0x01, 5.0)
    expect(decodeSensorPacket(bytes, DeviceType.DISTANCE_SENSOR)).toBeNull()
  })

  it('retorna null si el paquete es demasiado corto', () => {
    expect(decodeSensorPacket(new Uint8Array([0x04, 0x01]), DeviceType.DISTANCE_SENSOR)).toBeNull()
  })

  it('no confunde distancia con inclinación: mismo paquete, distinto deviceType', () => {
    const bytes = makeSensorPacket(0x04, 0x01, 5.0)
    const distResult = decodeSensorPacket(bytes, DeviceType.DISTANCE_SENSOR)
    const tiltResult = decodeSensorPacket(bytes, DeviceType.TILT_SENSOR)
    expect(distResult).toHaveProperty('distanceCm')
    expect(tiltResult).toHaveProperty('direction', 'right')
  })
})

// ─── Piezo / noteToFrequency ─────────────────────────────────────────────────

describe('noteToFrequency', () => {
  it('A4 = 440 Hz (referencia)', () => {
    expect(noteToFrequency(Note.A, 4)).toBe(440)
  })

  it('A5 = 880 Hz (una octava arriba)', () => {
    expect(noteToFrequency(Note.A, 5)).toBe(880)
  })

  it('A3 = 220 Hz (una octava abajo)', () => {
    expect(noteToFrequency(Note.A, 3)).toBe(220)
  })

  it('resultado nunca supera PIEZO_MAX_FREQUENCY (1500 Hz)', () => {
    expect(noteToFrequency(Note.B, 6)).toBeLessThanOrEqual(PIEZO_MAX_FREQUENCY)
  })

  it('resultado nunca es menor que PIEZO_MIN_FREQUENCY (1 Hz)', () => {
    expect(noteToFrequency(Note.C, 1)).toBeGreaterThanOrEqual(PIEZO_MIN_FREQUENCY)
  })
})
