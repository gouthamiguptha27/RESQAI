from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class EmergencyBase(BaseModel):
    title: str = Field(..., example="Multi-Vehicle Collision on Express Highway")
    type: str = Field(..., example="Multi-Vehicle Collision")
    severity: str = Field("HIGH", example="CRITICAL") # CRITICAL, HIGH, MEDIUM, LOW
    people_affected: int = Field(1, ge=1, example=4)
    patient_condition: Optional[str] = Field(None, example="Multiple trauma, unconscious, arterial bleeding")
    latitude: float = Field(..., example=40.730610)
    longitude: float = Field(..., example=-73.935242)
    location_name: str = Field(..., example="I-95 Northbound Junction 14")
    urgency_level: str = Field("HIGH", example="EXTREME")
    required_resources: List[str] = Field(default_factory=list, example=["Ambulance", "Trauma Surgeon", "Heavy Extraction"])

class EmergencyCreate(EmergencyBase):
    pass

class EmergencyUpdate(BaseModel):
    title: Optional[str] = None
    severity: Optional[str] = None
    people_affected: Optional[int] = None
    patient_condition: Optional[str] = None
    urgency_level: Optional[str] = None
    status: Optional[str] = None
    required_resources: Optional[List[str]] = None

class EmergencyResponse(EmergencyBase):
    id: str
    status: str
    priority_score: float
    priority_factors: Dict[str, Any]
    time_reported: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
