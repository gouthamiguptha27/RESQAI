from pydantic import BaseModel
from typing import List, Optional

class HospitalResponse(BaseModel):
    id: str
    name: str
    trauma_level: str
    latitude: float
    longitude: float
    address: str
    
    er_capacity_total: int
    er_capacity_occupied: int
    icu_beds_total: int
    icu_beds_occupied: int
    general_beds_total: int
    general_beds_occupied: int
    
    er_beds_available: int
    icu_beds_available: int
    
    specialties: List[str]
    equipment: List[str]
    status: str

    class Config:
        from_attributes = True

class HospitalCapacityUpdate(BaseModel):
    er_capacity_occupied: Optional[int] = None
    icu_beds_occupied: Optional[int] = None
    general_beds_occupied: Optional[int] = None
    status: Optional[str] = None
