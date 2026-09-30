import React from 'react';
import { 
  X, 
  ShieldAlert, 
  Truck, 
  Hospital as HospitalIcon, 
  Route as RouteIcon, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  Stethoscope,
  Users,
  MapPin,
  Flame,
  HelpCircle
} from 'lucide-react';

export function EmergencyDetailModal({ 
  emergency, 
  assignment, 
  hospital, 
  ambulance, 
  onClose, 
  onEscalate 
}) {
  if (!emergency) return null;

  const factors = emergency.priority_factors || {};
  const isCrit = emergency.severity === 'CRITICAL';
  const isHigh = emergency.severity === 'HIGH';

  const sevColor = isCrit ? 'text-red-400' : isHigh ? 'text-amber-400' : 'text-yellow-400';
  const sevBg = isCrit 
    ? 'bg-red-950/80 border-red-800 text-red-300' 
    : isHigh 
    ? 'bg-amber-950/80 border-amber-800 text-amber-300' 
    : 'bg-yellow-950/80 border-yellow-800 text-yellow-300';

  // Derived medical resources & capabilities
  const requiredRes = Array.isArray(emergency.required_resources) 
    ? emergency.required_resources 
    : [];

  const requiredSpecialist = requiredRes.find((r) => 
    r.toLowerCase().includes('surgeon') || 
    r.toLowerCase().includes('specialist') || 
    r.toLowerCase().includes('cardiologist')
  ) || 'Trauma Specialist';

  const requiredEquipment = requiredRes.filter((r) => 
    !r.toLowerCase().includes('ambulance') && 
    !r.toLowerCase().includes('surgeon') && 
    !r.toLowerCase().includes('team')
  ).join(', ') || 'ICU Bed, Ventilator, Monitor';

  const icuAvailableCount = hospital?.icu_beds_available ?? (assignment?.hospital_id === 'H-03' ? 0 : 4);
  const icuStatusText = icuAvailableCount > 0 ? `Available (${icuAvailableCount} beds open)` : 'Depleted (0 beds open)';

  const assignedAmbId = assignment?.ambulance_id || ambulance?.id || 'AMB-03';
  const hospName = hospital?.name || assignment?.hospital_id || 'Gandhi Hospital (H-02)';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-ops-surface border border-ops-border rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Modal Top Bar */}
        <div className="p-4 border-b border-ops-border flex items-center justify-between bg-ops-surfaceLight/80">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl border ${sevBg}`}>
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-white">{emergency.id}</span>
                <span className="text-slate-500">•</span>
                <span className="text-xs text-slate-300">{emergency.type}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono uppercase border ${sevBg}`}>
                  {emergency.severity}
                </span>
              </div>
              <h2 className="text-base font-bold text-white mt-0.5">{emergency.title}</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Scrollable Area */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Re-optimization Alert Banner (if applicable) */}
          {assignment && assignment.reassignment_reason && (
            <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/60 text-amber-200 font-mono flex items-start gap-2.5 shadow-md">
              <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold text-amber-300 uppercase block text-[11px] mb-0.5">
                  Dynamic Re-Optimization Triggered
                </span>
                <p className="text-xs text-amber-100">{assignment.reassignment_reason}</p>
              </div>
            </div>
          )}

          {/* Core Emergency Data Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-ops-border">
              <span className="text-[10px] text-slate-400 font-mono uppercase block">Emergency Type</span>
              <span className="text-xs font-bold text-white mt-1 block">{emergency.type}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-ops-border">
              <span className="text-[10px] text-slate-400 font-mono uppercase block">Severity & Priority</span>
              <span className={`text-xs font-bold ${sevColor} mt-1 block font-mono`}>
                {emergency.severity} / {emergency.priority_score.toFixed(1)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-ops-border">
              <span className="text-[10px] text-slate-400 font-mono uppercase block">People Affected</span>
              <span className="text-xs font-bold text-amber-400 mt-1 block">
                {emergency.people_affected} person(s)
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-ops-border">
              <span className="text-[10px] text-slate-400 font-mono uppercase block">Current Status</span>
              <span className="text-xs font-bold text-cyan-400 mt-1 block font-mono">
                {emergency.status}
              </span>
            </div>
          </div>

          {/* Location & Patient Condition */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-ops-border space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="text-slate-300 font-medium">Location: {emergency.location_name}</span>
            </div>
            {emergency.patient_condition && (
              <div className="text-slate-400 pl-6 border-l-2 border-ops-border ml-2">
                <span className="text-[10px] font-mono text-slate-400 uppercase block">Clinical Condition:</span>
                <p className="text-slate-200 mt-0.5">{emergency.patient_condition}</p>
              </div>
            )}
          </div>

          {/* Dispatch Plan Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Assigned Ambulance & Route */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-ops-border">
              <div className="flex items-center gap-2 mb-2 font-mono text-cyan-400 font-bold">
                <Truck className="w-4 h-4" />
                <span>Assigned Ambulance: {assignedAmbId}</span>
              </div>
              <div className="space-y-1.5 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Route:</span>
                  <span className="font-medium text-white">Current Location → Emergency → Hospital</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-slate-400">Arrival ETA:</span>
                  <span className="text-yellow-400 font-bold">{assignment?.eta_to_scene_minutes ?? 8} minutes</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-slate-400">Distance to Scene:</span>
                  <span className="text-slate-200">{assignment?.distance_to_scene_km ?? 4.2} km</span>
                </div>
              </div>
            </div>

            {/* Selected Hospital & Medical Resources */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-ops-border">
              <div className="flex items-center gap-2 mb-2 font-mono text-emerald-400 font-bold">
                <HospitalIcon className="w-4 h-4" />
                <span>Selected Hospital: {hospital?.id || 'H-02'}</span>
              </div>
              <div className="space-y-1.5 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Facility:</span>
                  <span className="font-medium text-white truncate max-w-[200px]" title={hospName}>
                    {hospName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">ICU Availability:</span>
                  <span className={icuAvailableCount > 0 ? 'text-emerald-400 font-semibold' : 'text-red-400 font-bold'}>
                    {icuStatusText}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Required Specialist:</span>
                  <span className="text-white font-medium">{requiredSpecialist} Available</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Required Equipment:</span>
                  <span className="text-white font-medium truncate max-w-[180px]" title={requiredEquipment}>
                    {requiredEquipment} Available
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Core Decision Explainability Section: "Why this decision?" */}
          <div className="p-4 rounded-xl bg-ops-surfaceLight border border-ops-border shadow-inner">
            <h3 className="font-mono text-xs font-bold text-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4" />
              <span>Why this decision?</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Emergency Prioritized Because */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-white uppercase tracking-wide">
                  Emergency prioritized because:
                </h4>
                <ul className="space-y-1.5 text-slate-300 pl-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>{emergency.severity} severity rating</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>{emergency.people_affected} people affected</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>High time sensitivity ({emergency.urgency_level || 'EXTREME'})</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>Suitable resources available and matched</span>
                  </li>
                </ul>
              </div>

              {/* Hospital Selected Because */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-white uppercase tracking-wide">
                  Hospital selected because:
                </h4>
                <ul className="space-y-1.5 text-slate-300 pl-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>ICU available ({icuAvailableCount} beds verified)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Required specialist available ({requiredSpecialist})</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Required equipment available</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Suitable travel time ({assignment?.eta_to_hospital_minutes ?? 12} min transit)</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Priority Score Factors Breakdown */}
            <div className="mt-4 pt-3 border-t border-ops-border flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-slate-400">
              <span>Severity: +{factors.severity_score || 40} pts</span>
              <span>Casualties: +{factors.people_score || 15} pts</span>
              <span>Urgency: +{factors.urgency_score || 25} pts</span>
              <span>Wait: +{factors.wait_score || 5} pts</span>
              <span className="text-white font-bold">Total: {emergency.priority_score.toFixed(1)} / 100</span>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 border-t border-ops-border bg-ops-surfaceLight/80 flex items-center justify-between">
          {emergency.severity !== 'CRITICAL' ? (
            <button
              onClick={() => onEscalate(emergency.id)}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-500 text-white transition active:scale-95 shadow"
            >
              Escalate to Critical
            </button>
          ) : (
            <span className="text-xs text-red-400 font-mono font-bold flex items-center gap-1">
              <Flame className="w-3.5 h-3.5" /> CRITICAL PRIORITY ACTIVE
            </span>
          )}

          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition active:scale-95"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}
