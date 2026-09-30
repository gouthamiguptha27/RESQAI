import React, { useState } from 'react';
import { useResqData } from './hooks/useResqData';
import { Navbar } from './components/Navbar';
import { MetricsHeader } from './components/MetricsHeader';
import { MapView } from './components/MapView';
import { PriorityQueue } from './components/PriorityQueue';
import { ResponsePlan } from './components/ResponsePlan';
import { SimulationPanel } from './components/SimulationPanel';
import { EmergencyDetailModal } from './components/EmergencyDetailModal';
import { CreateEmergencyModal } from './components/CreateEmergencyModal';
import { api } from './api/client';

export function App() {
  const {
    metrics,
    emergencies,
    ambulances,
    hospitals,
    assignments,
    selectedEmergency,
    selectedAssignment,
    selectedEmergencyId,
    setSelectedEmergencyId,
    isLoading,
    isReoptimizing,
    lastNotification,
    setLastNotification,
    reoptimizationEvent,
    dismissReoptimization,
    fetchAllData,
    runSimulationAction,
    notify
  } = useResqData(3500);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSimulationOpen, setIsSimulationOpen] = useState(false);

  const handleOpenDetails = (id) => {
    setSelectedEmergencyId(id);
    setIsDetailModalOpen(true);
  };

  const handleSelectEmergency = (id) => {
    setSelectedEmergencyId(id);
  };

  const handleEscalateSeverity = async (id) => {
    await runSimulationAction(
      () => api.simulation.escalateSeverity(id, 'CRITICAL'),
      `Incident ${id} Escalated to CRITICAL`
    );
  };

  const handleForceReoptimize = async () => {
    await runSimulationAction(
      () => api.simulation.triggerReoptimize(),
      'Dynamic Re-Evaluation Completed'
    );
  };

  // Find assigned ambulance and selected hospital for the active emergency
  const assignedAmbulance = ambulances.find(
    (a) => a.id === selectedAssignment?.ambulance_id
  ) || null;

  const selectedHospital = hospitals.find(
    (h) => h.id === selectedAssignment?.hospital_id
  ) || hospitals[0] || null;

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <Navbar
        onOpenCreate={() => setIsCreateModalOpen(true)}
        onOpenSimulation={() => setIsSimulationOpen(true)}
        onReoptimize={handleForceReoptimize}
        isReoptimizing={isReoptimizing}
      />

      {/* Real-time Notification Banner */}
      {lastNotification && (
        <div
          className={`px-4 py-2 text-xs font-mono flex items-center justify-between transition-all ${
            lastNotification.type === 'error'
              ? 'bg-red-950/80 border-b border-red-800 text-red-300'
              : 'bg-cyan-950/80 border-b border-cyan-800 text-cyan-300'
          }`}
        >
          <div className="flex items-center gap-2 max-w-[1920px] mx-auto w-full">
            <span className="font-bold uppercase tracking-wider">[{lastNotification.title}]:</span>
            <span className="text-slate-200">{lastNotification.message}</span>
          </div>
          <button
            onClick={() => setLastNotification(null)}
            className="text-slate-400 hover:text-white ml-2 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Command Center Container */}
      <main className="flex-1 max-w-[1920px] w-full mx-auto p-4 flex flex-col gap-4">
        {/* SUMMARY CARDS (4 cards) */}
        <MetricsHeader metrics={metrics} />

        {/* MAIN CONTENT: Left Interactive Map & Right Emergency Priority */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[500px]">
          {/* LEFT / LARGE SECTION: INTERACTIVE MAP (8 Columns) */}
          <div className="lg:col-span-8 h-full flex flex-col min-h-[480px]">
            <MapView
              emergencies={emergencies}
              ambulances={ambulances}
              hospitals={hospitals}
              assignments={assignments}
              selectedEmergencyId={selectedEmergencyId}
              onSelectEmergency={handleSelectEmergency}
              onOpenDetails={handleOpenDetails}
            />
          </div>

          {/* RIGHT SECTION: EMERGENCY PRIORITY (4 Columns) */}
          <div className="lg:col-span-4 h-full flex flex-col min-h-[480px]">
            <PriorityQueue
              emergencies={emergencies}
              selectedEmergencyId={selectedEmergencyId}
              onSelectEmergency={handleSelectEmergency}
              onOpenDetails={handleOpenDetails}
            />
          </div>
        </div>

        {/* BOTTOM SECTION: RESPONSE PLAN (with Dynamic Re-Optimization Panel) */}
        <ResponsePlan
          emergency={selectedEmergency}
          assignment={selectedAssignment}
          hospital={selectedHospital}
          ambulance={assignedAmbulance}
          reoptimizationEvent={reoptimizationEvent}
          onDismissReoptimization={dismissReoptimization}
          onOpenDetails={handleOpenDetails}
        />
      </main>

      {/* Emergency Detail Modal */}
      {isDetailModalOpen && selectedEmergency && (
        <EmergencyDetailModal
          emergency={selectedEmergency}
          assignment={selectedAssignment}
          hospital={selectedHospital}
          ambulance={assignedAmbulance}
          onClose={() => setIsDetailModalOpen(false)}
          onEscalate={handleEscalateSeverity}
        />
      )}

      {/* Simulation Controls Modal */}
      <SimulationPanel
        isOpen={isSimulationOpen}
        onClose={() => setIsSimulationOpen(false)}
        onOpenCreateEmergency={() => setIsCreateModalOpen(true)}
        onRunSimulation={runSimulationAction}
        isReoptimizing={isReoptimizing}
      />

      {/* Manual Emergency Intake Modal */}
      {isCreateModalOpen && (
        <CreateEmergencyModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreated={() => {
            notify('Incident Intake', 'New emergency registered and prioritized.', 'success');
            fetchAllData(true);
          }}
        />
      )}

      {/* Clean Operations Footer */}
      <footer className="border-t border-ops-border py-2 px-4 text-center text-xs text-slate-500 font-mono bg-ops-surface/60">
        <div className="max-w-[1920px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="text-slate-400 font-bold">RESQAI • Intelligent Emergency Response Command</span>
          <span className="text-amber-400 font-medium">SIMULATION MODE — DEMONSTRATION DATA</span>
          <span className="text-cyan-400">Hyderabad Emergency Network</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
