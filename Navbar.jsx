import React from 'react';
import { 
  RefreshCw, 
  PlusCircle, 
  MapPin, 
  AlertTriangle, 
  FlaskConical, 
  Activity 
} from 'lucide-react';

export function Navbar({ 
  onOpenCreate, 
  onOpenSimulation, 
  onReoptimize, 
  isReoptimizing 
}) {
  return (
    <header className="bg-ops-surface border-b border-ops-border sticky top-0 z-40">
      <div className="max-w-[1920px] mx-auto px-4 py-2.5 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left Side: Logo & System Identity */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 shadow-lg shadow-red-950/40">
            <span className="text-xl">🚑</span>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></span>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-wider text-white font-mono flex items-center gap-1">
                RESQ<span className="text-cyan-400">AI</span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 font-medium">Intelligent Emergency Response</p>
          </div>
        </div>

        {/* Right Side Controls */}
        <div className="flex items-center gap-2.5 flex-wrap justify-end">
          {/* Location Badge: Hyderabad */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-ops-border text-xs font-mono text-slate-300">
            <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="font-semibold text-white">Hyderabad</span>
          </div>

          {/* Simulation Mode Indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950/60 border border-amber-600/40 text-[11px] font-mono text-amber-300 font-semibold tracking-wide">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>SIMULATION MODE — DEMONSTRATION DATA</span>
          </div>

          {/* Re-evaluate Button */}
          <button
            id="btn-re-evaluate"
            onClick={onReoptimize}
            disabled={isReoptimizing}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-ops-surfaceLight hover:bg-slate-700 border border-ops-border text-cyan-300 transition active:scale-95 disabled:opacity-50"
            title="Trigger dynamic re-evaluation"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isReoptimizing ? 'animate-spin text-cyan-400' : ''}`} />
            <span>{isReoptimizing ? 'Re-evaluating...' : 'Re-evaluate'}</span>
          </button>

          {/* Small Simulation Demo Controls Button */}
          <button
            id="btn-open-simulation"
            onClick={onOpenSimulation}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-cyan-950/80 hover:bg-cyan-900/80 border border-cyan-700/60 text-cyan-300 transition active:scale-95"
            title="Open Demo Simulation Scenarios"
          >
            <FlaskConical className="w-3.5 h-3.5 text-cyan-400" />
            <span>Simulation</span>
          </button>

          {/* Incident Intake Button */}
          <button
            id="btn-intake-incident"
            onClick={onOpenCreate}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-950/50 transition active:scale-95"
            title="Register Emergency Incident"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ Intake</span>
          </button>
        </div>
      </div>
    </header>
  );
}
