from pydantic import BaseModel
from typing import List, Optional, Any, Dict
from datetime import datetime

class RouteWaypoint(BaseModel):
    lat: float
    lng: float

class RouteResponse(BaseModel):
    id: str
    assignment_id: str
    route_type: str
    origin_lat: float
    origin_lng: float
    destination_lat: float
    destination_lng: float
    waypoints: List[List[float]]
    distance_km: float
    duration_minutes: float
    traffic_level: str
    traffic_multiplier: float
    is_rerouted: bool
    reroute_reason: str

    class Config:
        from_attributes = True

class AssignmentResponse(BaseModel):
    id: str
    emergency_id: str
    ambulance_id: Optional[str] = None
    response_team_id: Optional[str] = None
    hospital_id: Optional[str] = None
    status: str
    assigned_at: datetime
    
    distance_to_scene_km: float
    eta_to_scene_minutes: float
    distance_to_hospital_km: float
    eta_to_hospital_minutes: float
    
    resource_explanation: str
    hospital_explanation: str
    reassignment_reason: str
    decision_timeline: List[Dict[str, Any]]
    
    routes: List[RouteResponse] = []

    class Config:
        from_attributes = True
