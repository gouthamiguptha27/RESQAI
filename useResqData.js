import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api/client';

export function useResqData(pollIntervalMs = 3500) {
  const [metrics, setMetrics] = useState(null);
  const [emergencies, setEmergencies] = useState([]);
  const [ambulances, setAmbulances] = useState([]);
  const [responseTeams, setResponseTeams] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [systemEvents, setSystemEvents] = useState([]);
  
  const [selectedEmergencyId, setSelectedEmergencyId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReoptimizing, setIsReoptimizing] = useState(false);
  const [lastNotification, setLastNotification] = useState(null);
  const [reoptimizationEvent, setReoptimizationEvent] = useState(null);

  const prevAssignmentsRef = useRef({});
  const isFirstLoadRef = useRef(true);

  const fetchAllData = useCallback(async (quiet = false) => {
    if (!quiet) setIsLoading(true);
    try {
      const [
        metricsData,
        emergenciesData,
        ambulancesData,
        teamsData,
        hospitalsData,
        assignmentsData,
        eventsData,
        doctorsData
      ] = await Promise.all([
        api.getDashboardMetrics().catch(() => null),
        api.getEmergencies().catch(() => []),
        api.getAmbulances().catch(() => []),
        api.getResponseTeams().catch(() => []),
        api.getHospitals().catch(() => []),
        api.getAssignments().catch(() => []),
        api.getSystemEvents(35).catch(() => []),
        api.getDoctors().catch(() => [])
      ]);

      if (metricsData) setMetrics(metricsData);
      setEmergencies(emergenciesData);
      setAmbulances(ambulancesData);
      setResponseTeams(teamsData);
      setHospitals(hospitalsData);
      setAssignments(assignmentsData);
      setSystemEvents(eventsData);
      setDoctors(doctorsData);

      // Check for state transitions/re-optimization updates
      if (assignmentsData && assignmentsData.length > 0) {
        const prevMap = prevAssignmentsRef.current;

        // Find if any assignment changed or has reassignment reason
        for (const asg of assignmentsData) {
          const prev = prevMap[asg.emergency_id];
          
          if (prev && !isFirstLoadRef.current) {
            const ambChanged = prev.ambulance_id && asg.ambulance_id && prev.ambulance_id !== asg.ambulance_id;
            const hospChanged = prev.hospital_id && asg.hospital_id && prev.hospital_id !== asg.hospital_id;
            const routeRerouted = asg.routes?.some((r) => r.is_rerouted && !prev.routesRerouted);

            if (ambChanged || asg.reassignment_reason) {
              setReoptimizationEvent({
                emergencyId: asg.emergency_id,
                reason: asg.reassignment_reason || `Lead ambulance ${prev.ambulance_id || 'AMB-01'} became unavailable.`,
                previous: `${asg.emergency_id} → ${prev.ambulance_id || 'AMB-01'}`,
                newVal: `${asg.emergency_id} → ${asg.ambulance_id}`,
                routeStatus: 'Updated',
                previousEta: `${prev.eta_to_scene_minutes || 10} min`,
                newEta: `${asg.eta_to_scene_minutes} min`,
                why: asg.resource_explanation || `${asg.ambulance_id} was the best available suitable resource.`,
                timestamp: Date.now()
              });
              break;
            } else if (hospChanged) {
              setReoptimizationEvent({
                emergencyId: asg.emergency_id,
                reason: `Receiving hospital capacity saturated.`,
                previous: `${asg.emergency_id} → ${prev.hospital_id}`,
                newVal: `${asg.emergency_id} → ${asg.hospital_id}`,
                routeStatus: 'Updated',
                previousEta: `${prev.eta_to_hospital_minutes || 12} min`,
                newEta: `${asg.eta_to_hospital_minutes} min`,
                why: asg.hospital_explanation || 'Diverted to optimal facility with open ICU and specialist on-site.',
                timestamp: Date.now()
              });
              break;
            } else if (routeRerouted) {
              const reroutedRoute = asg.routes?.find((r) => r.is_rerouted);
              setReoptimizationEvent({
                emergencyId: asg.emergency_id,
                reason: reroutedRoute?.reroute_reason || 'Severe traffic congestion detected on primary corridor.',
                previous: `${asg.emergency_id} (Standard Corridor)`,
                newVal: `${asg.emergency_id} (Dynamic Bypass)`,
                routeStatus: 'Updated',
                previousEta: `${prev.eta_to_scene_minutes || 14} min`,
                newEta: `${asg.eta_to_scene_minutes} min`,
                why: 'Real-time routing calculated dynamic arterial bypass to avoid critical delays.',
                timestamp: Date.now()
              });
              break;
            }
          } else if (asg.reassignment_reason && !isFirstLoadRef.current) {
            setReoptimizationEvent({
              emergencyId: asg.emergency_id,
              reason: asg.reassignment_reason,
              previous: `${asg.emergency_id} → AMB-01`,
              newVal: `${asg.emergency_id} → ${asg.ambulance_id}`,
              routeStatus: 'Updated',
              previousEta: '10 min',
              newEta: `${asg.eta_to_scene_minutes} min`,
              why: asg.resource_explanation || `${asg.ambulance_id} was the best available suitable resource.`,
              timestamp: Date.now()
            });
            break;
          }
        }

        // Update reference map
        const newMap = {};
        for (const a of assignmentsData) {
          newMap[a.emergency_id] = {
            ambulance_id: a.ambulance_id,
            hospital_id: a.hospital_id,
            eta_to_scene_minutes: a.eta_to_scene_minutes,
            eta_to_hospital_minutes: a.eta_to_hospital_minutes,
            reassignment_reason: a.reassignment_reason,
            routesRerouted: a.routes?.some((r) => r.is_rerouted)
          };
        }
        prevAssignmentsRef.current = newMap;
        isFirstLoadRef.current = false;
      }

      // Default select first critical emergency if none selected
      if (!selectedEmergencyId && emergenciesData.length > 0) {
        setSelectedEmergencyId(emergenciesData[0].id);
      }
    } catch (err) {
      console.error('Error fetching RESQAI data:', err);
    } finally {
      if (!quiet) setIsLoading(false);
    }
  }, [selectedEmergencyId]);

  useEffect(() => {
    fetchAllData(false);
    const interval = setInterval(() => {
      fetchAllData(true);
    }, pollIntervalMs);
    return () => clearInterval(interval);
  }, [fetchAllData, pollIntervalMs]);

  const notify = (title, message, type = 'info') => {
    setLastNotification({ title, message, type, time: Date.now() });
    setTimeout(() => {
      setLastNotification((current) => (current && current.time === Date.now() ? null : current));
    }, 4500);
  };

  const runSimulationAction = async (actionFn, actionName, actionMeta = {}) => {
    setIsReoptimizing(true);
    try {
      const res = await actionFn();
      notify(actionName, res.message || 'Simulation action executed', 'success');

      if (actionMeta.isReset) {
        setReoptimizationEvent(null);
        isFirstLoadRef.current = true;
        prevAssignmentsRef.current = {};
      }

      // If backend returns explicit reoptimization message, record it immediately
      if (res && res.reoptimized) {
        const impact = res.impact_details || {};
        if (impact.disabled_resource) {
          const targetAsg = assignments.find((a) => a.ambulance_id === impact.disabled_resource) || assignments[0];
          setReoptimizationEvent({
            emergencyId: targetAsg?.emergency_id || 'E-101',
            reason: res.message || `Lead ambulance ${impact.disabled_resource} became unavailable.`,
            previous: `${targetAsg?.emergency_id || 'E-101'} → ${impact.disabled_resource}`,
            newVal: `${targetAsg?.emergency_id || 'E-101'} → AMB-03`,
            routeStatus: 'Updated',
            previousEta: '10 min',
            newEta: '8 min',
            why: 'AMB-03 was the best available suitable resource.',
            timestamp: Date.now()
          });
        } else if (res.event_type === 'TRAFFIC_SPIKE') {
          setReoptimizationEvent({
            emergencyId: 'E-101',
            reason: res.message || 'Severe corridor traffic surge detected.',
            previous: 'E-101 (Primary Arterial Route)',
            newVal: 'E-101 (Dynamic Alternate Bypass)',
            routeStatus: 'Updated',
            previousEta: '14 min',
            newEta: '9 min',
            why: 'Dynamic rerouting avoided corridor gridlock to protect response SLA.',
            timestamp: Date.now()
          });
        } else if (res.event_type === 'HOSPITAL_ICU_SATURATED') {
          setReoptimizationEvent({
            emergencyId: 'E-101',
            reason: res.message || 'Hospital ICU reached 100% saturation (0 beds open).',
            previous: `E-101 → ${impact.hospital_name || 'H-02'}`,
            newVal: 'E-101 → H-01 (NIMS)',
            routeStatus: 'Updated',
            previousEta: '15 min',
            newEta: '11 min',
            why: 'Diverted to Apex Level 1 Trauma Center with verified available ICU beds.',
            timestamp: Date.now()
          });
        }
      }

      await fetchAllData(true);
    } catch (err) {
      notify('Simulation Error', err.response?.data?.detail || err.message, 'error');
    } finally {
      setIsReoptimizing(false);
    }
  };

  const dismissReoptimization = () => {
    setReoptimizationEvent(null);
  };

  const selectedEmergency = emergencies.find((e) => e.id === selectedEmergencyId) || emergencies[0] || null;
  const selectedAssignment = assignments.find((a) => a.emergency_id === selectedEmergencyId) || null;

  return {
    metrics,
    emergencies,
    ambulances,
    responseTeams,
    hospitals,
    doctors,
    assignments,
    systemEvents,
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
  };
}
