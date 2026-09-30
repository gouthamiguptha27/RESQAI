import React from 'react';
import { 
  AlertTriangle, 
  Truck, 
  HeartPulse, 
  Clock 
} from 'lucide-react';

export function MetricsHeader({ metrics }) {
  if (!metrics) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 my-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-ops-surface animate-pulse border border-ops-border"></div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: 'Active Emergencies',
      value: metrics.total_active_emergencies,
      subtext: `${metrics.critical_emergencies} Critical • ${metrics.high_emergencies} High`,
      icon: AlertTriangle,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30'
    },
    {
      label: 'Available Ambulances',
      value: `${metrics.available_ambulances} / ${metrics.total_ambulances}`,
      subtext: `${metrics.total_ambulances - metrics.available_ambulances} Dispatched Units`,
      icon: Truck,
      color: metrics.available_ambulances > 0 ? 'text-emerald-400' : 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/30'
    },
    {
      label: 'Available ICU Beds',
      value: `${metrics.available_icu_beds} / ${metrics.total_icu_beds}`,
      subtext: metrics.available_icu_beds <= 2 ? 'Critical Deficit' : 'Regional Medical Centers',
      icon: HeartPulse,
      color: metrics.available_icu_beds <= 2 ? 'text-red-400' : 'text-emerald-400',
      bgColor: metrics.available_icu_beds <= 2 ? 'bg-red-500/10' : 'bg-emerald-500/10',
      borderColor: metrics.available_icu_beds <= 2 ? 'border-red-500/40' : 'border-emerald-500/30'
    },
    {
      label: 'Average Response ETA',
      value: `${metrics.average_response_time_minutes} min`,
      subtext: `${metrics.active_assignments} Active Dispatches`,
      icon: Clock,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/30'
    }
  ];

  return (
    <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 my-1">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`p-3.5 rounded-xl bg-ops-surface border transition-all ${card.borderColor} flex items-center justify-between shadow-md`}
          >
            <div>
              <span className="text-xs font-semibold text-slate-400 block mb-1">
                {card.label}
              </span>
              <div className={`text-2xl font-bold font-mono tracking-tight ${card.color}`}>
                {card.value}
              </div>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                {card.subtext}
              </div>
            </div>

            <div className={`p-2.5 rounded-xl ${card.bgColor} ${card.color} shrink-0`}>
              <Icon className="w-5 h-5" />
            </div>
          </div>
        );
      })}
    </section>
  );
}
