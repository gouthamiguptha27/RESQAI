import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 4000,
});

// Standalone in-memory fallback state for static deployments (GitHub Pages / demo mode)
const initialMockData = {
  emergencies: [
    {
      id: "E-101",
      title: "[SIMULATED] Multi-Vehicle Pileup on PVNR Expressway",
      type: "Multi-Vehicle Collision",
      severity: "CRITICAL",
      people_affected: 4,
      patient_condition: "Multiple trauma victims, unconscious passenger trapped, heavy blood loss (SIMULATED DATA)",
      latitude: 17.3890,
      longitude: 78.4450,
      location_name: "PVNR Expressway Pillar 140, Mehdipatnam, Hyderabad",
      urgency_level: "EXTREME",
      status: "ASSIGNED",
      priority_score: 93.5,
      required_resources: ["Ambulance", "Trauma Surgeon", "ICU Bed", "Heavy Extraction"],
      priority_factors: {
        severity_score: 40.0,
        people_score: 15.0,
        urgency_score: 25.0,
        wait_score: 13.5,
        summary: "Prioritized dynamically based on life-threat acuity, casualty scale, and clinical triage window."
      }
    },
    {
      id: "E-103",
      title: "[SIMULATED] Acute STEMI Cardiac Arrest at Hitec City Metro",
      type: "Cardiac Arrest",
      severity: "CRITICAL",
      people_affected: 1,
      patient_condition: "Ventricular fibrillation, bystander CPR underway, unresponsive (SIMULATED DATA)",
      latitude: 17.4475,
      longitude: 78.3790,
      location_name: "Hitec City Metro Station Concourse, Hyderabad",
      urgency_level: "EXTREME",
      status: "ASSIGNED",
      priority_score: 88.0,
      required_resources: ["Ambulance", "Cardiologist", "ICU Bed"],
      priority_factors: {
        severity_score: 40.0,
        people_score: 10.0,
        urgency_score: 25.0,
        wait_score: 13.0,
        summary: "Prioritized based on acute STEMI life threat and immediate cardiac intervention window."
      }
    },
    {
      id: "E-104",
      title: "[SIMULATED] Structural Fire in Commercial Complex near Abids",
      type: "Factory Fire",
      severity: "HIGH",
      people_affected: 3,
      patient_condition: "Smoke inhalation, second-degree chemical burns to upper limbs (SIMULATED DATA)",
      latitude: 17.3910,
      longitude: 78.4760,
      location_name: "Station Road Commercial Complex, Abids, Hyderabad",
      urgency_level: "HIGH",
      status: "ASSIGNED",
      priority_score: 75.5,
      required_resources: ["Ambulance", "Burn Specialist", "ICU Bed"],
      priority_factors: {
        severity_score: 30.0,
        people_score: 12.0,
        urgency_score: 20.0,
        wait_score: 13.5,
        summary: "High urgency commercial fire with multiple smoke and burn casualties."
      }
    },
    {
      id: "E-102",
      title: "[SIMULATED] Chemical Solvent Vapor Leak at Jeedimetla Industrial Plant",
      type: "Chemical Leak",
      severity: "HIGH",
      people_affected: 2,
      patient_condition: "Respiratory distress, toxic vapor inhalation, ocular chemical burns (SIMULATED DATA)",
      latitude: 17.4980,
      longitude: 78.4520,
      location_name: "Phase 2, Jeedimetla Industrial Area, Hyderabad",
      urgency_level: "HIGH",
      status: "ASSIGNED",
      priority_score: 68.5,
      required_resources: ["HazMat", "Ambulance", "Burn Specialist"],
      priority_factors: {
        severity_score: 30.0,
        people_score: 10.0,
        urgency_score: 20.0,
        wait_score: 8.5,
        summary: "Hazardous chemical exposure requiring specialized respiratory decontamination."
      }
    },
    {
      id: "E-105",
      title: "[SIMULATED] Pedestrian Struck near Tank Bund Necklace Road",
      type: "Pedestrian Collision",
      severity: "MEDIUM",
      people_affected: 1,
      patient_condition: "Left femur fracture, lacerations, conscious and oriented (SIMULATED DATA)",
      latitude: 17.4240,
      longitude: 78.4720,
      location_name: "Tank Bund Waterfront Promenade, Hussain Sagar, Hyderabad",
      urgency_level: "MODERATE",
      status: "ASSIGNED",
      priority_score: 38.0,
      required_resources: ["Ambulance"],
      priority_factors: {
        severity_score: 20.0,
        people_score: 5.0,
        urgency_score: 10.0,
        wait_score: 3.0,
        summary: "Moderate orthopedic trauma with stable vital signs."
      }
    }
  ],
  ambulances: [
    { id: "AMB-01", call_sign: "Medic-1 (ALS)", type: "Advanced Life Support (ALS)", latitude: 17.3915, longitude: 78.4435, status: "DISPATCHED", crew_info: "2 Critical Care Paramedics", speed_kmh: 45.0 },
    { id: "AMB-02", call_sign: "Rescue-2 (ALS)", type: "Advanced Life Support (ALS)", latitude: 17.4420, longitude: 78.4870, status: "DISPATCHED", crew_info: "1 Paramedic, 1 Flight Nurse", speed_kmh: 46.0 },
    { id: "AMB-03", call_sign: "Transport-3 (BLS)", type: "Basic Life Support (BLS)", latitude: 17.4100, longitude: 78.4700, status: "AVAILABLE", crew_info: "2 EMT-Basics", speed_kmh: 44.0 },
    { id: "AMB-04", call_sign: "Critical-4 (MICU)", type: "Mobile Intensive Care Unit (MICU)", latitude: 17.4400, longitude: 78.3800, status: "DISPATCHED", crew_info: "1 Emergency Physician, 1 Critical Care Paramedic", speed_kmh: 45.0 },
    { id: "AMB-05", call_sign: "Medic-5 (ALS)", type: "Advanced Life Support (ALS)", latitude: 17.3820, longitude: 78.4850, status: "DISPATCHED", crew_info: "2 Paramedics", speed_kmh: 45.0 }
  ],
  hospitals: [
    {
      id: "H-01",
      name: "Nizam's Institute of Medical Sciences (NIMS)",
      trauma_level: "Apex Level 1 State Trauma & Tertiary Care",
      latitude: 17.4222,
      longitude: 78.4527,
      icu_beds_available: 6,
      icu_beds_total: 14,
      er_beds_available: 10,
      er_capacity_total: 28,
      status: "OPEN",
      equipment: ["CT Scanner", "ECMO", "Cath Lab", "Ventilators"]
    },
    {
      id: "H-02",
      name: "Gandhi Hospital & Critical Care Hub",
      trauma_level: "Apex Level 1 Critical & Burn Center",
      latitude: 17.4239,
      longitude: 78.5028,
      icu_beds_available: 1,
      icu_beds_total: 10,
      er_beds_available: 4,
      er_capacity_total: 22,
      status: "OPEN",
      equipment: ["Hyperbaric Chamber", "Burn ICU", "CT Scanner", "Ventilators"]
    },
    {
      id: "H-03",
      name: "Osmania General Hospital",
      trauma_level: "Level 2 Regional Trauma Facility",
      latitude: 17.3753,
      longitude: 78.4744,
      icu_beds_available: 0,
      icu_beds_total: 6,
      er_beds_available: 4,
      er_capacity_total: 16,
      status: "OPEN",
      equipment: ["X-Ray", "Basic Ultrasound", "Trauma Ward"]
    },
    {
      id: "H-04",
      name: "Apollo Health City",
      trauma_level: "Comprehensive Super-Specialty & Cardiac Institute",
      latitude: 17.4168,
      longitude: 78.4116,
      icu_beds_available: 7,
      icu_beds_total: 12,
      er_beds_available: 10,
      er_capacity_total: 20,
      status: "OPEN",
      equipment: ["Cath Lab", "ECMO", "Cardiac Telemetry", "CT Scanner"]
    }
  ],
  assignments: [
    {
      id: "ASG-101",
      emergency_id: "E-101",
      ambulance_id: "AMB-01",
      hospital_id: "H-02",
      status: "DISPATCHED",
      distance_to_scene_km: 1.8,
      eta_to_scene_minutes: 8.0,
      distance_to_hospital_km: 5.4,
      eta_to_hospital_minutes: 12.0,
      resource_explanation: "Assigned AMB-01 based on closest response vector (1.8 km) and ALS critical care capability.",
      hospital_explanation: "Selected Gandhi Hospital based on Level 1 Trauma accreditation, on-site Trauma Surgeon, and open ICU bed.",
      reassignment_reason: "",
      routes: [
        {
          id: "R-SCENE-E-101",
          route_type: "RESOURCE_TO_SCENE",
          distance_km: 1.8,
          duration_minutes: 8.0,
          traffic_level: "MODERATE",
          traffic_multiplier: 1.25,
          is_rerouted: false,
          reroute_reason: "",
          waypoints: [[17.3915, 78.4435], [17.3900, 78.4440], [17.3890, 78.4450]]
        },
        {
          id: "R-HOSP-E-101",
          route_type: "SCENE_TO_HOSPITAL",
          distance_km: 5.4,
          duration_minutes: 12.0,
          traffic_level: "MODERATE",
          traffic_multiplier: 1.25,
          is_rerouted: false,
          reroute_reason: "",
          waypoints: [[17.3890, 78.4450], [17.4050, 78.4750], [17.4239, 78.5028]]
        }
      ]
    },
    {
      id: "ASG-103",
      emergency_id: "E-103",
      ambulance_id: "AMB-04",
      hospital_id: "H-04",
      status: "DISPATCHED",
      distance_to_scene_km: 2.1,
      eta_to_scene_minutes: 6.5,
      distance_to_hospital_km: 4.8,
      eta_to_hospital_minutes: 10.0,
      resource_explanation: "Assigned Mobile ICU Critical-4 for active STEMI resuscitation.",
      hospital_explanation: "Selected Apollo Health City for 24/7 Cath Lab and on-site Interventional Cardiologist.",
      reassignment_reason: "",
      routes: [
        {
          id: "R-SCENE-E-103",
          route_type: "RESOURCE_TO_SCENE",
          distance_km: 2.1,
          duration_minutes: 6.5,
          traffic_level: "MODERATE",
          traffic_multiplier: 1.2,
          is_rerouted: false,
          reroute_reason: "",
          waypoints: [[17.4400, 78.3800], [17.4475, 78.3790]]
        },
        {
          id: "R-HOSP-E-103",
          route_type: "SCENE_TO_HOSPITAL",
          distance_km: 4.8,
          duration_minutes: 10.0,
          traffic_level: "MODERATE",
          traffic_multiplier: 1.2,
          is_rerouted: false,
          reroute_reason: "",
          waypoints: [[17.4475, 78.3790], [17.4168, 78.4116]]
        }
      ]
    },
    {
      id: "ASG-104",
      emergency_id: "E-104",
      ambulance_id: "AMB-05",
      hospital_id: "H-02",
      status: "DISPATCHED",
      distance_to_scene_km: 2.9,
      eta_to_scene_minutes: 7.0,
      distance_to_hospital_km: 4.2,
      eta_to_hospital_minutes: 9.3,
      resource_explanation: "Assigned Medic-5 for burn trauma stabilization.",
      hospital_explanation: "Selected Gandhi Hospital for regional Burn ICU and hyperbaric capability.",
      reassignment_reason: "",
      routes: [
        {
          id: "R-SCENE-E-104",
          route_type: "RESOURCE_TO_SCENE",
          distance_km: 2.9,
          duration_minutes: 7.0,
          traffic_level: "MODERATE",
          traffic_multiplier: 1.25,
          is_rerouted: false,
          reroute_reason: "",
          waypoints: [[17.3820, 78.4850], [17.3910, 78.4760]]
        },
        {
          id: "R-HOSP-E-104",
          route_type: "SCENE_TO_HOSPITAL",
          distance_km: 4.2,
          duration_minutes: 9.3,
          traffic_level: "MODERATE",
          traffic_multiplier: 1.25,
          is_rerouted: false,
          reroute_reason: "",
          waypoints: [[17.3910, 78.4760], [17.4239, 78.5028]]
        }
      ]
    }
  ]
};

