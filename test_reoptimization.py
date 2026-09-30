import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from ..database import Base
from ..models import Emergency, Ambulance, ResponseTeam, Hospital, Doctor, Assignment, Route, SystemEvent
from ..optimization.reoptimizer import execute_reoptimization
from ..seed_data import seed_database

@pytest.fixture
def test_db():
    test_engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=test_engine)
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
    db = TestingSession()
    
    # Run seed in memory
    from ..seed_data import seed_database
    # Temporarily monkeypatch or insert minimal models
    # Hospitals
    h1 = Hospital(id="H-01", name="Trauma 1", trauma_level="Level 1", latitude=40.74, longitude=-73.98, er_capacity_total=20, er_capacity_occupied=10, icu_beds_total=10, icu_beds_occupied=5, specialties='["Trauma Surgeon"]', equipment='["ECMO"]', status="OPEN")
    h2 = Hospital(id="H-02", name="Burn 2", trauma_level="Level 1", latitude=40.76, longitude=-73.95, er_capacity_total=15, er_capacity_occupied=8, icu_beds_total=5, icu_beds_occupied=4, specialties='["Burn Specialist"]', equipment='["Ventilators"]', status="OPEN")
    db.add_all([h1, h2])
    
    # Ambulances
    a1 = Ambulance(id="AMB-01", call_sign="Medic-1", type="Advanced Life Support (ALS)", latitude=40.73, longitude=-73.98, status="AVAILABLE", crew_info="Paramedics", equipment='["Defibrillator"]', speed_kmh=50.0)
    a2 = Ambulance(id="AMB-02", call_sign="Medic-2", type="Advanced Life Support (ALS)", latitude=40.75, longitude=-73.96, status="AVAILABLE", crew_info="Paramedics", equipment='["Defibrillator"]', speed_kmh=50.0)
    db.add_all([a1, a2])

    # Emergency
    e1 = Emergency(id="E-101", title="Expressway Collision", type="Multi-Vehicle Collision", severity="CRITICAL", people_affected=3, patient_condition="Crush injury", latitude=40.745, longitude=-73.97, location_name="Overpass", required_resources='["Ambulance", "ICU Bed"]', status="PENDING")
    db.add(e1)
    db.commit()

    # Initial optimization
    execute_reoptimization(db, "INITIAL_TEST_RUN")
    
    yield db
    db.close()

def test_reoptimization_handles_ambulance_breakdown(test_db):
    # Verify initial assignment
    asg = test_db.query(Assignment).filter(Assignment.emergency_id == "E-101").first()
    assert asg is not None
    orig_amb_id = asg.ambulance_id
    assert orig_amb_id in ["AMB-01", "AMB-02"]

    # Now simulate mechanical failure of the assigned ambulance!
    assigned_amb = test_db.query(Ambulance).filter(Ambulance.id == orig_amb_id).first()
    assigned_amb.status = "UNAVAILABLE"
    test_db.commit()

    # Trigger reoptimization
    reopt_res = execute_reoptimization(test_db, trigger_reason="TEST_AMBULANCE_FAILURE")

    # Verify that assignment was automatically switched to the alternative available ambulance!
    test_db.refresh(asg)
    assert asg.ambulance_id != orig_amb_id
    assert asg.reassignment_reason == f"Assignment changed because {orig_amb_id} became unavailable."
    assert any("became unavailable" in act for act in reopt_res["actions_taken"])

def test_reoptimization_handles_hospital_icu_depletion(test_db):
    asg = test_db.query(Assignment).filter(Assignment.emergency_id == "E-101").first()
    orig_hosp_id = asg.hospital_id

    # Now simulate hospital ICU filling to capacity
    curr_hosp = test_db.query(Hospital).filter(Hospital.id == orig_hosp_id).first()
    curr_hosp.icu_beds_occupied = curr_hosp.icu_beds_total # 0 beds available!
    test_db.commit()

    # Trigger reoptimization
    reopt_res = execute_reoptimization(test_db, trigger_reason="TEST_ICU_DEPLETION")

    # Verify that assignment hospital was automatically redirected to the other hospital with open ICU
    test_db.refresh(asg)
    assert asg.hospital_id != orig_hosp_id
    assert any("Hospital Diversion" in act for act in reopt_res["actions_taken"])
