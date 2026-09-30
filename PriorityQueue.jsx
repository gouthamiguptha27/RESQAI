import React from 'react';
import { ArrowUpRight, Flame, AlertCircle } from 'lucide-react';

export function PriorityQueue({
  emergencies = [],
  selectedEmergencyId,
  onSelectEmergency,
  onOpenDetails
}) {
  return (
    <div className="bg-ops-surface border border-ops-border rounded-xl flex flex-col h-full overflow-hidden shadow-lg">
      {/* Header */}
      <div className="p-3.5 border-b border-ops-border flex items-center justify-between bg-ops-surfaceLight/60">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></div>
          <h2 className="font-mono text-sm font-bold tracking-wide text-white uppercase">
            Emergency Priority
          </h2>
        </div>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-ops-border text-slate-300">
          {emergencies.length} Ranked
        </span>
      </div>

      {/* Ranked Emergency List */}
      <div className="flex-1 overflow-y-auto divide-y divide-ops-border/70 p-1">
        {emergencies.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No active emergencies in queue. Sector clear.
          </div>
        ) : (
          emergencies.map((em, index) => {
            const isSelected = em.id === selectedEmergencyId;
            const isCrit = em.severity === 'CRITICAL';
            const isHigh = em.severity === 'HIGH';

            // Severity styling
            const sevBadgeClass = isCrit
              ? 'bg-red-950/80 text-red-300 border-red-800'
              : isHigh
              ? 'bg-amber-950/80 text-amber-300 border-amber-800'
              : 'bg-yellow-950/80 text-yellow-300 border-yellow-800';

            const scoreColor = isCrit
              ? 'text-red-400'
              : isHigh
              ? 'text-amber-400'
              : 'text-yellow-400';

            return (
              <div
                key={em.id}
                onClick={() => onSelectEmergency(em.id)}
                className={`p-3.5 m-1 rounded-xl transition cursor-pointer border ${
                  isSelected
                    ? 'bg-cyan-950/30 border-cyan-500/80 shadow-md'
                    : 'border-transparent hover:bg-ops-surfaceLight/60 hover:border-ops-border'
                }`}
              >
                {/* Top Row: Rank & ID + Severity Badge */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-400">
                      #{index + 1}
                    </span>
                    <span className="font-mono text-xs font-bold text-cyan-300">
                      {em.id}
                    </span>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono uppercase border ${sevBadgeClass}`}>
                    {em.severity}
                  </span>
                </div>

                {/* Emergency Title / Category */}
                <h3 className="text-xs font-bold text-white mb-2 leading-snug">
                  {em.title}
                </h3>

                {/* Priority Score & View Details Action */}
                <div className="flex items-center justify-between pt-1 border-t border-ops-border/40">
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="text-[11px] text-slate-400">Priority:</span>
                    <span className={`text-sm font-bold ${scoreColor}`}>
                      {em.priority_score.toFixed(1)}
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenDetails(em.id);
                    }}
                    className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold px-2 py-1 rounded hover:bg-cyan-950/50 transition group/btn"
                  >
                    <span>View Details</span>
                    <ArrowUpRight className="w-3.5 h-3.5 transition group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
