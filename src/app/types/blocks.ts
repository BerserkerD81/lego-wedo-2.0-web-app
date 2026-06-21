import { LedColor } from '../services/bluetoothService'

export type BlockType =
  | 'motor_forward'
  | 'motor_backward'
  | 'motor_on'
  | 'motor_stop'
  | 'led_color'
  | 'wait'
  | 'repeat'
  | 'forever'
  | 'if_distance'
  | 'if_tilt'
  | 'if_else_distance'
  | 'if_else_tilt'
  | 'if_button'

export interface BaseBlock {
  id: string
  type: BlockType
}

export interface MotorForwardBlock extends BaseBlock {
  type: 'motor_forward'
  port: 1 | 2
  power: number
  duration: number
}

export interface MotorBackwardBlock extends BaseBlock {
  type: 'motor_backward'
  port: 1 | 2
  power: number
  duration: number
}

export interface MotorOnBlock extends BaseBlock {
  type: 'motor_on'
  port: 1 | 2
  power: number
  direction: 'forward' | 'backward'
}

export interface MotorStopBlock extends BaseBlock {
  type: 'motor_stop'
  port: 1 | 2
}

export interface LedColorBlock extends BaseBlock {
  type: 'led_color'
  color: LedColor
}

export interface WaitBlock extends BaseBlock {
  type: 'wait'
  duration: number
}

export interface RepeatBlock extends BaseBlock {
  type: 'repeat'
  times: number
  children: ProgramBlock[]
}

export interface ForeverBlock extends BaseBlock {
  type: 'forever'
  children: ProgramBlock[]
}

export interface IfDistanceBlock extends BaseBlock {
  type: 'if_distance'
  condition: 'less_than' | 'greater_than'
  value: number
  children: ProgramBlock[]
}

export interface IfTiltBlock extends BaseBlock {
  type: 'if_tilt'
  direction: 'left' | 'right' | 'up' | 'down'
  children: ProgramBlock[]
}

export interface IfElseDistanceBlock extends BaseBlock {
  type: 'if_else_distance'
  condition: 'less_than' | 'greater_than'
  value: number
  children: ProgramBlock[]
  elseChildren: ProgramBlock[]
}

export interface IfElseTiltBlock extends BaseBlock {
  type: 'if_else_tilt'
  direction: 'left' | 'right' | 'up' | 'down'
  children: ProgramBlock[]
  elseChildren: ProgramBlock[]
}

export interface IfButtonBlock extends BaseBlock {
  type: 'if_button'
  children: ProgramBlock[]
}

export type ProgramBlock =
  | MotorForwardBlock
  | MotorBackwardBlock
  | MotorOnBlock
  | MotorStopBlock
  | LedColorBlock
  | WaitBlock
  | RepeatBlock
  | ForeverBlock
  | IfDistanceBlock
  | IfTiltBlock
  | IfElseDistanceBlock
  | IfElseTiltBlock
  | IfButtonBlock

export type ContainerBlock = RepeatBlock | ForeverBlock | IfDistanceBlock | IfTiltBlock | IfElseDistanceBlock | IfElseTiltBlock | IfButtonBlock
export type IfElseBlock = IfElseDistanceBlock | IfElseTiltBlock

export function isContainerBlock(b: ProgramBlock): b is ContainerBlock {
  return b.type === 'repeat' || b.type === 'forever' || b.type === 'if_distance' || b.type === 'if_tilt' || b.type === 'if_else_distance' || b.type === 'if_else_tilt' || b.type === 'if_button'
}

export function isIfElseBlock(b: ProgramBlock): b is IfElseBlock {
  return b.type === 'if_else_distance' || b.type === 'if_else_tilt'
}

export interface BlockDefinition {
  type: BlockType
  label: string
  color: string
  icon: string
  category: 'motion' | 'looks' | 'control' | 'sensing'
  defaultValues: Partial<ProgramBlock>
}

export const BLOCK_DEFINITIONS: BlockDefinition[] = [
  {
    type: 'motor_forward',
    label: 'Motor adelante',
    color: 'bg-blue-500',
    icon: '→',
    category: 'motion',
    defaultValues: { port: 1, power: 50, duration: 1000 },
  },
  {
    type: 'motor_backward',
    label: 'Motor atrás',
    color: 'bg-blue-600',
    icon: '←',
    category: 'motion',
    defaultValues: { port: 1, power: 50, duration: 1000 },
  },
  {
    type: 'motor_on',
    label: 'Motor encender',
    color: 'bg-blue-400',
    icon: '▶',
    category: 'motion',
    defaultValues: { port: 1, power: 50, direction: 'forward' },
  },
  {
    type: 'motor_stop',
    label: 'Detener motor',
    color: 'bg-red-500',
    icon: '⬛',
    category: 'motion',
    defaultValues: { port: 1 },
  },
  {
    type: 'led_color',
    label: 'Cambiar LED',
    color: 'bg-yellow-500',
    icon: '💡',
    category: 'looks',
    defaultValues: { color: 'blue' },
  },
  {
    type: 'wait',
    label: 'Esperar',
    color: 'bg-orange-500',
    icon: '⏱️',
    category: 'control',
    defaultValues: { duration: 1000 },
  },
  {
    type: 'repeat',
    label: 'Repetir',
    color: 'bg-purple-500',
    icon: '🔁',
    category: 'control',
    defaultValues: { times: 3, children: [] },
  },
  {
    type: 'forever',
    label: 'Para siempre',
    color: 'bg-yellow-600',
    icon: '∞',
    category: 'control',
    defaultValues: { children: [] },
  },
  {
    type: 'if_distance',
    label: 'Si distancia',
    color: 'bg-cyan-500',
    icon: '📏',
    category: 'sensing',
    defaultValues: { condition: 'less_than', value: 5, children: [] },
  },
  {
    type: 'if_tilt',
    label: 'Si inclina',
    color: 'bg-teal-500',
    icon: '🔄',
    category: 'sensing',
    defaultValues: { direction: 'left', children: [] },
  },
  {
    type: 'if_else_distance',
    label: 'Si/sino distancia',
    color: 'bg-cyan-600',
    icon: '📏',
    category: 'sensing',
    defaultValues: { condition: 'less_than', value: 5, children: [], elseChildren: [] },
  },
  {
    type: 'if_else_tilt',
    label: 'Si/sino inclina',
    color: 'bg-teal-600',
    icon: '🔄',
    category: 'sensing',
    defaultValues: { direction: 'left', children: [], elseChildren: [] },
  },
  {
    type: 'if_button',
    label: 'Si botón presionado',
    color: 'bg-green-500',
    icon: '🟢',
    category: 'sensing',
    defaultValues: { children: [] },
  },
]
