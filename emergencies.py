import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from ..database import get_db
from ..models import Emergency, SystemEvent
from ..schemas.emergency import EmergencyCreate, EmergencyUpdate, EmergencyResponse
from ..optimization.priority_engine import calculate_priority_score
from ..optimization.reoptimizer import execute_reoptimization

router = APIRouter(prefix="/emergencies", tags=["emergencies"])

def format_emergency_response(em: Emergency) -> dict:
    factors = json.loads(em.priority_factors) if isinstance(em.priority_factors, str) else (em.priority_factors or {})
    req_res = json.loads(em.required_resources) if isinstance(em.required_resources, str) else (em.required_resources or [])
    return {
        "id": em.id,
        "title": em.title,
        "type": em.type,
        "severity": em.severity,
        "people_affected": em.people_affected,
        "patient_condition": em.patient_condition,
        "latitude": em.latitude,
        "longitude": em.longitude,
        "location_name": em.location_name,
        "urgency_level": em.urgency_level,
        "required_resources": req_res,
        "status": em.status,
        "priority_score": em.priority_score,
        "priority_factors": factors,
        "time_reported": em.time_reported,
        "created_at": em.created_at,
        "updated_at": em.updated_at
    }

@router.get("", response_model=List[EmergencyResponse])
def get_all_emergencies(db: Session = Depends(get_db)):
    # Order by priority score descending (Highest Priority first)
    emergencies = db.query(Emergency).order_by(Emergency.priority_score.desc()).all()
    return [format_emergency_response(e) for e in emergencies]

@router.get("/{emergency_id}", response_model=EmergencyResponse)
def get_emergency_by_id(emergency_id: str, db: Session = Depends(get_db)):
    em = db.query(Emergency).filter(Emergency.id == emergency_id).first()
    if not em:
        raise HTTPException(status_code=404, detail="Emergency not found")
    return format_emergency_response(em)

@router.post("", response_model=EmergencyResponse)
def create_emergency(data: EmergencyCreate, db: Session = Depends(get_db)):
    now = datetime.utcnow()
    # Generate unique ID
    count = db.query(Emergency).count() + 1
    emergency_id = f"E-{100 + count}"

    # Calculate initial priority score
    p_score, p_factors = calculate_priority_score(
        severity=data.severity,
        people_affected=data.people_affected,
        urgency_level=data.urgency_level,
        time_reported=now,
        required_resources=data.required_resources,
        patient_condition=data.patient_condition
    )

    new_em = Emergency(
        id=emergency_id,
        title=data.title,
        type=data.type,
        severity=data.severity,
        people_affected=data.people_affected,
        patient_condition=data.patient_condition,
        latitude=data.latitude,
        longitude=data.longitude,
        location_name=data.location_name,
        urgency_level=data.urgency_level,
        required_resources=json.dumps(data.required_resources),
        status="PENDING",
        priority_score=p_score,
        priority_factors=json.dumps(p_factors),
        time_reported=now,
        created_at=now,
        updated_at=now
    )
    db.add(new_em)
    
    # Audit event
    db.add(SystemEvent(
        timestamp=now,
        event_type="INCIDENT_NEW",
        severity="CRITICAL" if data.severity == "CRITICAL" else "WARNING",
        title=f"New Incident Reported: {data.title}",
        description=f"{data.severity} incident at {data.location_name} affecting {data.people_affected} person(s).",
        reason=f"Assigned priority score {p_score:.1f}.",
        impact="Triggered real-time dynamic resource allocation engine.",
        emergency_id=emergency_id
    ))
    db.commit()

    # Automatically re-optimize and assign resources to the new incident!
    execute_reoptimization(db, trigger_reason=f"NEW_EMERGENCY_{emergency_id}")

    db.refresh(new_em)
    return format_emergency_response(new_em)

@router.patch("/{emergency_id}")
def update_emergency(emergency_id: str, data: EmergencyUpdate, db: Session = Depends(get_db)):
    em = db.query(Emergency).filter(Emergency.id == emergency_id).first()
    if not em:
        raise HTTPException(status_code=404, detail="Emergency not found")

    if data.severity is not None:
        em.severity = data.severity
    if data.people_affected is not None:
        em.people_affected = data.people_affected
    if data.patient_condition is not None:
        em.patient_condition = data.patient_condition
    if data.urgency_level is not None:
        em.urgency_level = data.urgency_level
    if data.status is not None:
        em.status = data.status
    if data.required_resources is not None:
        em.required_resources = json.dumps(data.required_resources)

    # Re-evaluate priority
    req_res = json.loads(em.required_resources) if isinstance(em.required_resources, str) else []
    p_score, p_factors = calculate_priority_score(
        severity=em.severity,
        people_affected=em.people_affected,
        urgency_level=em.urgency_level,
        time_reported=em.time_reported,
        required_resources=req_res,
        patient_condition=em.patient_condition
    )
    em.priority_score = p_score
    em.priority_factors = json.dumps(p_factors)
    em.updated_at = datetime.utcnow()

    db.commit()
    # Trigger reoptimization
    execute_reoptimization(db, trigger_reason=f"UPDATE_EMERGENCY_{emergency_id}")
    db.refresh(em)
    return format_emergency_response(em)
