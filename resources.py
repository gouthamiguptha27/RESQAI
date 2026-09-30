import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from ..database import get_db
from ..models import Ambulance, ResponseTeam, Doctor, MedicalResource, SystemEvent
from ..schemas.resource import (
    AmbulanceResponse,
    ResponseTeamResponse,
    DoctorResponse,
    MedicalResourceResponse,
    ResourceStatusUpdate
)
from ..optimization.reoptimizer import execute_reoptimization

router = APIRouter(prefix="/resources", tags=["resources"])

def parse_equipment(equip_str):
    if isinstance(equip_str, list):
        return equip_str
    try:
        return json.loads(equip_str or "[]")
    except Exception:
        return []

@router.get("/ambulances", response_model=List[AmbulanceResponse])
def get_ambulances(db: Session = Depends(get_db)):
    ambs = db.query(Ambulance).all()
    results = []
    for a in ambs:
        results.append({
            "id": a.id,
            "call_sign": a.call_sign,
            "type": a.type,
            "latitude": a.latitude,
            "longitude": a.longitude,
            "status": a.status,
            "crew_info": a.crew_info,
            "equipment": parse_equipment(a.equipment),
            "current_emergency_id": a.current_emergency_id,
            "speed_kmh": a.speed_kmh
        })
    return results

@router.patch("/ambulances/{ambulance_id}/status")
def update_ambulance_status(ambulance_id: str, data: ResourceStatusUpdate, db: Session = Depends(get_db)):
    amb = db.query(Ambulance).filter(Ambulance.id == ambulance_id).first()
    if not amb:
        raise HTTPException(status_code=404, detail="Ambulance not found")
    
    old_status = amb.status
    amb.status = data.status.upper()
    db.commit()

    db.add(SystemEvent(
        timestamp=datetime.utcnow(),
        event_type="RESOURCE_STATUS_CHANGE",
        severity="WARNING" if amb.status != "AVAILABLE" else "INFO",
        title=f"Ambulance {amb.call_sign} Status -> {amb.status}",
        description=f"Status transitioned from {old_status} to {amb.status}.",
        reason="Manual operator update or telemetry alert.",
        impact="Triggered re-optimization check if unit was actively assigned.",
        resource_id=amb.id
    ))
    db.commit()

    # Trigger reoptimization if active unit broke down
    execute_reoptimization(db, trigger_reason=f"AMBULANCE_STATUS_{amb.id}_{amb.status}")
    return {"id": amb.id, "status": amb.status}

@router.get("/teams", response_model=List[ResponseTeamResponse])
def get_response_teams(db: Session = Depends(get_db)):
    teams = db.query(ResponseTeam).all()
    results = []
    for t in teams:
        results.append({
            "id": t.id,
            "name": t.name,
            "type": t.type,
            "latitude": t.latitude,
            "longitude": t.longitude,
            "status": t.status,
            "personnel_count": t.personnel_count,
            "specialties": parse_equipment(t.specialties),
            "current_emergency_id": t.current_emergency_id
        })
    return results

@router.patch("/teams/{team_id}/status")
def update_team_status(team_id: str, data: ResourceStatusUpdate, db: Session = Depends(get_db)):
    team = db.query(ResponseTeam).filter(ResponseTeam.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    team.status = data.status.upper()
    db.commit()
    execute_reoptimization(db, trigger_reason=f"TEAM_STATUS_{team.id}_{team.status}")
    return {"id": team.id, "status": team.status}

@router.get("/doctors", response_model=List[DoctorResponse])
def get_doctors(db: Session = Depends(get_db)):
    return db.query(Doctor).all()

@router.patch("/doctors/{doctor_id}/status")
def update_doctor_status(doctor_id: str, data: ResourceStatusUpdate, db: Session = Depends(get_db)):
    doc = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    doc.status = data.status.upper()
    db.commit()

    db.add(SystemEvent(
        timestamp=datetime.utcnow(),
        event_type="STAFF_STATUS_CHANGE",
        severity="WARNING" if doc.status != "AVAILABLE" else "INFO",
        title=f"Doctor Status Update: {doc.name}",
        description=f"{doc.name} ({doc.specialty}) changed status to {doc.status}.",
        reason="Operating room call or shift rotation.",
        impact="Hospital clinical capability adjusted.",
        hospital_id=doc.hospital_id
    ))
    db.commit()
    execute_reoptimization(db, trigger_reason=f"DOCTOR_STATUS_{doc.id}")
    return {"id": doc.id, "status": doc.status}

@router.get("/medical", response_model=List[MedicalResourceResponse])
def get_medical_resources(db: Session = Depends(get_db)):
    return db.query(MedicalResource).all()
