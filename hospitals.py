import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from ..database import get_db
from ..models import Hospital, SystemEvent
from ..schemas.hospital import HospitalResponse, HospitalCapacityUpdate
from ..optimization.reoptimizer import execute_reoptimization

router = APIRouter(prefix="/hospitals", tags=["hospitals"])

def format_hospital(h: Hospital) -> dict:
    specs = json.loads(h.specialties) if isinstance(h.specialties, str) else (h.specialties or [])
    equip = json.loads(h.equipment) if isinstance(h.equipment, str) else (h.equipment or [])
    return {
        "id": h.id,
        "name": h.name,
        "trauma_level": h.trauma_level,
        "latitude": h.latitude,
        "longitude": h.longitude,
        "address": h.address,
        "er_capacity_total": h.er_capacity_total,
        "er_capacity_occupied": h.er_capacity_occupied,
        "icu_beds_total": h.icu_beds_total,
        "icu_beds_occupied": h.icu_beds_occupied,
        "general_beds_total": h.general_beds_total,
        "general_beds_occupied": h.general_beds_occupied,
        "er_beds_available": h.er_beds_available,
        "icu_beds_available": h.icu_beds_available,
        "specialties": specs,
        "equipment": equip,
        "status": h.status
    }

@router.get("", response_model=List[HospitalResponse])
def get_hospitals(db: Session = Depends(get_db)):
    hospitals = db.query(Hospital).all()
    return [format_hospital(h) for h in hospitals]

@router.get("/{hospital_id}", response_model=HospitalResponse)
def get_hospital(hospital_id: str, db: Session = Depends(get_db)):
    h = db.query(Hospital).filter(Hospital.id == hospital_id).first()
    if not h:
        raise HTTPException(status_code=404, detail="Hospital not found")
    return format_hospital(h)

@router.patch("/{hospital_id}/capacity")
def update_hospital_capacity(hospital_id: str, data: HospitalCapacityUpdate, db: Session = Depends(get_db)):
    h = db.query(Hospital).filter(Hospital.id == hospital_id).first()
    if not h:
        raise HTTPException(status_code=404, detail="Hospital not found")

    if data.er_capacity_occupied is not None:
        h.er_capacity_occupied = min(h.er_capacity_total, max(0, data.er_capacity_occupied))
    if data.icu_beds_occupied is not None:
        h.icu_beds_occupied = min(h.icu_beds_total, max(0, data.icu_beds_occupied))
    if data.general_beds_occupied is not None:
        h.general_beds_occupied = min(h.general_beds_total, max(0, data.general_beds_occupied))
    if data.status is not None:
        h.status = data.status.upper()

    db.commit()

    # Log system event if ICU became saturated
    if h.icu_beds_available == 0:
        db.add(SystemEvent(
            timestamp=datetime.utcnow(),
            event_type="CAPACITY_CRITICAL",
            severity="CRITICAL",
            title=f"{h.name} ICU Saturated",
            description=f"ICU reached maximum capacity (0/{h.icu_beds_total} available).",
            reason="Capacity update / admissions spike.",
            impact="Triggering automatic diversion check for inbound critical transports.",
            hospital_id=h.id
        ))
        db.commit()

    # Trigger reoptimization
    execute_reoptimization(db, trigger_reason=f"HOSPITAL_CAPACITY_{h.id}")
    return format_hospital(h)
