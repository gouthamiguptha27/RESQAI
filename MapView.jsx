import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';

// Crisp, uncluttered custom map icons
const createEmergencyIcon = (severity, id, isSelected) => {
  const isCrit = severity === 'CRITICAL';
  const isHigh = severity === 'HIGH';
  const color = isCrit ? '#ef4444' : isHigh ? '#f97316' : '#eab308';
  const glow = isSelected ? `box-shadow: 0 0 16px ${color}; transform: scale(1.15);` : '';

  return L.divIcon({
    className: 'custom-emergency-icon',
    html: `
      <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; ${glow} transition: transform 0.2s;">
        <div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background: ${color}; opacity: 0.25; animation: beacon 2s infinite;"></div>
        <div style="position: relative; width: 26px; height: 26px; border-radius: 50%; background: #0a0d14; border: 2px solid ${color}; display: flex; align-items: center; justify-content: center; font-size: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.6);">
          <span>🚨</span>
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
};

const createAmbulanceIcon = (status) => {
  const isDispatched = status === 'DISPATCHED';
  const isOffline = status === 'UNAVAILABLE' || status === 'MAINTENANCE';
  const color = isOffline ? '#64748b' : isDispatched ? '#06b6d4' : '#10b981';

  return L.divIcon({
    className: 'custom-ambulance-icon',
    html: `
      <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
        <div style="width: 26px; height: 26px; border-radius: 6px; background: #0e1726; border: 2px solid ${color}; display: flex; align-items: center; justify-content: center; font-size: 13px; box-shadow: 0 2px 8px rgba(0,0,0,0.6);">
          <span>🚑</span>
        </div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14]
  });
};

const createHospitalIcon = (icuAvail) => {
  const isFull = icuAvail <= 0;
  const color = isFull ? '#ef4444' : '#10b981';

  return L.divIcon({
    className: 'custom-hospital-icon',
    html: `
      <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
        <div style="width: 28px; height: 28px; border-radius: 8px; background: #0f1c18; border: 2px solid ${color}; display: flex; align-items: center; justify-content: center; font-size: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.6);">
          <span>🏥</span>
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
};

export function MapView({
  emergencies = [],
  ambulances = [],
  hospitals = [],
  assignments = [],
  selectedEmergencyId,
  onSelectEmergency,
  onOpenDetails
}) {
  // Center of Hyderabad metropolitan demo theater
  const center = [17.4180, 78.4480];

  // Active emergency routes and hospital routes
  const activeRoutes = useMemo(() => {
    const list = [];
    assignments.forEach((asg) => {
      const isSelected = asg.emergency_id === selectedEmergencyId;
      (asg.routes || []).forEach((r) => {
        if (r.waypoints && r.waypoints.length > 1) {
          list.push({
            ...r,
            emergency_id: asg.emergency_id,
            isSelected,
            color: r.route_type === 'RESOURCE_TO_SCENE' 
              ? (r.is_rerouted ? '#f59e0b' : '#06b6d4') 
              : (r.is_rerouted ? '#eab308' : '#10b981')
          });
        }
      });
    });
    return list;
  }, [assignments, selectedEmergencyId]);

  return (
    <div className="relative w-full h-full min-h-[460px] rounded-xl overflow-hidden border border-ops-border bg-[#0a0d14] shadow-lg">
      {/* Clean Legend Overlay */}
      <div className="absolute top-3 left-3 z-[1000] bg-ops-surface/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-ops-border text-xs flex items-center gap-3">
        <span className="font-mono text-white font-bold tracking-wide">HYDERABAD THEATER</span>
        <span className="text-slate-500">|</span>
        <div className="flex items-center gap-3 text-[11px] text-slate-300">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500"></span> Incidents
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span> Ambulances
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Hospitals
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-1 bg-cyan-400 inline-block rounded"></span> Scene Route
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-1 bg-emerald-400 inline-block rounded"></span> Hospital Route
          </span>
        </div>
      </div>

      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Polylines for Active Routes */}
        {activeRoutes.map((route, idx) => (
          <Polyline
            key={`route-${idx}-${route.id}`}
            positions={route.waypoints}
            pathOptions={{
              color: route.color,
              weight: route.isSelected ? 5 : 2.5,
              opacity: route.isSelected ? 0.95 : 0.5,
              dashArray: route.is_rerouted ? '6, 6' : undefined
            }}
          />
        ))}

        {/* Hospital Markers */}
        {hospitals.map((hosp) => (
          <Marker
            key={`hosp-${hosp.id}`}
            position={[hosp.latitude, hosp.longitude]}
            icon={createHospitalIcon(hosp.icu_beds_available)}
          >
            <Popup>
              <div className="p-1 min-w-[190px]">
                <h4 className="font-bold text-sm text-emerald-400 mb-0.5">{hosp.name}</h4>
                <p className="text-[11px] text-slate-400 mb-2">{hosp.trauma_level}</p>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono mb-2">
                  <div className="bg-slate-900 p-1.5 rounded border border-ops-border">
                    <span className="text-slate-400 block text-[10px]">ICU Beds:</span>
                    <span className={hosp.icu_beds_available <= 0 ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                      {hosp.icu_beds_available} / {hosp.icu_beds_total}
                    </span>
                  </div>
                  <div className="bg-slate-900 p-1.5 rounded border border-ops-border">
                    <span className="text-slate-400 block text-[10px]">Status:</span>
                    <span className="text-white font-bold">
                      {hosp.status}
                    </span>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Ambulance Markers */}
        {ambulances.map((amb) => (
          <Marker
            key={`amb-${amb.id}`}
            position={[amb.latitude, amb.longitude]}
            icon={createAmbulanceIcon(amb.status)}
          >
            <Popup>
              <div className="p-1 min-w-[180px]">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-sm text-cyan-400">{amb.id}</h4>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                    amb.status === 'AVAILABLE' ? 'bg-emerald-950 text-emerald-400' :
                    amb.status === 'DISPATCHED' ? 'bg-cyan-950 text-cyan-400' : 'bg-red-950 text-red-400'
                  }`}>
                    {amb.status}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mb-1">{amb.call_sign}</p>
                <p className="text-[11px] text-slate-400 font-mono">Crew: {amb.crew_info}</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Emergency Markers */}
        {emergencies.map((em) => {
          const isSelected = em.id === selectedEmergencyId;
          return (
            <Marker
              key={`em-${em.id}`}
              position={[em.latitude, em.longitude]}
              icon={createEmergencyIcon(em.severity, em.id, isSelected)}
              eventHandlers={{
                click: () => {
                  onSelectEmergency(em.id);
                }
              }}
            >
              <Popup>
                <div className="p-1 min-w-[210px]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-xs text-white">{em.id}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      em.severity === 'CRITICAL' ? 'bg-red-950 text-red-400 border border-red-800' :
                      em.severity === 'HIGH' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                      'bg-yellow-950 text-yellow-400'
                    }`}>
                      {em.severity} ({em.priority_score.toFixed(1)})
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-slate-100 mb-1 leading-snug">{em.title}</h4>
                  <p className="text-[11px] text-slate-400 mb-2">{em.location_name}</p>
                  <button
                    onClick={() => onOpenDetails(em.id)}
                    className="w-full py-1 text-xs font-semibold rounded bg-cyan-600 hover:bg-cyan-500 text-black transition active:scale-95 text-center block"
                  >
                    View Details →
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
