import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import Assignment, Route, Emergency, Ambulance, ResponseTeam, Hospital
from ..schemas.assignment import AssignmentResponse, RouteResponse

router = APIRouter(prefix="/assignments", tags=["assignments"])

def format_assignment(asg: Assignment, db: Session) -> dict:
    timeline = json.loads(asg.decision_timeline) if isinstance(asg.decision_timeline, str) else (asg.decision_timeline or [])
    routes = db.query(Route).filter(Route.assignment_id == asg.id).all()
    route_list = []
    for r in routes:
        waypoints = json.loads(r.waypoints_json) if isinstance(r.waypoints_json, str) else (r.waypoints_json or [])
        route_list.append({
            "id": r.id,
            "assignment_id": r.assignment_id,
            "route_type": r.route_type,
            "origin_lat": r.origin_lat,
            "origin_lng": r.origin_lng,
            "destination_lat": r.destination_lat,
            "destination_lng": r.destination_lng,
            "waypoints": waypoints,
            "distance_km": r.distance_km,
            "duration_minutes": r.duration_minutes,
            "traffic_level": r.traffic_level,
            "traffic_multiplier": r.traffic_multiplier,
            "is_rerouted": r.is_rerouted,
            "reroute_reason": r.reroute_reason or ""
        })

    return {
        "id": asg.id,
        "emergency_id": asg.emergency_id,
        "ambulance_id": asg.ambulance_id,
        "response_team_id": asg.response_team_id,
        "hospital_id": asg.hospital_id,
        "status": asg.status,
        "assigned_at": asg.assigned_at,
        "distance_to_scene_km": asg.distance_to_scene_km,
        "eta_to_scene_minutes": asg.eta_to_scene_minutes,
        "distance_to_hospital_km": asg.distance_to_hospital_km,
        "eta_to_hospital_minutes": asg.eta_to_hospital_minutes,
        "resource_explanation": asg.resource_explanation or "",
        "hospital_explanation": asg.hospital_explanation or "",
        "reassignment_reason": asg.reassignment_reason or "",
        "decision_timeline": timeline,
        "routes": route_list
    }

@router.get("", response_model=List[AssignmentResponse])
def get_assignments(db: Session = Depends(get_db)):
    assignments = db.query(Assignment).all()
    return [format_assignment(a, db) for a in assignments]

@router.get("/{assignment_id}", response_model=AssignmentResponse)
def get_assignment(assignment_id: str, db: Session = Depends(get_db)):
    asg = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not asg:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return format_assignment(asg, db)

@router.get("/by-emergency/{emergency_id}", response_model=AssignmentResponse)
def get_assignment_by_emergency(emergency_id: str, db: Session = Depends(get_db)):
    asg = db.query(Assignment).filter(Assignment.id == emergency_id.replace("E-", "ASG-")).first()
    if not asg:
        asg = db.query(Assignment).filter(Assignment.emergency_id == emergency_id).first()
    if not asg:
        raise HTTPException(status_code=404, detail="No assignment for this emergency")
    return format_assignment(asg, db)
