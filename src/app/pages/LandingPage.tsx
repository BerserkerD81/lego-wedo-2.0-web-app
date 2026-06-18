import { Link } from 'react-router-dom'
import {
  Bluetooth, Cpu, Lightbulb, Radio, Cloud, ArrowRight,
  Plug, Layers, Play, ChevronRight,
} from 'lucide-react'

function LegoBrick({ className = '' }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute -top-2 left-2 right-6 flex gap-2">
        <div className="w-4 h-4 rounded-full bg-amber-300" style={{ boxShadow: 'inset 0 -1px 0 rgba(0,0,0,0.15)' }} />
        <div className="w-4 h-4 rounded-full bg-amber-300" style={{ boxShadow: 'inset 0 -1px 0 rgba(0,0,0,0.15)' }} />
      </div>
      <div
        className="h-8 rounded-sm bg-amber-400"
        style={{ boxShadow: 'inset 0 -3px 0 rgba(0,0,0,0.2)' }}
      />
    </div>
  )
}

const FEATURES = [
  {
    icon: Bluetooth,
    title: 'Bluetooth Web API',
    description: 'Conecta directamente desde el navegador sin instalar nada. Compatible con Chrome y Edge.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: Cpu,
    title: 'Programación visual',
    description: 'Arrastra y suelta bloques tipo Scratch para crear secuencias, bucles y condiciones.',
    color: 'bg-purple-50 text-purple-600',
  },
  {
    icon: Lightbulb,
    title: 'Control total del hub',
    description: 'Motores A y B, LED de 10 colores, sensor de distancia, sensor de inclinación y botón.',
    color: 'bg-amber-50 text-amber-600',
  },
  {
    icon: Radio,
    title: 'Sensores en tiempo real',
    description: 'Monitorea distancia e inclinación en vivo. Crea programas que reaccionen al entorno.',
    color: 'bg-cyan-50 text-cyan-600',
  },
  {
    icon: Cloud,
    title: 'Guarda en la nube',
    description: 'Todos los programas se guardan en la base de datos. Accede y carga el trabajo de cualquier usuario.',
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    icon: Layers,
    title: 'Control manual',
    description: 'Panel de testing para probar motores, LED y leer sensores sin escribir ningún bloque.',
    color: 'bg-orange-50 text-orange-600',
  },
]

