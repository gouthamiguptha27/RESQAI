import pytest
from ..models import Hospital, Doctor
from ..optimization.hospital_engine import select_optimal_hospital

class MockHospital:
    def __init__(self, id, name, lat, lng, er_tot, er_occ, icu_tot, icu_occ, specs, equip, status="OPEN"):
        self.id = id
        self.name = name
        self.trauma_level = "Level 1"
        self.latitude = lat
        self.longitude = lng
        self.er_capacity_total = er_tot
        self.er_capacity_occupied = er_occ
        self.icu_beds_total = icu_tot
        self.icu_beds_occupied = icu_occ
        self.specialties = specs
        self.equipment = equip
        self.status = status

    @property
    def icu_beds_available(self):
        return max(0, self.icu_beds_total - self.icu_beds_occupied)

    @property
    def er_beds_available(self):
        return max(0, self.er_capacity_total - self.er_capacity_occupied)

class MockDoctor:
    def __init__(self, id, name, specialty, hospital_id, status="AVAILABLE"):
        self.id = id
        self.name = name
        self.specialty = specialty
        self.hospital_id = hospital_id
        self.status = status

def test_hospital_selection_bypasses_closer_full_icu():
    # Emergency at (40.750, -73.950)
    # Hospital A is closer (40.751, -73.951) but ICU is 100% full (0 available)
    # Hospital B is further (40.740, -73.980) but has 5 ICU beds and Trauma Surgeon
    hosp_a_close_full = MockHospital(
        id="H-A",
        name="Close Full Hospital",
        lat=40.7510,
        lng=-73.9510,
        er_tot=10,
        er_occ=9,
        icu_tot=5,
        icu_occ=5, # 0 beds available!
        specs=["General Physician"],
        equip=["X-Ray"]
    )
    hosp_b_far_optimal = MockHospital(
        id="H-B",
        name="Far Optimal Trauma Center",
        lat=40.7400,
        lng=-73.9800,
        er_tot=25,
        er_occ=10,
        icu_tot=10,
        icu_occ=5, # 5 beds open!
        specs=["Trauma Surgeon", "Cardiologist"],
        equip=["CT Scanner", "ECMO", "Ventilators"]
    )
    docs = [
        MockDoctor("D-1", "Dr. B", "Trauma Surgeon", "H-B", "AVAILABLE")
    ]

    selected_hosp, explanation, evaluations = select_optimal_hospital(
        emergency_lat=40.750,
        emergency_lng=-73.950,
        emergency_severity="CRITICAL",
        required_resources=["Trauma Surgeon", "ICU Bed"],
        patient_condition="Severe crushing trauma, unconscious",
        hospitals=[hosp_a_close_full, hosp_b_far_optimal],
        doctors=docs
    )

    assert selected_hosp.id == "H-B"
    assert "Far Optimal Trauma Center" in explanation["summary"]
    # Check that explanation mentions bypassing the closer full facility
    assert len(explanation["bypassed_facilities"]) > 0
    assert "Close Full Hospital" in explanation["bypassed_facilities"][0]
    assert "ICU beds available" in explanation["icu_status"]
