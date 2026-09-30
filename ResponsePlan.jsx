import React from 'react';
import { 
  ShieldAlert, 
  Truck, 
  MapPin, 
  Hospital as HospitalIcon, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  RotateCw, 
  X, 
  ArrowRight,
  Stethoscope,
  Bed,
  Sparkles,
  Info
} from 'lucide-react';

export function ResponsePlan({
  emergency,
  assignment,
  hospital,
  ambulance,
  reoptimizationEvent,
  onDismissReoptimization,
  onOpenDetails
}) {
  if (!emergency) {
    return (
      <div className="bg-ops-surface border border-ops-border rounded-xl p-5 text-center text-slate-400 text-xs">
        Select an emergency from the priority list to view its response plan.
      </div>
    );
  }

  const isCrit = emergency.severity === 'CRITICAL';
  const isHigh = emergency.severity === 'HIGH';

  // Severity color
  const sevColor = isCrit ? 'text-red-400' : isHigh ? 'text-amber-400' : 'text-yellow-400';
  const sevBg = isCrit 
    ? 'bg-red-950/60 border-red-800 text-red-300' 
    : isHigh 
    ? 'bg-amber-950/60 border-amber-800 text-amber-300' 
    : 'bg-yellow-950/60 border-yellow-800 text-yellow-300';

  // Extract equipment & specialty information
  const hospitalEquipment = hospital?.equipment || ['Ventilator', 'CT Scanner', 'Cath Lab'];
  const hasIcu = hospital ? hospital.icu_beds_available > 0 : true;
  const icuCount = hospital?.icu_beds_available ?? 4;
  
  // Format assigned ambulance
  const assignedAmbId = assignment?.ambulance_id || ambulance?.id || 'AMB-01';
  const assignedAmbName = ambulance?.call_sign ? `${assignedAmbId} (${ambulance.call_sign})` : assignedAmbId;

  // Format hospital name
  const hospName = hospital ? `${hospital.id}: ${hospital.name}` : (assignment?.hospital_id || 'Hospital H-02');

  // Format ETA
  const sceneEta = assignment?.eta_to_scene_minutes ?? 8;
  const hospEta = assignment?.eta_to_hospital_minutes ?? 12;

  // Format route
  const sceneLocation = emergency.location_name || 'Emergency Location';
  const hospShortName = hospital?.name ? hospital.name.split(' ')[0] : 'Hospital';

  return (
    <div className="flex flex-col gap-3">
      {/* Dynamic Re-Optimization Panel: Visible when condition changes */}
      {reoptimizationEvent && (
        <div className="rounded-xl border border-cyan-500/60 bg-gradient-to-r from-cyan-950/90 via-[#0d1c2d] to-slate-900/90 p-4 shadow-xl shadow-cyan-950/40 animate-in fade-in duration-200 relative">
          <button
            onClick={onDismissReoptimization}
            className="absolute top-3 right-3 text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition"
            title="Dismiss update"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-3">
            <RotateCw className="w-4 h-4 text-cyan-400 animate-spin" />
            <h3 className="font-mono text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2">
              <span>🔄 RESPONSE PLAN UPDATED</span>
              <span className="text-[10px] font-normal px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
                Autonomous Engine Action
              </span>
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs font-mono">
            {/* Reason */}
            <div className="p-2.5 rounded-lg bg-black/40 border border-ops-border/80">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Reason:</span>
              <span className="font-bold text-amber-300 leading-snug block">
                {reoptimizationEvent.reason}
              </span>
            </div>

            {/* Previous */}
            <div className="p-2.5 rounded-lg bg-black/40 border border-ops-border/80">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Previous:</span>
              <span className="font-semibold text-slate-300 block line-through opacity-80">
                {reoptimizationEvent.previous}
              </span>
            </div>

            {/* New */}
            <div className="p-2.5 rounded-lg bg-black/40 border border-cyan-800/80">
              <span className="text-[10px] text-cyan-400 uppercase tracking-wider block mb-1">New:</span>
              <span className="font-bold text-cyan-300 block">
                {reoptimizationEvent.newVal}
              </span>
            </div>

            {/* Route & ETA */}
            <div className="p-2.5 rounded-lg bg-black/40 border border-ops-border/80">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Route & ETA:</span>
              <span className="text-emerald-300 block">
                Route: <span className="font-bold">{reoptimizationEvent.routeStatus}</span>
              </span>
              <span className="text-slate-300 block text-[11px]">
                ETA: {reoptimizationEvent.previousEta} → <span className="text-cyan-400 font-bold">{reoptimizationEvent.newEta}</span>
              </span>
            </div>

            {/* Why */}
            <div className="p-2.5 rounded-lg bg-black/40 border border-ops-border/80">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Why:</span>
              <span className="text-slate-200 text-[11px] leading-snug block">
                {reoptimizationEvent.why}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Response Plan Card */}
      <div className="bg-ops-surface border border-ops-border rounded-xl p-4 shadow-lg">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-ops-border gap-2">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400"></div>
            <h2 className="font-mono text-sm font-bold text-white tracking-wider uppercase">
              Response Plan
            </h2>
            <span className="text-xs text-slate-400 font-mono">
              [Incident: {emergency.id}]
            </span>
          </div>

          <button
            onClick={() => onOpenDetails(emergency.id)}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition self-start sm:self-auto"
          >
            <span>View Full Decision Breakdown →</span>
          </button>
        </div>

        {/* 6 Key Response Plan Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* 1. Emergency */}
          <div className="p-3 rounded-lg bg-slate-900/80 border border-ops-border flex flex-col justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">
              Emergency
            </span>
            <div className="mt-1.5">
              <div className="font-mono text-base font-bold text-white flex items-center gap-1.5">
                <span>{emergency.id}</span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium truncate mt-0.5" title={emergency.title}>
                {emergency.title}
              </p>
            </div>
          </div>

          {/* 2. Priority */}
          <div className="p-3 rounded-lg bg-slate-900/80 border border-ops-border flex flex-col justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">
              Priority
            </span>
            <div className="mt-1.5">
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono uppercase border ${sevBg}`}>
                  {emergency.severity}
                </span>
                <span className={`font-mono text-base font-bold ${sevColor}`}>
                  {emergency.priority_score.toFixed(1)}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                {emergency.people_affected} affected
              </p>
            </div>
          </div>

          {/* 3. Assigned Ambulance */}
          <div className="p-3 rounded-lg bg-slate-900/80 border border-ops-border flex flex-col justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">
              Assigned Ambulance
            </span>
            <div className="mt-1.5">
              <div className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="font-mono text-sm font-bold text-cyan-300 truncate">
                  {assignedAmbId}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono truncate mt-0.5">
                {ambulance?.call_sign || 'Advanced Life Support'}
              </p>
            </div>
          </div>

          {/* 4. Route & ETA */}
          <div className="p-3 rounded-lg bg-slate-900/80 border border-ops-border flex flex-col justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">
              Route & ETA
            </span>
            <div className="mt-1.5">
              <div className="flex items-center gap-1 text-[11px] text-slate-300 font-medium truncate mb-1">
                <span>Base</span>
                <ArrowRight className="w-3 h-3 text-cyan-400 shrink-0" />
                <span className="truncate">{emergency.id}</span>
                <ArrowRight className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="truncate">{hospShortName}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-yellow-400" />
                <span className="font-mono text-xs font-bold text-yellow-400">
                  ETA: {sceneEta} minutes
                </span>
              </div>
            </div>
          </div>

          {/* 5. Selected Hospital */}
          <div className="p-3 rounded-lg bg-slate-900/80 border border-ops-border flex flex-col justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">
              Selected Hospital
            </span>
            <div className="mt-1.5">
              <div className="flex items-center gap-1.5">
                <HospitalIcon className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-mono text-xs font-bold text-emerald-300 truncate">
                  {hospital ? hospital.name.substring(0, 18) : (assignment?.hospital_id || 'Hospital H-02')}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono truncate mt-0.5">
                {hospital?.trauma_level?.split(' ')[0] || 'Level 1'} Center • {hospEta}m transit
              </p>
            </div>
          </div>

          {/* 6. Medical Resources */}
          <div className="p-3 rounded-lg bg-slate-900/80 border border-ops-border flex flex-col justify-between">
            <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">
              Medical Resources
            </span>
            <div className="mt-1 space-y-0.5 text-[11px]">
              <div className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3 h-3 shrink-0" />
                <span className="truncate">{hasIcu ? `ICU Available (${icuCount} open)` : 'ICU Saturated'}</span>
              </div>
              <div className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3 h-3 shrink-0" />
                <span className="truncate">Trauma Specialist Available</span>
              </div>
              <div className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3 h-3 shrink-0" />
                <span className="truncate" title={hospitalEquipment.join(', ')}>
                  Required Equipment Available
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
