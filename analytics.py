from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Emergency, Ambulance, ResponseTeam, Hospital, Assignment

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/dashboard")
def get_dashboard_metrics(db: Session = Depends(get_db)):
    active_emergencies = db.query(Emergency).filter(Emergency.status.in_(["PENDING", "ASSIGNED", "DISPATCHED"])).all()
    total_active = len(active_emergencies)
    critical_count = sum(1 for e in active_emergencies if e.severity == "CRITICAL")
    high_count = sum(1 for e in active_emergencies if e.severity == "HIGH")

    ambulances = db.query(Ambulance).all()
    available_ambulances = sum(1 for a in ambulances if a.status == "AVAILABLE")
    total_ambulances = len(ambulances)

    teams = db.query(ResponseTeam).all()
    available_teams = sum(1 for t in teams if t.status == "AVAILABLE")
    total_teams = len(teams)

    hospitals = db.query(Hospital).all()
    available_icu_beds = sum(h.icu_beds_available for h in hospitals)
    total_icu_beds = sum(h.icu_beds_total for h in hospitals)

    available_er_beds = sum(h.er_beds_available for h in hospitals)
    total_er_beds = sum(h.er_capacity_total for h in hospitals)

    available_general_beds = sum(max(0, h.general_beds_total - h.general_beds_occupied) for h in hospitals)
    total_general_beds = sum(h.general_beds_total for h in hospitals)

    assignments = db.query(Assignment).filter(Assignment.status.in_(["DISPATCHED", "EN_ROUTE", "ACTIVE"])).all()
    active_assignments_count = len(assignments)

    # Average response time (arrival to scene)
    avg_response_time = 0.0
    if assignments:
        total_time = sum(a.eta_to_scene_minutes for a in assignments)
        avg_response_time = round(total_time / len(assignments), 1)

    # Resource Utilization %
    utilized_resources = (total_ambulances - available_ambulances) + (total_teams - available_teams)
    total_resources = total_ambulances + total_teams
    utilization_rate = round((utilized_resources / max(1, total_resources)) * 100, 1)

    return {
        "total_active_emergencies": total_active,
        "critical_emergencies": critical_count,
        "high_emergencies": high_count,
        "available_ambulances": available_ambulances,
        "total_ambulances": total_ambulances,
        "available_response_teams": available_teams,
        "total_response_teams": total_teams,
        "available_icu_beds": available_icu_beds,
        "total_icu_beds": total_icu_beds,
        "available_er_beds": available_er_beds,
        "total_er_beds": total_er_beds,
        "available_hospital_beds": available_general_beds + available_er_beds,
        "total_hospital_beds": total_general_beds + total_er_beds,
        "active_assignments": active_assignments_count,
        "average_response_time_minutes": avg_response_time,
        "resource_utilization_pct": utilization_rate
    }
