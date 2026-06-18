import { createContext, useContext, useState, ReactNode } from 'react'
import type { ProgramBlock } from '../types/blocks'

interface LoadProgramContextValue {
  pendingBlocks: ProgramBlock[] | null
  schedulePendingLoad: (blocks: ProgramBlock[]) => void
  clearPendingLoad: () => void
}

const LoadProgramContext = createContext<LoadProgramContextValue>({
  pendingBlocks: null,
  schedulePendingLoad: () => {},
  clearPendingLoad: () => {},
})

export function LoadProgramProvider({ children }: { children: ReactNode }) {
  const [pendingBlocks, setPendingBlocks] = useState<ProgramBlock[] | null>(null)
  return (
    <LoadProgramContext.Provider
      value={{
        pendingBlocks,
        schedulePendingLoad: setPendingBlocks,
        clearPendingLoad: () => setPendingBlocks(null),
      }}
    >
      {children}
    </LoadProgramContext.Provider>
  )
}

export const useLoadProgram = () => useContext(LoadProgramContext)
