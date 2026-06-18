import { NavBar } from '../components/NavBar'
import { StatusBar } from '../components/StatusBar'
import { MotorControl } from '../components/MotorControl'
import { LedControl } from '../components/LedControl'
import { SensorMonitor } from '../components/SensorMonitor'
import { HubInfoPanel } from '../components/HubInfo'
import { ScratchView } from '../components/ScratchView/ScratchView'
import { ConnectionModal } from '../components/ConnectionModal'

function TestingContent() {
  return (
    <div className="space-y-2 max-w-5xl">
      {/* Motores */}
      <div className="grid grid-cols-2 gap-2">
        <MotorControl port={1} label="A" />
        <MotorControl port={2} label="B" />
      </div>

      {/* LED + Sensores */}
      <div className="grid grid-cols-2 gap-2">
        <LedControl />
        <div className="space-y-2">
          <SensorMonitor />
          <HubInfoPanel />
        </div>
      </div>
    </div>
  )
}

export function EditorPage() {
  return (
    <div className="h-screen flex flex-col bg-slate-100 overflow-hidden">
      <NavBar />
      <StatusBar />
      <main className="flex-1 min-h-0 px-2 sm:px-4 py-2">
        <ScratchView testingContent={<TestingContent />} />
      </main>
      <ConnectionModal />
    </div>
  )
}
