import { useState, useMemo, useCallback, useRef, useEffect, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'motion/react'
import { nanoid } from 'nanoid'
import { Play, Square, Trash2, X, Plus, Sparkles, Save, CheckSquare, CloudUpload, Wrench, ChevronLeft } from 'lucide-react'
import {
  BLOCK_DEFINITIONS,
  BlockDefinition,
  ProgramBlock,
  RepeatBlock,
  ForeverBlock,
  IfDistanceBlock,
  IfTiltBlock,
  IfElseDistanceBlock,
  IfElseTiltBlock,
  IfButtonBlock,
  isContainerBlock,
  isIfElseBlock,
} from '../../types/blocks'
import { useBlockProgram } from '../../hooks/useBlockProgram'
import { useWeDo2 } from '../../hooks/useWeDo2'
import { useLoadProgram } from '../../context/LoadProgramContext'
import { SaveDialog } from '../SaveDialog'
import { saveProgram } from '../../services/programsApi'

const CATEGORIES: Record<string, { label: string; fill: string; shadow: string; emoji: string }> = {
  motion:  { label: 'Movimiento', fill: '#4C97FF', shadow: '#3373CC', emoji: '🏃' },
  looks:   { label: 'Apariencia', fill: '#9966FF', shadow: '#774DCB', emoji: '✨' },
  control: { label: 'Control',    fill: '#FFAB19', shadow: '#CF8B17', emoji: '🔁' },
  sensing: { label: 'Sensores',   fill: '#5CB1D6', shadow: '#2E8EB8', emoji: '👁️' },
}

const STATEMENT_CLIP =
  'polygon(0 0, 12px 0, 12px 6px, 28px 6px, 28px 0, 100% 0, 100% calc(100% - 6px), 28px calc(100% - 6px), 28px 100%, 12px 100%, 12px calc(100% - 6px), 0 calc(100% - 6px))'
const HEADER_CLIP =
  'polygon(0 0, 12px 0, 12px 6px, 28px 6px, 28px 0, 100% 0, 100% 100%, 0 100%)'
const FOOTER_CLIP =
  'polygon(0 0, 100% 0, 100% calc(100% - 6px), 28px calc(100% - 6px), 28px 100%, 12px 100%, 12px calc(100% - 6px), 0 calc(100% - 6px))'

type ContainerLike = RepeatBlock | ForeverBlock | IfDistanceBlock | IfTiltBlock | IfElseDistanceBlock | IfElseTiltBlock | IfButtonBlock

// ─── BlockParams ──────────────────────────────────────────────────────────────

function BlockParams({ block, onUpdate }: { block: ProgramBlock; onUpdate: (u: Partial<ProgramBlock>) => void }) {
  const stop = (e: React.SyntheticEvent) => e.stopPropagation()
  const cls = 'rounded-full bg-white/95 text-slate-800 px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-white shadow-inner min-h-[30px]'

  switch (block.type) {
    case 'motor_forward':
    case 'motor_backward':
      return (
        <div className="flex items-center gap-1 flex-wrap" onClick={stop}>
          <select value={block.port} onChange={(e) => onUpdate({ port: Number(e.target.value) as 1 | 2 })} className={cls}>
            <option value={1}>A</option><option value={2}>B</option>
          </select>
          <input type="number" value={block.power} onChange={(e) => onUpdate({ power: Number(e.target.value) })} className={`${cls} w-12`} min={0} max={100} />
          <input type="number" value={block.duration} onChange={(e) => onUpdate({ duration: Number(e.target.value) })} className={`${cls} w-16`} min={0} />
          <span className="text-white/90 text-xs">ms</span>
        </div>
      )
    case 'motor_stop':
      return (
        <select value={block.port} onClick={stop} onChange={(e) => onUpdate({ port: Number(e.target.value) as 1 | 2 })} className={cls}>
          <option value={1}>A</option><option value={2}>B</option>
        </select>
      )
    case 'led_color':
      return (
        <select value={block.color} onClick={stop} onChange={(e) => onUpdate({ color: e.target.value as any })} className={cls}>
          {['off','pink','purple','blue','cyan','green','yellow','orange','red','white'].map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      )
    case 'wait':
      return (
        <div className="flex items-center gap-1" onClick={stop}>
          <input type="number" value={block.duration} onChange={(e) => onUpdate({ duration: Number(e.target.value) })} className={`${cls} w-16`} min={0} />
          <span className="text-white/90 text-xs">ms</span>
        </div>
      )
    case 'repeat':
      return (
        <div className="flex items-center gap-1" onClick={stop}>
          <input type="number" value={block.times} onChange={(e) => onUpdate({ times: Number(e.target.value) })} className={`${cls} w-12`} min={1} />
          <span className="text-white/90 text-xs">veces</span>
        </div>
      )
    case 'forever':
    case 'if_button':
      return null
    case 'if_distance':
    case 'if_else_distance':
      return (
        <div className="flex items-center gap-1" onClick={stop}>
          <select value={block.condition} onChange={(e) => onUpdate({ condition: e.target.value as any })} className={cls}>
            <option value="less_than">&lt;</option>
            <option value="greater_than">&gt;</option>
          </select>
          <input type="number" value={block.value} onChange={(e) => onUpdate({ value: Number(e.target.value) })} className={`${cls} w-12`} min={0} />
        </div>
      )
    case 'if_tilt':
    case 'if_else_tilt':
      return (
        <select value={block.direction} onClick={stop} onChange={(e) => onUpdate({ direction: e.target.value as any })} className={cls}>
          <option value="left">izquierda</option>
          <option value="right">derecha</option>
          <option value="up">arriba</option>
          <option value="down">abajo</option>
        </select>
      )
    default:
      return null
  }
}

// ─── BrickShell ───────────────────────────────────────────────────────────────

function BrickShell({
  fill, shadow, clip, height = 44, active, selected, onClick, children, marginTop = -6,
}: {
  fill: string; shadow: string; clip: string; height?: number
  active?: boolean; selected?: boolean; onClick?: (e: React.MouseEvent) => void
  children?: React.ReactNode; marginTop?: number
}) {
  return (
    <div
      onClick={onClick}
      className="relative"
      style={{
        marginTop,
        filter: active
          ? 'drop-shadow(0 0 0 #fde047) drop-shadow(0 0 6px rgba(253,224,71,0.9))'
          : selected
            ? 'drop-shadow(0 0 0 #38bdf8) drop-shadow(0 0 4px rgba(56,189,248,0.7))'
            : 'drop-shadow(0 1px 0 rgba(0,0,0,0.18))',
      }}
    >
      <div aria-hidden className="absolute inset-0" style={{ background: shadow, clipPath: clip, transform: 'translateY(2px)' }} />
      <div className="relative flex items-center px-3 text-white text-sm select-none gap-1" style={{ background: fill, clipPath: clip, height }}>
        {children}
      </div>
    </div>
  )
}

function ElseSeparator({ fill, shadow }: { fill: string; shadow: string }) {
  return (
    <div className="relative">
      <div aria-hidden className="absolute inset-0" style={{ background: shadow, transform: 'translateY(2px)' }} />
      <div className="relative flex items-center px-3 gap-2 text-white/90 text-xs italic select-none" style={{ background: fill, height: 28 }}>
        <span>sino</span><span className="opacity-60">→</span>
      </div>
    </div>
  )
}

// ─── Drag context ─────────────────────────────────────────────────────────────

interface FreeDragState {
  ids: string[]
  x: number
  y: number
  label: string
  fill: string
  icon: string
}

interface DragCtx {
  freeDrag: FreeDragState | null
  dragOverId: string | null
  setDragOverId: React.Dispatch<React.SetStateAction<string | null>>
  startFreeDrag: (
    ids: string[],
    label: string,
    fill: string,
    icon: string,
    e: React.PointerEvent,
  ) => void
  moveBlockTo: (ids: string[], parentId: string | null) => void
  insertBlockBefore: (ids: string[], beforeId: string) => void
  addBlock: (block: ProgramBlock, parentId: string | null) => void
}

// ─── Floating ghost ──────────────────────────────────────────────────────────

function DragGhost({ state }: { state: FreeDragState }) {
  return createPortal(
    <div
      style={{
        position: 'fixed',
        left: state.x,
        top: state.y,
        transform: 'translate(-20px, -20px) rotate(2deg) scale(1.05)',
        pointerEvents: 'none',
        zIndex: 9999,
        opacity: 0.88,
        minWidth: 120,
      }}
    >
      <div
        className="flex items-center gap-2 px-3 text-white text-sm rounded-lg shadow-xl"
        style={{ background: state.fill, height: 40 }}
      >
        <span>{state.icon}</span>
        <span className="whitespace-nowrap">{state.label}</span>
      </div>
    </div>,
    document.body,
  )
}

// ─── ScratchBlock (visual only) ───────────────────────────────────────────────

interface BrickProps {
  block: ProgramBlock
  active: boolean
  selected: boolean
  wrapSelected: boolean
  isDragging: boolean
  onSelect: () => void
  onRemove: () => void
  onUpdate: (u: Partial<ProgramBlock>) => void
  renderChildren?: () => React.ReactNode
  renderElseChildren?: () => React.ReactNode
  onBlockPointerDown: (e: React.PointerEvent) => void
}

function ScratchBlock({
  block, active, selected, wrapSelected, isDragging,
  onSelect, onRemove, onUpdate,
  renderChildren, renderElseChildren,
  onBlockPointerDown,
}: BrickProps) {
  const def = BLOCK_DEFINITIONS.find((d) => d.type === block.type)!
  const cat = CATEGORIES[def.category]
  const container = isContainerBlock(block)
  const ifElse = isIfElseBlock(block)

  const Inner = (
    <>
      <span className="text-xl leading-none shrink-0 select-none cursor-grab" title="Arrastra para mover">⠿</span>
      <span className="text-base leading-none">{def.icon}</span>
      <span className="whitespace-nowrap">{def.label}</span>
      <BlockParams block={block} onUpdate={onUpdate} />
      <button
        onClick={(e) => { e.stopPropagation(); onRemove() }}
        className="ml-auto rounded-full bg-black/20 hover:bg-black/35 w-7 h-7 flex items-center justify-center shrink-0 touch-manipulation"
        aria-label="Eliminar"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </>
  )

  const outerCls = `transition-opacity duration-150 ${isDragging ? 'opacity-30' : 'opacity-100'} ${wrapSelected ? 'ring-2 ring-offset-1 ring-sky-400 rounded-sm' : ''}`

  const headerProps = {
    fill: cat.fill, shadow: cat.shadow, active, selected,
    onClick: onSelect,
  }

  if (!container) {
    return (
      <div
        className={outerCls}
        onPointerDown={onBlockPointerDown}
        data-block-id={block.id}
        style={{ touchAction: 'none' }}
      >
        <BrickShell {...headerProps} clip={STATEMENT_CLIP}>{Inner}</BrickShell>
      </div>
    )
  }

  return (
    <div
      className={outerCls}
      onPointerDown={onBlockPointerDown}
      data-block-id={block.id}
      style={{ touchAction: 'none' }}
    >
      <BrickShell {...headerProps} clip={HEADER_CLIP}>{Inner}</BrickShell>

      <div className="relative pl-3 pr-1 py-1">
        <div aria-hidden className="absolute left-0 top-0 bottom-0 w-3" style={{ background: cat.fill, boxShadow: `inset -2px 0 0 ${cat.shadow}` }} />
        <div className="pl-3 py-1">{renderChildren?.()}</div>
      </div>

      {ifElse && (
        <>
          <ElseSeparator fill={cat.fill} shadow={cat.shadow} />
          <div className="relative pl-3 pr-1 py-1">
            <div aria-hidden className="absolute left-0 top-0 bottom-0 w-3" style={{ background: cat.fill, boxShadow: `inset -2px 0 0 ${cat.shadow}` }} />
            <div className="pl-3 py-1">{renderElseChildren?.()}</div>
          </div>
        </>
      )}

      <BrickShell fill={cat.fill} shadow={cat.shadow} clip={FOOTER_CLIP} height={14} marginTop={0}>
        <span />
      </BrickShell>
    </div>
  )
}

// ─── BlockList (renders a list of blocks with drop zones between them) ────────

interface BlockListProps {
  list: ProgramBlock[]
  parentKey: string | null   // null = top level
  depth: number
  activeIndex: number | null
  parentBlock?: ProgramBlock  // parent container (if nested)
  selectedContainerId: string | null
  setSelectedContainerId: React.Dispatch<React.SetStateAction<string | null>>
  removeBlock: (id: string) => void
  updateBlock: (id: string, u: Partial<ProgramBlock>) => void
  isRunning: boolean
  wrapSelectIds: Set<string>
  onToggleWrap: (id: string) => void
  selectMode: boolean
  dragCtx: DragCtx
  branchSuffix?: string
  onEnterSelectMode?: (blockId: string) => void
}

function BlockList({
  list, parentKey, depth, activeIndex, parentBlock,
  selectedContainerId, setSelectedContainerId,
  removeBlock, updateBlock, isRunning,
  wrapSelectIds, onToggleWrap, selectMode,
  dragCtx, branchSuffix = '', onEnterSelectMode,
}: BlockListProps) {
  const containerKey = parentKey != null ? parentKey + branchSuffix : null
  const isDragActive = dragCtx.freeDrag !== null
  const isDropTarget = (id: string) => dragCtx.dragOverId === id

  // Container drop zone (when list is empty or during drag)
  const containerDropZoneId = parentBlock ? parentBlock.id + branchSuffix : '__top__'

  const dzHandlers = (zoneId: string) => ({
    'data-drop-zone': zoneId,
    onDragOver: (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation() },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault(); e.stopPropagation()
      const paletteType = e.dataTransfer.getData('application/palette-block')
      if (paletteType) {
        const def = BLOCK_DEFINITIONS.find(d => d.type === paletteType)
        if (def) dragCtx.addBlock({ id: nanoid(), type: def.type, ...def.defaultValues } as ProgramBlock, zoneId === '__top__' ? null : zoneId)
        return
      }
      const ids = JSON.parse(e.dataTransfer.getData('application/json') || '[]') as string[]
      if (ids.length) dragCtx.moveBlockTo(ids, zoneId === '__top__' ? null : zoneId)
    },
  })

  if (list.length === 0) {
    return (
      <div
        {...dzHandlers(containerDropZoneId)}
        onClick={(e) => {
          e.stopPropagation()
          if (parentBlock) setSelectedContainerId(p => p === containerDropZoneId ? null : containerDropZoneId)
        }}
        className={`text-xs italic px-3 py-3 rounded-md border-2 border-dashed transition-all min-h-[44px] flex items-center justify-center ${
          isDropTarget(containerDropZoneId)
            ? 'border-sky-400 bg-sky-100 text-sky-700 scale-[1.02]'
            : selectedContainerId === containerDropZoneId
              ? 'border-sky-400 text-sky-700 bg-sky-50'
              : 'border-slate-200 text-slate-400 bg-white'
        }`}
      >
        {isDropTarget(containerDropZoneId) ? '⬇ Soltar aquí' :
         selectedContainerId === containerDropZoneId ? '✦ añade bloques aquí' :
         'toca o arrastra aquí'}
      </div>
    )
  }

  return (
    <div
      className={`relative transition-colors ${isDragActive && parentBlock && isDropTarget(containerDropZoneId) ? 'bg-sky-100/40 rounded' : ''}`}
      data-drop-zone={parentBlock ? containerDropZoneId : undefined}
      onDragOver={parentBlock ? (e: React.DragEvent) => { e.preventDefault() } : undefined}
      onDrop={parentBlock ? (e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation()
        const paletteType = e.dataTransfer.getData('application/palette-block')
        if (paletteType) {
          const def = BLOCK_DEFINITIONS.find(d => d.type === paletteType)
          if (def) dragCtx.addBlock({ id: nanoid(), type: def.type, ...def.defaultValues } as ProgramBlock, containerDropZoneId)
          return
        }
        const ids = JSON.parse(e.dataTransfer.getData('application/json') || '[]') as string[]
        if (ids.length) dragCtx.moveBlockTo(ids, containerDropZoneId)
      } : undefined}
    >
      {/* Insert-before zone at the top */}
      {isDragActive && (
        <div
          {...dzHandlers(`__before__${list[0].id}`)}
          className={`h-2 rounded transition-all mx-1 mb-0.5 ${
            isDropTarget(`__before__${list[0].id}`) ? 'h-8 border-2 border-sky-400 bg-sky-100' : ''
          }`}
        />
      )}

      <AnimatePresence>
        {list.map((block, i) => {
          const isDragging = dragCtx.freeDrag?.ids.includes(block.id) ?? false
          const isActive = depth === 0 && activeIndex === i

          const handleBlockPointerDown = (e: React.PointerEvent) => {
            if (isRunning) return
            if ((e.target as HTMLElement).closest('input, select, button')) return
            if ((e.shiftKey || selectMode) && depth === 0) {
              e.preventDefault(); e.stopPropagation()
              onToggleWrap(block.id)
              return
            }
            e.stopPropagation()

            // Long-press (600 ms, touch only, top-level only) → enter multi-select mode
            if (e.pointerType === 'touch' && depth === 0 && !selectMode && onEnterSelectMode) {
              const ox = e.clientX, oy = e.clientY
              let lpTimer: ReturnType<typeof setTimeout> | null = setTimeout(() => {
                lpTimer = null
                onEnterSelectMode(block.id)
              }, 600)
              const cancelLp = (ev: PointerEvent) => {
                if (lpTimer && Math.hypot(ev.clientX - ox, ev.clientY - oy) > 8) {
                  clearTimeout(lpTimer); lpTimer = null
                  document.removeEventListener('pointermove', cancelLp)
                }
              }
              document.addEventListener('pointermove', cancelLp)
              document.addEventListener('pointerup', () => {
                if (lpTimer) { clearTimeout(lpTimer); lpTimer = null }
                document.removeEventListener('pointermove', cancelLp)
              }, { once: true })
            }

            const def = BLOCK_DEFINITIONS.find(d => d.type === block.type)!
            const cat = CATEGORIES[def.category]
            const ids = wrapSelectIds.has(block.id) ? [...wrapSelectIds] : [block.id]
            dragCtx.startFreeDrag(ids, def.label, cat.fill, def.icon, e)
          }

          const childProps: Omit<BlockListProps, 'list' | 'parentKey' | 'parentBlock' | 'branchSuffix'> = {
            depth: depth + 1, activeIndex, selectedContainerId, setSelectedContainerId,
            removeBlock, updateBlock, isRunning, wrapSelectIds, onToggleWrap, selectMode, dragCtx,
            onEnterSelectMode,
          }

          const children = isContainerBlock(block) ? (block as ContainerLike).children : []
          const elseChildren = isIfElseBlock(block)
            ? (block as IfElseDistanceBlock | IfElseTiltBlock).elseChildren : []

          return (
            <motion.div
              key={block.id}
              layout="position"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, x: 20 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            >
              <ScratchBlock
                block={block}
                active={isActive}
                selected={selectedContainerId === block.id || selectedContainerId === block.id + ':else'}
                wrapSelected={wrapSelectIds.has(block.id)}
                isDragging={isDragging}
                onSelect={() => {
                  if (isContainerBlock(block)) setSelectedContainerId(p => p === block.id ? null : block.id)
                }}
                onRemove={() => {
                  removeBlock(block.id)
                  if (selectedContainerId?.startsWith(block.id)) setSelectedContainerId(null)
                }}
                onUpdate={(u) => updateBlock(block.id, u)}
                onBlockPointerDown={handleBlockPointerDown}
                renderChildren={isContainerBlock(block) ? () => (
                  <BlockList
                    list={children}
                    parentKey={block.id}
                    parentBlock={block}
                    {...childProps}
                  />
                ) : undefined}
                renderElseChildren={isIfElseBlock(block) ? () => (
                  <BlockList
                    list={elseChildren}
                    parentKey={block.id}
                    parentBlock={block}
                    branchSuffix=":else"
                    {...childProps}
                  />
                ) : undefined}
              />

              {/* Insert-before zone after each block */}
              {isDragActive && (
                <div
                  {...dzHandlers(
                    i < list.length - 1
                      ? `__before__${list[i + 1].id}`
                      : (parentBlock ? parentBlock.id + branchSuffix + '__end' : '__top__end')
                  )}
                  className={`h-2 rounded transition-all mx-1 mt-0.5 ${
                    isDropTarget(
                      i < list.length - 1
                        ? `__before__${list[i + 1].id}`
                        : (parentBlock ? parentBlock.id + branchSuffix + '__end' : '__top__end')
                    ) ? 'h-8 border-2 border-sky-400 bg-sky-100' : ''
                  }`}
                />
              )}
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

// ─── Palette block ────────────────────────────────────────────────────────────

function PaletteBlock({
  definition, onAdd, onDragOverId, onDropInZone,
}: {
  definition: BlockDefinition
  onAdd: (d: BlockDefinition) => void
  onDragOverId: (id: string | null) => void
  onDropInZone: (def: BlockDefinition, parentId: string | null) => void
}) {
  const cat = CATEGORIES[definition.category]

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/palette-block', definition.type)
    e.dataTransfer.effectAllowed = 'copy'
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    let moved = false

    const onMove = (ev: PointerEvent) => {
      if (!moved && Math.abs(ev.movementX) + Math.abs(ev.movementY) < 3) return
      moved = true
      const els = document.elementsFromPoint(ev.clientX, ev.clientY)
      const zone = els.find(el => (el as HTMLElement).dataset.dropZone) as HTMLElement | undefined
      onDragOverId(zone?.dataset.dropZone ?? null)
    }
    const onUp = (ev: PointerEvent) => {
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
      onDragOverId(null)
      if (!moved) return
      const els = document.elementsFromPoint(ev.clientX, ev.clientY)
      const zone = els.find(el => (el as HTMLElement).dataset.dropZone) as HTMLElement | undefined
      const targetId = zone?.dataset.dropZone
      if (targetId) onDropInZone(definition, targetId === '__top__' || targetId === '__top__end' ? null : targetId)
    }
    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
  }

  return (
    <motion.div
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.96 }}
      className="relative w-full"
    >
      <div
        draggable
        onDragStart={handleDragStart}
        onPointerDown={handlePointerDown}
        onClick={() => onAdd(definition)}
        className="w-full cursor-grab active:cursor-grabbing touch-none select-none"
      >
        <BrickShell fill={cat.fill} shadow={cat.shadow} clip={STATEMENT_CLIP} height={38} marginTop={0}>
          <span className="text-sm">{definition.icon}</span>
          <span className="text-xs flex-1 truncate">{definition.label}</span>
          <Plus className="w-3 h-3 opacity-80 shrink-0" />
        </BrickShell>
      </div>
    </motion.div>
  )
}

const newBlockFromDef = (def: BlockDefinition): ProgramBlock =>
  ({ id: nanoid(), type: def.type, ...def.defaultValues } as ProgramBlock)

function makeExamples() {
  const motorFwd = (port: 1 | 2, power: number, duration: number): ProgramBlock => ({
    id: nanoid(), type: 'motor_forward', port, power, duration,
  })
  const wait = (duration: number): ProgramBlock => ({ id: nanoid(), type: 'wait', duration })
  const led = (color: any): ProgramBlock => ({ id: nanoid(), type: 'led_color', color })
  const repeat = (times: number, children: ProgramBlock[]): ProgramBlock => ({
    id: nanoid(), type: 'repeat', times, children,
  })
  const forever = (children: ProgramBlock[]): ProgramBlock => ({
    id: nanoid(), type: 'forever', children,
  })
  return {
    'Hola LEGO': [motorFwd(1, 60, 3000)],
    'Triángulo': [repeat(3, [motorFwd(1, 70, 1000), wait(300), motorFwd(2, 70, 700), wait(300)])],
    'Disco': [forever([led('red'), wait(300), led('green'), wait(300), led('blue'), wait(300)])],
  } satisfies Record<string, ProgramBlock[]>
}

// ─── ScratchView ──────────────────────────────────────────────────────────────

export function ScratchView({ testingContent }: { testingContent?: ReactNode }) {
  const {
    blocks, addBlock, removeBlock, updateBlock,
    clearBlocks, loadBlocks, wrapBlocks, moveBlockTo, insertBlockBefore,
    runProgram, stopProgram,
    status, currentBlockIndex, executionLog,
  } = useBlockProgram()
  const { isConnected } = useWeDo2()
  const { pendingBlocks, clearPendingLoad } = useLoadProgram()

  // Load blocks scheduled from the Programs page
  useEffect(() => {
    if (pendingBlocks) {
      loadBlocks(pendingBlocks)
      clearPendingLoad()
    }
  }, [pendingBlocks, loadBlocks, clearPendingLoad])

  const [activeCategory, setActiveCategory] = useState<keyof typeof CATEGORIES>('motion')
  const [selectedContainerId, setSelectedContainerId] = useState<string | null>(null)
  const [showExamples, setShowExamples] = useState(false)
  const [wrapSelectIds, setWrapSelectIds] = useState<Set<string>>(new Set())
  const [selectMode, setSelectMode] = useState(false)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [freeDrag, setFreeDrag] = useState<FreeDragState | null>(null)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [workspaceTab, setWorkspaceTab] = useState<'program' | 'testing'>('program')
  const [showPalette, setShowPalette] = useState(false)
  const [paletteView, setPaletteView] = useState<'categories' | 'blocks'>('categories')
  const [zoom, setZoom] = useState(1.0)

  const zoomRef = useRef(1.0)
  const pinchRef = useRef<{ dist: number; startZoom: number } | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  const updateZoom = (next: number) => { zoomRef.current = next; setZoom(next) }

  const handleEnterSelectMode = useCallback((blockId: string) => {
    setSelectMode(true)
    setWrapSelectIds(new Set([blockId]))
  }, [])

  // Cleanup ref for pointermove/up listeners
  const cleanupRef = useRef<(() => void) | null>(null)

  const startFreeDrag = useCallback((
    ids: string[], label: string, fill: string, icon: string, e: React.PointerEvent,
  ) => {
    setFreeDrag({ ids, x: e.clientX, y: e.clientY, label, fill, icon })

    // Temporarily hide dragged blocks so elementsFromPoint sees what's underneath
    const getZoneAt = (x: number, y: number): string | null => {
      const dragged = ids
        .map(id => document.querySelector<HTMLElement>(`[data-block-id="${id}"]`))
        .filter((el): el is HTMLElement => el !== null)
      dragged.forEach(el => { el.style.visibility = 'hidden' })
      const els = document.elementsFromPoint(x, y)
      dragged.forEach(el => { el.style.visibility = '' })
      const zone = els.find(el => (el as HTMLElement).dataset.dropZone) as HTMLElement | undefined
      return zone?.dataset.dropZone ?? null
    }

    const onMove = (ev: PointerEvent) => {
      setFreeDrag(prev => prev ? { ...prev, x: ev.clientX, y: ev.clientY } : null)
      setDragOverId(getZoneAt(ev.clientX, ev.clientY))
    }

    const onUp = (ev: PointerEvent) => {
      cleanup()
      const zoneId = getZoneAt(ev.clientX, ev.clientY)
      if (zoneId) {
        if (zoneId.startsWith('__before__')) {
          const beforeId = zoneId.slice('__before__'.length)
          insertBlockBefore(ids, beforeId)
        } else if (zoneId === '__top__' || zoneId.endsWith('__end')) {
          moveBlockTo(ids, null)
        } else {
          moveBlockTo(ids, zoneId)
        }
      }
      setFreeDrag(null)
      setDragOverId(null)
    }

    const cleanup = () => {
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
      cleanupRef.current = null
    }
    cleanupRef.current = cleanup
    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
  }, [moveBlockTo, insertBlockBefore])

  const dragCtx: DragCtx = {
    freeDrag,
    dragOverId,
    setDragOverId,
    startFreeDrag,
    moveBlockTo,
    insertBlockBefore,
    addBlock,
  }

  const isWrapMode = wrapSelectIds.size > 0
  const filteredDefs = useMemo(
    () => BLOCK_DEFINITIONS.filter((d) => d.category === activeCategory),
    [activeCategory]
  )

  const handleToggleWrap = (id: string) => {
    setWrapSelectIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const handleAdd = (def: BlockDefinition) => {
    const containerTypes = ['repeat','forever','if_distance','if_tilt','if_else_distance','if_else_tilt','if_button']
    if (isWrapMode && containerTypes.includes(def.type)) {
      const ids = [...wrapSelectIds].filter(id => blocks.some(b => b.id === id))
      if (ids.length > 0) {
        wrapBlocks(ids, def.type, def.defaultValues as Partial<ProgramBlock>)
        setWrapSelectIds(new Set()); setSelectedContainerId(null); return
      }
    }
    addBlock(newBlockFromDef(def), selectedContainerId)
  }

  const exitSelectMode = () => { setSelectMode(false); setWrapSelectIds(new Set()) }
  const isRunning = status === 'running'

  const handleSave = () => {
    if (blocks.length === 0) return
    setShowSaveDialog(true)
  }

  const handleSaveSubmit = async (name: string, author: string) => {
    await saveProgram(name, author, blocks)
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 2500)
  }


  const examples = makeExamples()

  // Non-passive wheel (ctrl+scroll to zoom) and touchmove (pinch to zoom)
  useEffect(() => {
    if (workspaceTab !== 'program') return
    const el = canvasRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      setZoom(prev => {
        const next = Math.min(1.5, Math.max(0.4, prev + (e.deltaY > 0 ? -0.1 : 0.1)))
        zoomRef.current = next
        return next
      })
    }
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 2 || !pinchRef.current) return
      e.preventDefault()
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      )
      const next = Math.min(1.5, Math.max(0.4, pinchRef.current.startZoom * (dist / pinchRef.current.dist)))
      zoomRef.current = next
      setZoom(next)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    return () => {
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('touchmove', onTouchMove)
    }
  }, [workspaceTab])

  const sharedListProps = {
    depth: 0,
    activeIndex: currentBlockIndex,
    selectedContainerId,
    setSelectedContainerId,
    removeBlock,
    updateBlock,
    isRunning,
    wrapSelectIds,
    onToggleWrap: handleToggleWrap,
    selectMode,
    dragCtx,
    onEnterSelectMode: handleEnterSelectMode,
  }

  return (
    <>
    {showSaveDialog && (
      <SaveDialog
        onClose={() => setShowSaveDialog(false)}
        onSave={handleSaveSubmit}
      />
    )}
    <div className="relative h-full min-h-0">
      {/* Ghost */}
      {freeDrag && <DragGhost state={freeDrag} />}

      {/* ── Palette overlay panel ─────────────────────────────────── */}
      <aside
        className={`absolute right-0 top-0 bottom-0 z-40 w-[200px] bg-white border-l border-y border-slate-200 rounded-l-2xl shadow-2xl flex flex-col transition-transform duration-200 ease-out ${
          showPalette ? 'translate-x-0 pointer-events-auto' : 'translate-x-full pointer-events-none'
        }`}
      >
        {paletteView === 'categories' ? (
          /* ── Category list ── */
          <div className="flex-1 flex flex-col p-3 gap-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1 mb-1 shrink-0">Categorías</p>
            {(Object.keys(CATEGORIES) as (keyof typeof CATEGORIES)[]).map((key) => {
              const cat = CATEGORIES[key]
              return (
                <button
                  key={key}
                  onClick={() => { setActiveCategory(key); setPaletteView('blocks') }}
                  className="flex-1 w-full flex items-center gap-3 px-4 rounded-xl text-white touch-manipulation active:opacity-80 transition-opacity"
                  style={{ background: cat.fill, boxShadow: `0 2px 0 ${cat.shadow}` }}
                >
                  <span className="text-xl leading-none">{cat.emoji}</span>
                  <span className="text-sm font-semibold">{cat.label}</span>
                </button>
              )
            })}
          </div>
        ) : (
          /* ── Block list for selected category ── */
          <>
            {/* Header with back button */}
            <div className="flex items-center gap-2 px-2 py-2.5 border-b border-slate-100 shrink-0">
              <button
                onClick={() => setPaletteView('categories')}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-slate-500 hover:bg-slate-100 touch-manipulation transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="text-xs">Atrás</span>
              </button>
              <span className="text-xs font-semibold" style={{ color: CATEGORIES[activeCategory].fill }}>
                {CATEGORIES[activeCategory].emoji} {CATEGORIES[activeCategory].label}
              </span>
            </div>

            {/* Block list */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              <AnimatePresence mode="popLayout">
                {filteredDefs.map((def) => (
                  <motion.div key={def.type} layout initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} transition={{ duration: 0.12 }}>
                    <PaletteBlock
                      definition={def}
                      onAdd={(d) => { handleAdd(d); setShowPalette(false); setPaletteView('categories') }}
                      onDragOverId={setDragOverId}
                      onDropInZone={(d, parentId) => {
                        setShowPalette(false); setPaletteView('categories')
                        if (parentId && (parentId as string).startsWith('__before__')) {
                          const newBlock = newBlockFromDef(d)
                          addBlock(newBlock, null)
                          insertBlockBefore([newBlock.id], (parentId as string).slice('__before__'.length))
                        } else {
                          addBlock(newBlockFromDef(d), parentId)
                        }
                      }}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </>
        )}
      </aside>

      {/* Backdrop — closes palette on tap */}
      {showPalette && (
        <div
          className="absolute inset-0 z-30 bg-black/20 rounded-xl"
          onClick={() => { setShowPalette(false); setPaletteView('categories') }}
        />
      )}

      {/* ── Zoom controls (bottom-left) ───────────────────────────── */}
      {workspaceTab === 'program' && (
        <div className="absolute bottom-3 left-3 z-50 flex items-center gap-0.5 bg-white/90 backdrop-blur-sm rounded-full shadow-md border border-slate-200 px-1 py-1">
          <button
            onClick={() => updateZoom(Math.max(0.4, Math.round((zoom - 0.1) * 10) / 10))}
            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100 font-bold text-base leading-none touch-manipulation"
          >−</button>
          <button
            onClick={() => updateZoom(1.0)}
            className="text-[10px] text-slate-500 px-1 min-w-[2.5rem] text-center tabular-nums touch-manipulation"
          >{Math.round(zoom * 100)}%</button>
          <button
            onClick={() => updateZoom(Math.min(1.5, Math.round((zoom + 0.1) * 10) / 10))}
            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100 font-bold text-base leading-none touch-manipulation"
          >+</button>
        </div>
      )}

      {/* ── Floating palette toggle button (bottom-right) ─────────── */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          if (showPalette) { setShowPalette(false); setPaletteView('categories') }
          else setShowPalette(true)
        }}
        title="Bloques"
        className={`absolute bottom-3 right-3 z-50 w-12 h-12 rounded-full shadow-lg flex items-center justify-center touch-manipulation transition-colors ${
          showPalette ? 'bg-slate-700 text-white' : 'bg-amber-400 text-slate-900'
        }`}
      >
        {showPalette ? <X className="w-5 h-5" /> : <span className="text-xl leading-none">🧩</span>}
      </motion.button>

      {/* ── Workspace ─────────────────────────────────────────────── */}
      <section className="h-full w-full rounded-xl bg-white border border-slate-200 overflow-hidden flex flex-col min-h-0">
        {/* Toolbar */}
        <header className="flex items-center justify-between px-3 py-2 border-b border-slate-100 shrink-0 gap-2">
          {/* Tabs */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setWorkspaceTab('program')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                workspaceTab === 'program'
                  ? 'bg-slate-100 text-slate-800'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              <Play className="w-3 h-3" />
              Programa
              {blocks.length > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                  workspaceTab === 'program' ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {blocks.length}
                </span>
              )}
            </button>
            {testingContent && (
              <button
                onClick={() => setWorkspaceTab('testing')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  workspaceTab === 'testing'
                    ? 'bg-slate-100 text-slate-800'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                <Wrench className="w-3 h-3" />
                Testing
              </button>
            )}
            {workspaceTab === 'program' && status === 'running' && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium ml-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Ejecutando
              </span>
            )}
            {workspaceTab === 'program' && status === 'completed' && (
              <span className="text-xs text-emerald-600 font-medium ml-2">✓ Listo</span>
            )}
            {workspaceTab === 'program' && status === 'error' && (
              <span className="text-xs text-red-500 font-medium ml-2">✕ Error</span>
            )}
          </div>

          {/* Actions (program tab only) */}
          {workspaceTab === 'program' && (
            <div className="flex items-center gap-1 shrink-0">
              {/* Examples dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowExamples(v => !v)}
                  title="Ejemplos"
                  className={`rounded-lg p-1.5 flex items-center gap-1 transition touch-manipulation ${
                    showExamples ? 'bg-amber-100 text-amber-700' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span className="hidden sm:inline text-xs">Ejemplos</span>
                </button>
                {showExamples && (
                  <div className="absolute right-0 top-full mt-1 bg-white rounded-xl border border-slate-200 shadow-lg z-20 min-w-[130px] py-1">
                    {Object.keys(examples).map(name => (
                      <button
                        key={name}
                        onClick={() => { loadBlocks(examples[name as keyof typeof examples]); setShowExamples(false) }}
                        className="w-full text-left text-xs text-slate-600 hover:text-slate-900 px-3 py-2 hover:bg-slate-50 transition"
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Save */}
              <button
                onClick={handleSave}
                disabled={!blocks.length}
                title="Guardar en nube"
                className={`rounded-lg p-1.5 flex items-center gap-1 transition touch-manipulation disabled:opacity-30 ${
                  saveSuccess ? 'bg-emerald-100 text-emerald-700' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                }`}
              >
                {saveSuccess ? <CloudUpload className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              </button>

              {/* Select mode */}
              <button
                onClick={() => { setSelectMode(v => !v); if (selectMode) setWrapSelectIds(new Set()) }}
                title="Modo selección"
                className={`rounded-lg p-1.5 flex items-center gap-1 transition touch-manipulation ${
                  selectMode || isWrapMode ? 'bg-sky-100 text-sky-700' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                }`}
              >
                <CheckSquare className="w-4 h-4" />
                {(selectMode || isWrapMode) && wrapSelectIds.size > 0 && (
                  <span className="text-xs font-medium">{wrapSelectIds.size}</span>
                )}
              </button>

              {/* Clear */}
              <button
                onClick={clearBlocks}
                disabled={blocks.length === 0 || isRunning}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30 transition touch-manipulation"
                title="Limpiar programa"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              {/* Run / Stop */}
              <motion.button
                whileTap={{ scale: 0.93 }}
                onClick={isRunning ? stopProgram : runProgram}
                disabled={!isConnected || (blocks.length === 0 && !isRunning)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium text-white flex items-center gap-1.5 disabled:opacity-40 transition shadow-sm touch-manipulation ${
                  isRunning
                    ? 'bg-red-500 hover:bg-red-600 shadow-red-200'
                    : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200'
                }`}
              >
                {isRunning ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{isRunning ? 'Detener' : 'Ejecutar'}</span>
              </motion.button>
            </div>
          )}
        </header>

        {/* Testing tab content */}
        {workspaceTab === 'testing' && testingContent && (
          <div className="flex-1 overflow-y-auto p-2">
            {testingContent}
          </div>
        )}

        {/* Canvas (program tab) */}
        {workspaceTab === 'program' && (
          <div
            ref={canvasRef}
            className="flex-1 overflow-y-auto p-4"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(15,23,42,0.04) 1px, transparent 0)',
              backgroundSize: '20px 20px',
            }}
            onClick={() => { setSelectedContainerId(null); if (!selectMode) setWrapSelectIds(new Set()) }}
            onTouchStart={(e) => {
              if (e.touches.length === 2) {
                pinchRef.current = {
                  dist: Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY,
                  ),
                  startZoom: zoomRef.current,
                }
              } else {
                pinchRef.current = null
              }
            }}
          >
            {blocks.length === 0 ? (
              <div
                data-drop-zone="__top__"
                onDragOver={(e) => { e.preventDefault(); setDragOverId('__top__') }}
                onDragLeave={() => setDragOverId(null)}
                onDrop={(e) => {
                  e.preventDefault()
                  const pt = e.dataTransfer.getData('application/palette-block')
                  if (pt) { const d = BLOCK_DEFINITIONS.find(x => x.type === pt); if (d) addBlock(newBlockFromDef(d), null); setDragOverId(null); return }
                  const ids = JSON.parse(e.dataTransfer.getData('application/json') || '[]') as string[]
                  if (ids.length) moveBlockTo(ids, null)
                  setDragOverId(null)
                }}
                className={`flex flex-col items-center justify-center min-h-[280px] h-full rounded-2xl border-2 border-dashed transition-all ${
                  dragOverId === '__top__' ? 'border-sky-400 bg-sky-50/70 text-sky-600' : 'border-slate-200 text-slate-400'
                }`}
              >
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 text-3xl transition-all ${
                  dragOverId === '__top__' ? 'bg-sky-100' : 'bg-slate-100'
                }`}>
                  {dragOverId === '__top__' ? '⬇' : '🧩'}
                </div>
                <p className="text-sm font-medium text-center px-4">
                  {dragOverId === '__top__' ? 'Soltar aquí' : 'Pulsa 🧩 para añadir bloques'}
                </p>
              </div>
            ) : (
              <div style={{ zoom: zoom }}>
              <div className="max-w-md mx-auto pt-1" onClick={(e) => e.stopPropagation()}>
                <BlockList
                  list={blocks}
                  parentKey={null}
                  {...sharedListProps}
                />
                <AnimatePresence>
                  {freeDrag && (
                    <motion.div
                      initial={{ opacity: 0, scaleY: 0.5 }}
                      animate={{ opacity: 1, scaleY: 1 }}
                      exit={{ opacity: 0, scaleY: 0.5 }}
                      data-drop-zone="__top__end"
                      className={`mt-3 h-10 rounded-xl border-2 border-dashed flex items-center justify-center text-xs transition-all ${
                        dragOverId === '__top__end'
                          ? 'border-sky-400 bg-sky-100/80 text-sky-700'
                          : 'border-slate-300 text-slate-400'
                      }`}
                    >
                      {dragOverId === '__top__end' ? '⬇ Soltar aquí' : '+ Soltar al final'}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              </div>
            )}
          </div>
        )}

      </section>
    </div>
    </>
  )
}
