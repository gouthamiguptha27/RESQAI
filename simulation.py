from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class SimulationTrafficSpike(BaseModel):
    corridor_or_route_id: Optional[str] = None
    severity: str = "SEVERE" # HEAVY, SEVERE, GRIDLOCK
    multiplier: float = 2.4

class SimulationResourceBreakdown(BaseModel):
    resource_id: str
    status: str = "UNAVAILABLE" # UNAVAILABLE, MAINTENANCE

class SimulationHospitalCapacity(BaseModel):
    hospital_id: str
    icu_occupied_delta: Optional[int] = None
    set_full_icu: bool = False
    set_diversion: bool = False

class SimulationSeverityChange(BaseModel):
    emergency_id: str
    new_severity: str # CRITICAL, HIGH, MEDIUM, LOW
    people_affected: Optional[int] = None

class SimulationScenarioRequest(BaseModel):
    scenario_type: str = "MASS_CASUALTY" # MASS_CASUALTY, MULTI_INCIDENT, GRIDLOCK_CRISIS

class SimulationActionResponse(BaseModel):
    success: bool
    event_type: str
    message: str
    impact_details: Dict[str, Any]
    reoptimized: bool = True
