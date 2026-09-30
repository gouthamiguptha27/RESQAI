from pydantic import BaseModel
from typing import List, Optional

class AmbulanceResponse(BaseModel):
    id: str
    call_sign: str
    type: str
    latitude: float
    longitude: float
    status: str
    crew_info: str
    equipment: List[str]
    current_emergency_id: Optional[str] = None
    speed_kmh: float

    class Config:
        from_attributes = True

class ResponseTeamResponse(BaseModel):
    id: str
    name: str
    type: str
    latitude: float
    longitude: float
    status: str
    personnel_count: int
    specialties: List[str]
    current_emergency_id: Optional[str] = None

    class Config:
        from_attributes = True

class DoctorResponse(BaseModel):
    id: str
    name: str
    specialty: str
    hospital_id: str
    status: str

    class Config:
        from_attributes = True

class MedicalResourceResponse(BaseModel):
    id: str
    name: str
    category: str
    hospital_id: Optional[str]
    is_available: bool
    total_quantity: int
    available_quantity: int

    class Config:
        from_attributes = True

class ResourceStatusUpdate(BaseModel):
    status: str
