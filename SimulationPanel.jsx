import React from 'react';
import { 
  X, 
  AlertTriangle, 
  PlusCircle, 
  Car, 
  Wrench, 
  BedDouble, 
  UserX, 
  TrendingUp, 
  AlertOctagon, 
  RotateCcw,
  Sparkles,
  Loader2
} from 'lucide-react';
import { api } from '../api/client';

export function SimulationPanel({
  isOpen,
  onClose,
  onOpenCreateEmergency,
  onRunSimulation,
  isReoptimizing
}) {
  if (!isOpen) return null;

  const actions = [
    {
      id: 'create-emergency',
      label: 'Create Emergency',
      desc: 'Manually register a new prioritized incident',
      icon: PlusCircle,
      color: 'text-cyan-400',
      border: 'hover:border-cyan-500/60',
      onClick: () => {
        onClose();
        onOpenCreateEmergency();
      }
    },
    {
      id: 'traffic-surge',
      label: 'Traffic Surge',
      desc: 'Simulate severe gridlock to trigger route recalculation',
      icon: Car,
      color: 'text-amber-400',
      border: 'hover:border-amber-500/60',
      onClick: () => {
        onRunSimulation(
          () => api.simulation.trafficSpike('SEVERE', 2.4),
          'Corridor Traffic Surge Triggered'
        );
      }
    },
    {
      id: 'disable-ambulance',
      label: 'Disable Ambulance',
      desc: 'Simulate breakdown of AMB-01 to force reassignment',
      icon: Wrench,
      color: 'text-red-400',
      border: 'hover:border-red-500/60',
      onClick: () => {
        onRunSimulation(
          () => api.simulation.disableResource('AMB-01', 'UNAVAILABLE'),
          'Assignment changed because AMB-01 became unavailable.'
        );
      }
    },
    {
      id: 'fill-icu',
      label: 'Fill ICU',
      desc: 'Saturate hospital ICU to 100% to evaluate diversion',
      icon: BedDouble,
      color: 'text-purple-400',
      border: 'hover:border-purple-500/60',
      onClick: () => {
        onRunSimulation(
          () => api.simulation.fillHospitalICU('H-02', false),
          'Hospital ICU Saturated'
        );
      }
    },
    {
      id: 'doctor-unavailable',
      label: 'Doctor Unavailable',
      desc: 'Specialist called into emergency surgery',
      icon: UserX,
      color: 'text-yellow-400',
      border: 'hover:border-yellow-500/60',
      onClick: () => {
        onRunSimulation(
          () => api.simulation.doctorUnavailable(),
          'Physician Unavailable / In Surgery'
        );
      }
    },
    {
      id: 'increase-severity',
      label: 'Increase Severity',
      desc: 'Patient condition escalates from High to Critical',
      icon: TrendingUp,
      color: 'text-orange-400',
      border: 'hover:border-orange-500/60',
      onClick: () => {
        onRunSimulation(
          () => api.simulation.escalateSeverity('E-105', 'CRITICAL'),
          'Incident Severity Escalated'
        );
      }
    },
    {
      id: 'mass-casualty',
      label: 'Mass Casualty',
      desc: 'Simulate high-impact incident with 12+ casualties',
      icon: AlertOctagon,
      color: 'text-rose-400',
      border: 'hover:border-rose-500/60',
      onClick: () => {
        onRunSimulation(
          () => api.simulation.massCasualty(),
          'Mass Casualty Incident Injected'
        );
      }
    },
    {
      id: 'reset-demo',
      label: 'Reset Demo Baseline',
      desc: 'Restore original 5-incident metropolitan state',
      icon: RotateCcw,
      color: 'text-slate-400',
      border: 'hover:border-slate-500/60',
      onClick: () => {
        onRunSimulation(
          () => api.simulation.reset(),
          'Scenario Reset to Baseline',
          { isReset: true }
        );
      }
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-ops-surface border border-ops-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-auto flex flex-col">
        {/* Top Header */}
        <div className="p-4 border-b border-ops-border flex items-center justify-between bg-ops-surfaceLight/80">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wide">
                Simulation Controls
              </h3>
              <p className="text-[11px] text-slate-400">Inject dynamic operational conditions for live demo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Demo Disclaimer Banner */}
        <div className="bg-amber-500/15 border-b border-amber-500/30 text-amber-300 px-4 py-2 text-center text-xs font-mono font-semibold flex items-center justify-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>SIMULATION MODE — DEMONSTRATION DATA</span>
        </div>

        {/* Action Grid */}
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[65vh] overflow-y-auto">
          {actions.map((act) => {
            const Icon = act.icon;
            return (
              <button
                key={act.id}
                disabled={isReoptimizing}
                onClick={act.onClick}
                className={`p-3 rounded-xl bg-slate-900/90 border border-ops-border text-left transition flex flex-col justify-between active:scale-[0.98] disabled:opacity-50 ${act.border} hover:bg-ops-surfaceLight group`}
              >
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className={`p-1.5 rounded-lg bg-black/40 ${act.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-200 group-hover:text-white transition">
                    {act.label}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  {act.desc}
                </p>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-ops-border bg-ops-surfaceLight/50 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>{isReoptimizing ? 'Executing Re-Optimization...' : 'Select an event to observe autonomous response'}</span>
          {isReoptimizing && <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />}
        </div>
      </div>
    </div>
  );
}
