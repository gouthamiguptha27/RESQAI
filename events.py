from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import SystemEvent

router = APIRouter(prefix="/events", tags=["events"])

@router.get("")
def get_system_events(limit: int = Query(50, ge=1, le=200), db: Session = Depends(get_db)):
    events = db.query(SystemEvent).order_by(SystemEvent.id.desc()).limit(limit).all()
    return events