// Deep clone for in-memory demo state
let mockState = JSON.parse(JSON.stringify(initialMockData));

export const api = {
  // Analytics
  getDashboardMetrics: async () => {
    try {
      const res = await apiClient.get('/analytics/dashboard');
      return res.data;
    } catch {
      const availAmbs = mockState.ambulances.filter((a) => a.status === 'AVAILABLE').length;
      const totalIcu = mockState.hospitals.reduce((acc, h) => acc + h.icu_beds_total, 0);
      const availIcu = mockState.hospitals.reduce((acc, h) => acc + h.icu_beds_available, 0);
      const critCount = mockState.emergencies.filter((e) => e.severity === 'CRITICAL').length;
      const highCount = mockState.emergencies.filter((e) => e.severity === 'HIGH').length;

      return {
        total_active_emergencies: mockState.emergencies.length,
        critical_emergencies: critCount,
        high_emergencies: highCount,
        available_ambulances: availAmbs,
        total_ambulances: mockState.ambulances.length,
        available_icu_beds: availIcu,
        total_icu_beds: totalIcu,
        average_response_time_minutes: 7.8,
        active_assignments: mockState.assignments.length
      };
    }
  },

  // Emergencies
  getEmergencies: async () => {
    try {
      const res = await apiClient.get('/emergencies');
      return res.data;
    } catch {
      return [...mockState.emergencies].sort((a, b) => b.priority_score - a.priority_score);
    }
  },
  getEmergency: async (id) => {
    try {
      const res = await apiClient.get(`/emergencies/${id}`);
      return res.data;
    } catch {
      return mockState.emergencies.find((e) => e.id === id);
    }
  },
  createEmergency: async (data) => {
    try {
      const res = await apiClient.post('/emergencies', data);
      return res.data;
    } catch {
      const newId = `E-${100 + mockState.emergencies.length + 1}`;
      const newEm = {
        id: newId,
        title: data.title,
        type: data.type,
        severity: data.severity,
        people_affected: data.people_affected,
        patient_condition: data.patient_condition,
        latitude: data.latitude,
        longitude: data.longitude,
        location_name: data.location_name,
        urgency_level: data.urgency_level,
        status: "ASSIGNED",
        priority_score: data.severity === 'CRITICAL' ? 91.0 : data.severity === 'HIGH' ? 76.0 : 45.0,
        required_resources: data.required_resources,
        priority_factors: {
          severity_score: data.severity === 'CRITICAL' ? 40 : 30,
          people_score: 15,
          urgency_score: 25,
          wait_score: 11,
          summary: "Newly registered incident dynamically prioritized and assigned."
        }
      };
      mockState.emergencies.unshift(newEm);
      return newEm;
    }
  },
  updateEmergency: async (id, data) => {
    try {
      const res = await apiClient.patch(`/emergencies/${id}`, data);
      return res.data;
    } catch {
      const em = mockState.emergencies.find((e) => e.id === id);
      if (em) Object.assign(em, data);
      return em;
    }
  },

  // Resources
  getAmbulances: async () => {
    try {
      const res = await apiClient.get('/resources/ambulances');
      return res.data;
    } catch {
      return mockState.ambulances;
    }
  },
  updateAmbulanceStatus: async (id, status) => {
    try {
      const res = await apiClient.patch(`/resources/ambulances/${id}/status`, { status });
      return res.data;
    } catch {
      const amb = mockState.ambulances.find((a) => a.id === id);
      if (amb) amb.status = status;
      return amb;
    }
  },
  getResponseTeams: async () => {
    try {
      const res = await apiClient.get('/resources/teams');
      return res.data;
    } catch {
      return [];
    }
  },
  updateTeamStatus: async (id, status) => {
    try {
      const res = await apiClient.patch(`/resources/teams/${id}/status`, { status });
      return res.data;
    } catch {
      return { id, status };
    }
  },
  getDoctors: async () => {
    try {
      const res = await apiClient.get('/resources/doctors');
      return res.data;
    } catch {
      return [];
    }
  },
  updateDoctorStatus: async (id, status) => {
    try {
      const res = await apiClient.patch(`/resources/doctors/${id}/status`, { status });
      return res.data;
    } catch {
      return { id, status };
    }
  },
  getMedicalResources: async () => {
    try {
      const res = await apiClient.get('/resources/medical');
      return res.data;
    } catch {
      return [];
    }
  },

  // Hospitals
  getHospitals: async () => {
    try {
      const res = await apiClient.get('/hospitals');
      return res.data;
    } catch {
      return mockState.hospitals;
    }
  },
  updateHospitalCapacity: async (id, data) => {
    try {
      const res = await apiClient.patch(`/hospitals/${id}/capacity`, data);
      return res.data;
    } catch {
      const h = mockState.hospitals.find((item) => item.id === id);
      if (h) Object.assign(h, data);
      return h;
    }
  },

  // Assignments & Routes
  getAssignments: async () => {
    try {
      const res = await apiClient.get('/assignments');
      return res.data;
    } catch {
      return mockState.assignments;
    }
  },
  getAssignmentByEmergency: async (emergencyId) => {
    try {
      const res = await apiClient.get(`/assignments/by-emergency/${emergencyId}`);
      return res.data;
    } catch {
      return mockState.assignments.find((a) => a.emergency_id === emergencyId);
    }
  },

  // Events
  getSystemEvents: async (limit = 40) => {
    try {
      const res = await apiClient.get(`/events?limit=${limit}`);
      return res.data;
    } catch {
      return [];
    }
  },

  // Simulation Triggers
  simulation: {
    trafficSpike: async (severity = 'SEVERE', multiplier = 2.4) => {
      try {
        const res = await apiClient.post('/simulation/traffic-spike', { severity, multiplier });
        return res.data;
      } catch {
        mockState.assignments.forEach((asg) => {
          asg.routes.forEach((r) => {
            r.is_rerouted = true;
            r.traffic_level = severity;
            r.traffic_multiplier = multiplier;
            r.reroute_reason = `Traffic surged ${multiplier}x on primary corridor. Switched to alternate dynamic arterial bypass.`;
          });
          asg.eta_to_scene_minutes = 9.0;
        });
        return {
          success: true,
          reoptimized: true,
          event_type: "TRAFFIC_SPIKE",
          message: `Traffic spiked to ${severity}. Dynamic rerouting bypass evaluated.`
        };
      }
    },
    disableResource: async (resourceId = 'AMB-01', status = 'UNAVAILABLE') => {
      try {
        const res = await apiClient.post('/simulation/disable-resource', { resource_id: resourceId, status });
        return res.data;
      } catch {
        const amb = mockState.ambulances.find((a) => a.id === resourceId);
        if (amb) amb.status = status;

        const targetAsg = mockState.assignments.find((a) => a.ambulance_id === resourceId) || mockState.assignments[0];
        if (targetAsg) {
          targetAsg.ambulance_id = 'AMB-03';
          targetAsg.eta_to_scene_minutes = 7.7;
          targetAsg.reassignment_reason = `Assignment changed because ${resourceId} became unavailable.`;
          targetAsg.resource_explanation = 'AMB-03 assigned as fastest replacement unit with matching Basic/Advanced Life Support equipment.';
          if (targetAsg.routes[0]) {
            targetAsg.routes[0].is_rerouted = true;
            targetAsg.routes[0].reroute_reason = `Assignment changed because ${resourceId} became unavailable.`;
          }
        }
        const amb3 = mockState.ambulances.find((a) => a.id === 'AMB-03');
        if (amb3) amb3.status = 'DISPATCHED';

        return {
          success: true,
          reoptimized: true,
          event_type: "RESOURCE_BREAKDOWN",
          message: `Assignment changed because ${resourceId} became unavailable.`,
          impact_details: { disabled_resource: resourceId }
        };
      }
    },
    fillHospitalICU: async (hospitalId = 'H-02', setDiversion = false) => {
      try {
        const res = await apiClient.post('/simulation/fill-hospital-icu', { hospital_id: hospitalId, set_diversion: setDiversion });
        return res.data;
      } catch {
        const h2 = mockState.hospitals.find((h) => h.id === hospitalId);
        if (h2) h2.icu_beds_available = 0;

        mockState.assignments.forEach((asg) => {
          if (asg.hospital_id === hospitalId) {
            asg.hospital_id = 'H-01';
            asg.hospital_explanation = 'Diverted to Nizam\'s Institute of Medical Sciences (NIMS) due to 100% ICU saturation at Gandhi Hospital.';
            asg.reassignment_reason = 'Receiving hospital capacity saturated.';
          }
        });
        return {
          success: true,
          reoptimized: true,
          event_type: "HOSPITAL_ICU_SATURATED",
          message: "Hospital ICU filled to 100%. Transport diversion evaluated."
        };
      }
    },
    doctorUnavailable: async () => {
      try {
        const res = await apiClient.post('/simulation/doctor-unavailable');
        return res.data;
      } catch {
        return {
          success: true,
          reoptimized: true,
          message: "On-duty specialist called into emergency surgery. Clinical matching verified."
        };
      }
    },
    escalateSeverity: async (emergencyId = 'E-105', newSeverity = 'CRITICAL') => {
      try {
        const res = await apiClient.post('/simulation/escalate-severity', { emergency_id: emergencyId, new_severity: newSeverity });
        return res.data;
      } catch {
        const em = mockState.emergencies.find((e) => e.id === emergencyId) || mockState.emergencies[mockState.emergencies.length - 1];
        if (em) {
          em.severity = newSeverity;
          em.priority_score = 92.0;
        }
        return {
          success: true,
          reoptimized: true,
          message: `Emergency ${em ? em.id : emergencyId} upgraded to ${newSeverity}. Queue reordered.`
        };
      }
    },
    massCasualty: async () => {
      try {
        const res = await apiClient.post('/simulation/mass-casualty');
        return res.data;
      } catch {
        const newId = `E-106`;
        mockState.emergencies.unshift({
          id: newId,
          title: "[SIMULATED] Structural Scaffold Collapse at Gachibowli Stadium Metro",
          type: "Building Collapse",
          severity: "CRITICAL",
          people_affected: 12,
          patient_condition: "Multiple trapped passengers, severe crush injuries, hypovolemic shock (DEMO DATA)",
          latitude: 17.4420,
          longitude: 78.3580,
          location_name: "Gachibowli Stadium ORR Transit Hub, Hyderabad",
          urgency_level: "EXTREME",
          status: "ASSIGNED",
          priority_score: 98.5,
          required_resources: ["Heavy Extraction", "Ambulance", "Trauma Surgeon", "ICU Bed"],
          priority_factors: {
            severity_score: 40.0,
            people_score: 20.0,
            urgency_score: 25.0,
            wait_score: 13.5,
            summary: "Catastrophic mass casualty structural collapse requiring metropolitan mobilization."
          }
        });
        return {
          success: true,
          reoptimized: true,
          message: "Mass casualty disaster injected with 12 casualties. System dynamically reallocated assets."
        };
      }
    },
    triggerReoptimize: async () => {
      try {
        const res = await apiClient.post('/simulation/reoptimize');
        return res.data;
      } catch {
        return {
          success: true,
          reoptimized: true,
          message: "Dynamic Re-Evaluation executed successfully across all active routes and facilities."
        };
      }
    },
    reset: async () => {
      try {
        const res = await apiClient.post('/simulation/reset');
        return res.data;
      } catch {
        mockState = JSON.parse(JSON.stringify(initialMockData));
        return {
          success: true,
          reoptimized: true,
          message: "Scenario reset to initial metropolitan baseline."
        };
      }
    },
  },
};
