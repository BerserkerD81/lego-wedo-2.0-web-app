import type { ProgramBlock } from '../types/blocks'

export interface ProgramMeta {
  id: number
  name: string
  author: string
  created_at: string
  block_count: number
}

export interface Program extends ProgramMeta {
  blocks: ProgramBlock[]
}

export async function listPrograms(): Promise<ProgramMeta[]> {
  const res = await fetch('/api/programs')
  if (!res.ok) throw new Error('Error al cargar programas')
  return res.json()
}

export async function saveProgram(
  name: string,
  author: string,
  blocks: ProgramBlock[],
): Promise<{ id: number }> {
  const res = await fetch('/api/programs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, author, blocks }),
  })
  if (!res.ok) throw new Error('Error al guardar el programa')
  return res.json()
}

export async function getProgram(id: number): Promise<Program> {
  const res = await fetch(`/api/programs/${id}`)
  if (!res.ok) throw new Error('Programa no encontrado')
  return res.json()
}

export async function deleteProgram(id: number): Promise<void> {
  const res = await fetch(`/api/programs/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Error al eliminar')
}
