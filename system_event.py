from sqlalchemy import Column, Integer, String, DateTime, Text
from datetime import datetime
from ..database import Base

class SystemEvent(Base):
    __tablename__ = "system_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    event_type = Column(String, nullable=False) # INCIDENT_NEW, REOPTIMIZE, RESOURCE_DISPATCH, TRAFFIC_UPDATE, HOSPITAL_REDIRECT, STATUS_CHANGE
    severity = Column(String, default="INFO")   # INFO, WARNING, CRITICAL, SUCCESS
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    reason = Column(Text, default="")
    impact = Column(Text, default="")
    
    emergency_id = Column(String, nullable=True)
    resource_id = Column(String, nullable=True)
    hospital_id = Column(String, nullable=True)
