from sqlalchemy import Column, String, Float, Boolean, Text, ForeignKey
from ..database import Base

class Route(Base):
    __tablename__ = "routes"

    id = Column(String, primary_key=True, index=True)
    assignment_id = Column(String, ForeignKey("assignments.id"), nullable=False)
    route_type = Column(String, default="RESOURCE_TO_SCENE") # RESOURCE_TO_SCENE, SCENE_TO_HOSPITAL
    
    origin_lat = Column(Float, nullable=False)
    origin_lng = Column(Float, nullable=False)
    destination_lat = Column(Float, nullable=False)
    destination_lng = Column(Float, nullable=False)
    
    waypoints_json = Column(Text, default="[]") # JSON list of [lat, lng]
    distance_km = Column(Float, default=0.0)
    duration_minutes = Column(Float, default=0.0)
    traffic_level = Column(String, default="MODERATE") # LOW, MODERATE, HEAVY, SEVERE
    traffic_multiplier = Column(Float, default=1.0)
    
    is_rerouted = Column(Boolean, default=False)
    reroute_reason = Column(Text, default="")
