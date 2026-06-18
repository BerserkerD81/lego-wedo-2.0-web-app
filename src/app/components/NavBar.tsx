import { NavLink } from 'react-router-dom'
import { Code2, Database } from 'lucide-react'
import { ConnectedHubBadge } from './ConnectionModal'
import { LegoBrick } from './ui/LegoBrick'

export function NavBar() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
      isActive ? 'bg-amber-100 text-amber-800' : 'text-slate-600 hover:bg-slate-100'
    }`

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 flex items-center gap-3 h-11">
        <NavLink to="/" className="flex items-center gap-2 shrink-0">
          <LegoBrick color="yellow" className="w-9 h-7 drop-shadow-sm" />
          <span className="text-sm font-semibold text-slate-800 hidden sm:block">LEGO WeDo 2.0</span>
        </NavLink>

        <nav className="flex gap-0.5 ml-2">
          <NavLink to="/editor" className={linkClass}>
            <Code2 className="w-3.5 h-3.5" />
            Editor
          </NavLink>
          <NavLink to="/programas" className={linkClass}>
            <Database className="w-3.5 h-3.5" />
            Programas
          </NavLink>
        </nav>

        <div className="ml-auto">
          <ConnectedHubBadge />
        </div>
      </div>
    </header>
  )
}
