import { useState, useCallback, useRef } from 'react'
import {
  ProgramBlock, MotorForwardBlock, MotorBackwardBlock, MotorStopBlock,
  LedColorBlock, WaitBlock, RepeatBlock, ForeverBlock,
  IfDistanceBlock, IfTiltBlock, IfElseDistanceBlock, IfElseTiltBlock, IfButtonBlock,
  isContainerBlock, isIfElseBlock,
} from '../types/blocks'
import { nanoid } from 'nanoid'
import { useWeDo2 } from './useWeDo2'

export type ExecutionStatus = 'idle' | 'running' | 'paused' | 'completed' | 'error'

export function useBlockProgram() {
  const { sendPowerCommand, sendLedCommand, isConnected, proximity, buttonPressed } = useWeDo2()
  const [blocks, setBlocks] = useState<ProgramBlock[]>([])
  const [status, setStatus] = useState<ExecutionStatus>('idle')
  const [currentBlockIndex, setCurrentBlockIndex] = useState<number | null>(null)
  const [executionLog, setExecutionLog] = useState<string[]>([])
  const abortControllerRef = useRef<AbortController | null>(null)

  const mapTree = (
    list: ProgramBlock[],
    fn: (b: ProgramBlock) => ProgramBlock | null
  ): ProgramBlock[] => {
    const out: ProgramBlock[] = []
    for (const b of list) {
      const nb = fn(b)
      if (!nb) continue
      if (isContainerBlock(nb)) {
        let mapped: ProgramBlock = { ...nb, children: mapTree(nb.children, fn) } as ProgramBlock
        if (isIfElseBlock(nb)) {
          mapped = { ...mapped, elseChildren: mapTree(nb.elseChildren, fn) } as ProgramBlock
        }
        out.push(mapped)
      } else {
        out.push(nb)
      }
    }
    return out
  }

  // parentId may be 'id' (add to children) or 'id:else' (add to elseChildren)
  const addBlock = useCallback((block: ProgramBlock, parentId: string | null = null) => {
    setBlocks((prev) => {
      if (!parentId) return [...prev, block]
      const [containerId, branch] = parentId.split(':')
      const isElse = branch === 'else'
      return mapTree(prev, (b) => {
        if (b.id === containerId && isContainerBlock(b)) {
          if (isElse && isIfElseBlock(b)) {
            return { ...b, elseChildren: [...b.elseChildren, block] } as ProgramBlock
          }
          return { ...b, children: [...b.children, block] } as ProgramBlock
        }
        return b
      })
    })
  }, [])

  const removeBlock = useCallback((blockId: string) => {
    setBlocks((prev) => mapTree(prev, (b) => (b.id === blockId ? null : b)))
  }, [])

  const updateBlock = useCallback((blockId: string, updates: Partial<ProgramBlock>) => {
    setBlocks((prev) =>
      mapTree(prev, (b) => (b.id === blockId ? ({ ...b, ...updates } as ProgramBlock) : b))
    )
  }, [])

  const loadBlocks = useCallback((next: ProgramBlock[]) => {
    setBlocks(next)
    setExecutionLog([])
    setCurrentBlockIndex(null)
  }, [])

  const moveBlock = useCallback((fromIndex: number, toIndex: number) => {
    setBlocks((prev) => {
      const next = [...prev]
      const [removed] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, removed)
      return next
    })
  }, [])

  const clearBlocks = useCallback(() => {
    setBlocks([])
    setExecutionLog([])
    setCurrentBlockIndex(null)
  }, [])

  // Wrap selected top-level block IDs into a new container block
  const wrapBlocks = useCallback((blockIds: string[], containerType: string, containerDefaults: Partial<ProgramBlock>) => {
    setBlocks((prev) => {
      const idSet = new Set(blockIds)
      const ordered = prev.filter(b => idSet.has(b.id))
      if (ordered.length === 0) return prev

      const container = {
        id: nanoid(),
        type: containerType,
        ...(containerType === 'if_else_distance' || containerType === 'if_else_tilt' ? { elseChildren: [] } : {}),
        ...containerDefaults,
        children: ordered,
      } as unknown as ProgramBlock

      const result: ProgramBlock[] = []
      let inserted = false
      for (const b of prev) {
        if (idSet.has(b.id)) {
          if (!inserted) { result.push(container); inserted = true }
        } else {
          result.push(b)
        }
      }
      return result
    })
    setExecutionLog([])
    setCurrentBlockIndex(null)
  }, [])

  const moveBlockTo = useCallback((blockIds: string[], targetParentId: string | null) => {
    setBlocks((prev) => {
      const idSet = new Set(blockIds)
      const extracted: ProgramBlock[] = []

      const withoutBlocks = mapTree(prev, (b) => {
        if (idSet.has(b.id)) { extracted.push(b); return null }
        return b
      })
      if (extracted.length === 0) return prev

      if (!targetParentId) return [...withoutBlocks, ...extracted]

      const [containerId, branch] = targetParentId.split(':')
      const isElse = branch === 'else'

      // Guard: prevent dragging a block into a container that was extracted (circular ref)
      const findContainer = (list: ProgramBlock[]): boolean => {
        for (const b of list) {
          if (b.id === containerId) return true
          if (isContainerBlock(b)) {
            if (findContainer(b.children)) return true
            if (isIfElseBlock(b) && findContainer(b.elseChildren)) return true
          }
        }
        return false
      }
      if (!findContainer(withoutBlocks)) return prev

      return mapTree(withoutBlocks, (b) => {
        if (b.id === containerId && isContainerBlock(b)) {
          if (isElse && isIfElseBlock(b)) {
            return { ...b, elseChildren: [...b.elseChildren, ...extracted] } as ProgramBlock
          }
          return { ...b, children: [...b.children, ...extracted] } as ProgramBlock
        }
        return b
      })
    })
  }, [])

  const insertBlockBefore = useCallback((blockIds: string[], beforeId: string) => {
    setBlocks((prev) => {
      const idSet = new Set(blockIds)
      const extracted: ProgramBlock[] = []
      const without = mapTree(prev, (b) => {
        if (idSet.has(b.id)) { extracted.push(b); return null }
        return b
      })
      if (extracted.length === 0) return prev
      const result: ProgramBlock[] = []
      let inserted = false
      for (const b of without) {
        if (b.id === beforeId && !inserted) { result.push(...extracted); inserted = true }
        result.push(b)
      }
      if (!inserted) result.push(...extracted)
      return result
    })
  }, [])

  const log = useCallback((message: string) => {
    setExecutionLog((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }, [])

  const delay = (ms: number, signal?: AbortSignal) =>
    new Promise<void>((resolve, reject) => {
      const t = setTimeout(resolve, ms)
      signal?.addEventListener('abort', () => { clearTimeout(t); reject(new Error('Aborted')) })
    })

  const executeBlock = useCallback(
    async (block: ProgramBlock, signal: AbortSignal): Promise<void> => {
      if (signal.aborted) throw new Error('Aborted')

      switch (block.type) {
        case 'motor_forward': {
          const b = block as MotorForwardBlock
          log(`Motor ${b.port === 1 ? 'A' : 'B'} adelante a ${b.power}%`)
          await sendPowerCommand(b.power, 'forward', b.port)
          await delay(b.duration, signal)
          await sendPowerCommand(0, 'forward', b.port)
          break
        }
        case 'motor_backward': {
          const b = block as MotorBackwardBlock
          log(`Motor ${b.port === 1 ? 'A' : 'B'} atrás a ${b.power}%`)
          await sendPowerCommand(b.power, 'backward', b.port)
          await delay(b.duration, signal)
          await sendPowerCommand(0, 'forward', b.port)
          break
        }
        case 'motor_stop': {
          const b = block as MotorStopBlock
          log(`Motor ${b.port === 1 ? 'A' : 'B'} detenido`)
          await sendPowerCommand(0, 'forward', b.port)
          break
        }
        case 'led_color': {
          const b = block as LedColorBlock
          log(`LED → ${b.color}`)
          await sendLedCommand(b.color)
          break
        }
        case 'wait': {
          const b = block as WaitBlock
          log(`Esperando ${b.duration}ms`)
          await delay(b.duration, signal)
          break
        }
        case 'repeat': {
          const b = block as RepeatBlock
          log(`Repetir ${b.times} veces`)
          for (let i = 0; i < b.times; i++) {
            if (signal.aborted) throw new Error('Aborted')
            log(`  vuelta ${i + 1}/${b.times}`)
            for (const child of b.children) await executeBlock(child, signal)
          }
          break
        }
        case 'forever': {
          const b = block as ForeverBlock
          log('∞ Bucle infinito — usa Detener para parar')
          while (!signal.aborted) {
            for (const child of b.children) {
              if (signal.aborted) break
              await executeBlock(child, signal)
            }
          }
          throw new Error('Aborted')
        }
        case 'if_distance': {
          const b = block as IfDistanceBlock
          const dist = proximity?.value
          if (dist != null) {
            const ok = b.condition === 'less_than' ? dist < b.value : dist > b.value
            log(`Distancia ${dist.toFixed(1)}cm ${b.condition === 'less_than' ? '<' : '>'} ${b.value} → ${ok ? 'SÍ' : 'NO'}`)
            if (ok) for (const child of b.children) await executeBlock(child, signal)
          } else {
            log('Sin datos de distancia')
          }
          break
        }
        case 'if_tilt': {
          const b = block as IfTiltBlock
          const tilt = proximity?.tilt
          const ok = tilt === b.direction
          log(`Inclinación ${tilt || 'ninguna'} = ${b.direction} → ${ok ? 'SÍ' : 'NO'}`)
          if (ok) for (const child of b.children) await executeBlock(child, signal)
          break
        }
        case 'if_else_distance': {
          const b = block as IfElseDistanceBlock
          const dist = proximity?.value
          if (dist != null) {
            const ok = b.condition === 'less_than' ? dist < b.value : dist > b.value
            log(`Distancia ${dist.toFixed(1)}cm → ${ok ? 'SI (if)' : 'NO (sino)'}`)
            const branch = ok ? b.children : b.elseChildren
            for (const child of branch) await executeBlock(child, signal)
          }
          break
        }
        case 'if_else_tilt': {
          const b = block as IfElseTiltBlock
          const tilt = proximity?.tilt
          const ok = tilt === b.direction
          log(`Inclinación ${tilt || 'ninguna'} → ${ok ? 'SI (if)' : 'NO (sino)'}`)
          const branch = ok ? b.children : b.elseChildren
          for (const child of branch) await executeBlock(child, signal)
          break
        }
        case 'if_button': {
          const b = block as IfButtonBlock
          const ok = buttonPressed === true
          log(`Botón verde ${ok ? 'presionado → SÍ' : 'suelto → NO'}`)
          if (ok) for (const child of b.children) await executeBlock(child, signal)
          break
        }
      }
    },
    [sendPowerCommand, sendLedCommand, proximity, buttonPressed, log]
  )

  const runProgram = useCallback(async () => {
    if (!isConnected) { log('❌ Dispositivo no conectado'); return }
    if (blocks.length === 0) { log('❌ Sin bloques'); return }

    setStatus('running')
    setCurrentBlockIndex(0)
    setExecutionLog([])
    log('▶️ Iniciando...')

    abortControllerRef.current = new AbortController()
    const signal = abortControllerRef.current.signal

    try {
      for (let i = 0; i < blocks.length; i++) {
        if (signal.aborted) { log('⏸️ Detenido'); break }
        setCurrentBlockIndex(i)
        await executeBlock(blocks[i], signal)
      }
      if (!signal.aborted) { log('✅ Completado'); setStatus('completed') }
    } catch (error) {
      if ((error as Error).message !== 'Aborted') {
        log(`❌ Error: ${(error as Error).message}`)
        setStatus('error')
      } else {
        setStatus('idle')
      }
    } finally {
      setCurrentBlockIndex(null)
      if (status !== 'error') setTimeout(() => setStatus('idle'), 2000)
    }
  }, [blocks, isConnected, executeBlock, log, status])

  const stopProgram = useCallback(() => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    setStatus('idle')
    setCurrentBlockIndex(null)
  }, [])

  return {
    blocks,
    addBlock,
    removeBlock,
    updateBlock,
    moveBlock,
    moveBlockTo,
    insertBlockBefore,
    loadBlocks,
    clearBlocks,
    wrapBlocks,
    runProgram,
    stopProgram,
    status,
    currentBlockIndex,
    executionLog,
  }
}