const STEPS = [
  {
    n: '01',
    icon: Plug,
    title: 'Conecta el hub',
    body: 'Abre el editor, pulsa "Conectar" y selecciona tu WeDo 2.0 en el diálogo Bluetooth del navegador.',
  },
  {
    n: '02',
    icon: Layers,
    title: 'Arma tu programa',
    body: 'Arrastra bloques desde la paleta al área de trabajo. Combina movimiento, luz y lógica.',
  },
  {
    n: '03',
    icon: Play,
    title: 'Ejecuta y guarda',
    body: 'Pulsa Ejecutar para ver tu robot en acción. Guarda el programa con tu nombre para compartirlo.',
  },
]

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ── Top nav ── */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-md bg-amber-400"
              style={{ boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.2)' }}
            />
            <span className="text-sm font-bold text-slate-800">LEGO WeDo 2.0</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/programas"
              className="text-sm text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-md hover:bg-slate-100 transition"
            >
              Programas
            </Link>
            <Link
              to="/editor"
              className="text-sm font-medium bg-amber-400 hover:bg-amber-500 text-slate-900 px-4 py-1.5 rounded-lg transition flex items-center gap-1"
            >
              Abrir editor <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="bg-gradient-to-b from-amber-50 to-white border-b border-amber-100 overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24 flex flex-col sm:flex-row items-center gap-12">
          {/* Text */}
          <div className="flex-1 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full px-3 py-1 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Funciona en el navegador · Sin instalación
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-slate-900 leading-tight tracking-tight mb-4">
              Programa tu<br />
              <span className="text-amber-500">LEGO WeDo 2.0</span>
            </h1>
            <p className="text-slate-600 text-lg leading-relaxed max-w-lg mb-8">
              Controla motores, sensores y LED arrastrando bloques. Conecta por Bluetooth, guarda tus programas en la nube y compártelos con tu clase.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center sm:justify-start">
              <Link
                to="/editor"
                className="inline-flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-500 active:bg-amber-600 text-slate-900 font-bold rounded-xl px-6 py-3 text-base transition shadow-md shadow-amber-200"
              >
                <Play className="w-4 h-4" />
                Abrir editor
              </Link>
              <Link
                to="/programas"
                className="inline-flex items-center justify-center gap-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-medium rounded-xl px-6 py-3 text-base transition"
              >
                Ver programas
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* LEGO brick illustration */}
          <div className="shrink-0 flex flex-col gap-3 opacity-80">
            {[
              { cols: 4, colors: ['bg-amber-400', 'bg-blue-400', 'bg-red-400', 'bg-green-400'] },
              { cols: 3, colors: ['bg-blue-400', 'bg-amber-400', 'bg-purple-400'] },
              { cols: 4, colors: ['bg-red-400', 'bg-green-400', 'bg-amber-400', 'bg-blue-400'] },
              { cols: 2, colors: ['bg-purple-400', 'bg-cyan-400'] },
            ].map((row, ri) => (
              <div key={ri} className="flex gap-2">
                {row.colors.map((color, ci) => (
                  <div key={ci} className="relative w-14">
                    <div className="absolute -top-2 left-1.5 right-1.5 flex gap-1 justify-center">
                      <div className={`w-3.5 h-3.5 rounded-full ${color}`} style={{ filter: 'brightness(1.1)' }} />
                      <div className={`w-3.5 h-3.5 rounded-full ${color}`} style={{ filter: 'brightness(1.1)' }} />
                    </div>
                    <div
                      className={`h-7 rounded-sm ${color}`}
                      style={{ boxShadow: 'inset 0 -3px 0 rgba(0,0,0,0.18)' }}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">Todo lo que necesitas</h2>
          <p className="text-slate-500 max-w-lg mx-auto">
            Una plataforma completa para programar robots LEGO WeDo 2.0 desde cualquier dispositivo con Chrome.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description, color }) => (
            <div
              key={title}
              className="rounded-2xl border border-slate-100 bg-white p-5 hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-4`}>
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-800 mb-1.5">{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="bg-slate-50 border-y border-slate-100 py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">¿Cómo funciona?</h2>
            <p className="text-slate-500">Tres pasos para empezar a programar</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {STEPS.map(({ n, icon: Icon, title, body }) => (
              <div key={n} className="relative">
                {/* connector line */}
                <div className="hidden sm:block absolute top-8 left-1/2 w-full h-px bg-amber-200 -z-0" />
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-white border-2 border-amber-300 flex items-center justify-center mb-4 shadow-sm">
                    <Icon className="w-7 h-7 text-amber-500" />
                  </div>
                  <span className="text-xs font-bold text-amber-500 mb-1">{n}</span>
                  <h3 className="font-bold text-slate-800 mb-2">{title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="bg-gradient-to-br from-amber-400 to-amber-500 rounded-3xl p-10 shadow-xl shadow-amber-200">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-3">
            ¿Listo para programar?
          </h2>
          <p className="text-slate-800/80 mb-8 max-w-md mx-auto">
            Abre el editor, conecta tu hub LEGO WeDo 2.0 y empieza a crear.
          </p>
          <Link
            to="/editor"
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl px-8 py-4 text-base transition shadow-lg"
          >
            <Play className="w-5 h-5" />
            Abrir editor ahora
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-100 py-6 text-center text-xs text-slate-400">
        LEGO WeDo 2.0 Web Controller · Hecho con React + Web Bluetooth API
      </footer>
    </div>
  )
}
