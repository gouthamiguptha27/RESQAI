import pytest
from ..optimization.allocation_engine import match_resources_for_emergency

class MockAmbulance:
    def __init__(self, id, call_sign, amb_type, lat, lng, status="AVAILABLE", speed=50.0):
        self.id = id
        self.call_sign = call_sign
        self.type = amb_type
        self.latitude = lat
        self.longitude = lng
        self.status = status
        self.speed_kmh = speed

class MockEmergency:
    def __init__(self, id, severity, lat, lng, req_res, condition):
        self.id = id
        self.severity = severity
        self.latitude = lat
        self.longitude = lng
        self.required_resources = req_res
        self.patient_condition = condition
        self.type = "Severe Incident"

def test_als_ambulance_preferred_for_critical_patient():
    # Amb 1 is BLS and slightly closer
    # Amb 2 is ALS with critical care and slightly further
    em = MockEmergency(
        id="E-1",
        severity="CRITICAL",
        lat=40.740,
        lng=-73.980,
        req_res=["Ambulance (ALS)", "Ventilator"],
        condition="Cardiac arrest, unresponsive"
    )
    amb_bls = MockAmbulance("AMB-BLS", "Transport BLS", "Basic Life Support (BLS)", 40.741, -73.981)
    amb_als = MockAmbulance("AMB-ALS", "Medic ALS", "Advanced Life Support (ALS)", 40.745, -73.985)

    best_amb, _, _, expl = match_resources_for_emergency(
        emergency=em,
        available_ambulances=[amb_bls, amb_als],
        available_response_teams=[],
        hospitals=[],
        doctors=[]
    )

    assert best_amb.id == "AMB-ALS"
    assert "Medic ALS" in expl["ambulance"]
    assert "Basic Life Support (BLS) only" in expl["ambulance"]
