import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { WeDo2Provider } from './hooks/useWeDo2'
import { LoadProgramProvider } from './context/LoadProgramContext'
import { LandingPage } from './pages/LandingPage'
import { EditorPage } from './pages/EditorPage'
import { ProgramsPage } from './pages/ProgramsPage'

function useIsPortraitMobile() {
  const [portrait, setPortrait] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(orientation: portrait) and (max-width: 1024px)')
    setPortrait(mq.matches)
    const handler = (e: MediaQueryListEvent) => setPortrait(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return portrait
}

function LandscapeGuard() {
  const isPortrait = useIsPortraitMobile()
  if (!isPortrait) return null
  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900 flex flex-col items-center justify-center gap-5 text-white">
      <div className="w-14 h-14 text-amber-400 text-5xl text-center">↻</div>
      <p className="text-xl font-semibold">Rota tu dispositivo</p>
      <p className="text-sm text-slate-400 text-center px-10">
        Esta app funciona en orientación horizontal
      </p>
    </div>
  )
}

export default function App() {
  return (
    <WeDo2Provider>
      <LoadProgramProvider>
        <BrowserRouter>
          <LandscapeGuard />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/editor" element={<EditorPage />} />
            <Route path="/programas" element={<ProgramsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </LoadProgramProvider>
    </WeDo2Provider>
  )
}
