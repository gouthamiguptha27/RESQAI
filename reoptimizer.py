import json
from datetime import datetime
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from ..models import Emergency, Ambulance, ResponseTeam, Hospital, Doctor, MedicalResource, Assignment, Route, SystemEvent
from .priority_engine import calculate_priority_score
from .allocation_engine import match_resources_for_emergency
from .hospital_engine import select_optimal_hospital
from .routing_engine import calculate_route_metrics, evaluate_rerouting_opportunity

def execute_reoptimization(db: Session, trigger_reason: str = "SCHEDULED_MONITORING") -> Dict[str, Any]:
    """
    Continuous Dynamic Re-optimization Engine.
    Evaluates changing conditions across incidents, resources, traffic, and hospital capacities.
    Recalculates priorities, reallocates if resources fail, reroutes if traffic surges, and
    redirects transports if hospital capacities become saturated.
    """
    reoptimization_log = []
    actions_taken = []
    now = datetime.utcnow()

    # 1. Fetch current system state
    emergencies = db.query(Emergency).filter(Emergency.status.in_(["PENDING", "ASSIGNED", "DISPATCHED"])).all()
    ambulances = db.query(Ambulance).all()
    teams = db.query(ResponseTeam).all()
    hospitals = db.query(Hospital).all()
    doctors = db.query(Doctor).all()
    active_assignments = db.query(Assignment).filter(Assignment.status.in_(["DISPATCHED", "EN_ROUTE", "ACTIVE"])).all()

    # 2. Recalculate dynamic priority scores for all active emergencies
    for em in emergencies:
        req_res = json.loads(em.required_resources) if isinstance(em.required_resources, str) else (em.required_resources or [])
        old_score = em.priority_score
        new_score, factors = calculate_priority_score(
            severity=em.severity,
            people_affected=em.people_affected,
            urgency_level=em.urgency_level,
            time_reported=em.time_reported,
            required_resources=req_res,
            patient_condition=em.patient_condition
        )
        em.priority_score = new_score
        em.priority_factors = json.dumps(factors)
        if abs(new_score - old_score) >= 5.0:
            actions_taken.append(f"Priority escalated for {em.id} ({em.title}): score updated from {old_score:.1f} to {new_score:.1f} due to {factors['summary']}")

    # Commit priority updates
    db.commit()

    # Re-sort emergencies by updated priority score descending
    emergencies.sort(key=lambda x: x.priority_score, reverse=True)

    # 3. Check and validate existing assignments
    for asg in active_assignments:
        em = db.query(Emergency).filter(Emergency.id == asg.emergency_id).first()
        if not em:
            continue

        assigned_amb = db.query(Ambulance).filter(Ambulance.id == asg.ambulance_id).first() if asg.ambulance_id else None
        assigned_team = db.query(ResponseTeam).filter(ResponseTeam.id == asg.response_team_id).first() if asg.response_team_id else None
        assigned_hosp = db.query(Hospital).filter(Hospital.id == asg.hospital_id).first() if asg.hospital_id else None

        # A) Check if assigned ambulance became unavailable/breakdown
        if assigned_amb and assigned_amb.status in ["UNAVAILABLE", "MAINTENANCE"]:
            old_call_sign = assigned_amb.call_sign
            old_amb_id = assigned_amb.id
            
            # Find assignments where resource_id = assigned_amb.id and invalidate
            asg.ambulance_id = None
            
            # Filter resources: status = AVAILABLE, capability matches, not assigned to another active emergency
            other_assigned_amb_ids = {
                a.ambulance_id for a in active_assignments 
                if a.id != asg.id and a.ambulance_id
            }
            available_ambs = [
                a for a in ambulances 
                if a.status == "AVAILABLE" 
                and a.id != old_amb_id 
                and a.id not in other_assigned_amb_ids
            ]

            # If all ambulances committed and emergency is CRITICAL, allow preemption of lower-priority non-critical assignment
            if not available_ambs and em.severity == "CRITICAL":
                lowest_asg = None
                lowest_score = em.priority_score
                for other_asg in active_assignments:
                    if other_asg.id != asg.id and other_asg.ambulance_id:
                        other_em = db.query(Emergency).filter(Emergency.id == other_asg.emergency_id).first()
                        if other_em and other_em.priority_score < lowest_score and other_em.severity != "CRITICAL":
                            lowest_score = other_em.priority_score
                            lowest_asg = other_asg
                if lowest_asg:
                    preempted_amb = db.query(Ambulance).filter(Ambulance.id == lowest_asg.ambulance_id).first()
                    if preempted_amb:
                        lowest_asg.ambulance_id = None
                        lowest_asg.reassignment_reason = f"Unit reallocated to higher-priority critical incident {em.id}."
                        available_ambs = [preempted_amb]

            # Re-run resource optimizer for em
            if available_ambs:
                new_amb, _, _, match_info = match_resources_for_emergency(
                    emergency=em,
                    available_ambulances=available_ambs,
                    available_response_teams=[],
                    hospitals=hospitals,
                    doctors=doctors
                )
                if new_amb:
                    asg.ambulance_id = new_amb.id
                    new_amb.status = "DISPATCHED"
                    new_amb.current_emergency_id = em.id
                    asg.distance_to_scene_km = match_info["amb_metrics"]["distance_km"]
                    asg.eta_to_scene_minutes = match_info["amb_metrics"]["duration_minutes"]
                    
                    # Exact required UI message:
                    asg.reassignment_reason = f"Assignment changed because {old_amb_id} became unavailable."
                    
                    # Update Route to scene
                    scene_route = db.query(Route).filter(Route.assignment_id == asg.id, Route.route_type == "RESOURCE_TO_SCENE").first()
                    if scene_route:
                        scene_route.origin_lat = new_amb.latitude
                        scene_route.origin_lng = new_amb.longitude
                        scene_route.waypoints_json = json.dumps(match_info["amb_metrics"]["waypoints"])
                        scene_route.distance_km = match_info["amb_metrics"]["distance_km"]
                        scene_route.duration_minutes = match_info["amb_metrics"]["duration_minutes"]
                        scene_route.is_rerouted = True
                        scene_route.reroute_reason = f"Assignment changed because {old_amb_id} became unavailable."

                    actions_taken.append(f"Assignment changed because {old_amb_id} became unavailable.")
                    
                    # Update decision timeline
                    timeline = json.loads(asg.decision_timeline) if isinstance(asg.decision_timeline, str) else []
                    timeline.append({
                        "time": now.strftime("%H:%M:%S"),
                        "action": "RESOURCE_REASSIGNED",
                        "detail": f"Assignment changed because {old_amb_id} became unavailable."
                    })
                    asg.decision_timeline = json.dumps(timeline)

                    # Log SystemEvent
                    db.add(SystemEvent(
                        timestamp=now,
                        event_type="RESOURCE_REASSIGNMENT",
                        severity="WARNING",
                        title=f"Assignment changed because {old_amb_id} became unavailable.",
                        description=f"Assignment changed because {old_amb_id} became unavailable. Dispatched replacement unit {new_amb.call_sign} ({new_amb.id}) to {em.id}.",
                        reason=f"Resource {old_amb_id} became unavailable.",
                        impact=f"New arrival ETA: {asg.eta_to_scene_minutes} minutes.",
                        emergency_id=em.id,
                        resource_id=new_amb.id
                    ))

        # B) Check Hospital Suitability (e.g. ICU filled up, hospital went on diversion)
        req_res = json.loads(em.required_resources) if isinstance(em.required_resources, str) else []
        needs_icu = em.severity.upper() in ["CRITICAL", "HIGH"] or any("icu" in r.lower() for r in req_res)
        
        if assigned_hosp and (assigned_hosp.status in ["DIVERSION", "FULL"] or (needs_icu and assigned_hosp.icu_beds_available <= 0)):
            # Hospital is no longer capable of receiving this high-acuity patient. Reroute!
            eligible_hospitals = [h for h in hospitals if h.id != assigned_hosp.id and h.status == "OPEN"]
            new_hosp, hosp_expl, _ = select_optimal_hospital(
                emergency_lat=em.latitude,
                emergency_lng=em.longitude,
                emergency_severity=em.severity,
                required_resources=req_res,
                patient_condition=em.patient_condition,
                hospitals=eligible_hospitals,
                doctors=doctors
            )
            if new_hosp:
                old_hosp_name = assigned_hosp.name
                asg.hospital_id = new_hosp.id
                asg.hospital_explanation = hosp_expl.get("summary", "")
                asg.distance_to_hospital_km = hosp_expl.get("distance_km", 0.0)
                asg.eta_to_hospital_minutes = hosp_expl.get("travel_time_min", 0.0)
                
                # Update route to hospital
                hosp_route = db.query(Route).filter(Route.assignment_id == asg.id, Route.route_type == "SCENE_TO_HOSPITAL").first()
                if hosp_route:
                    new_route_metrics = calculate_route_metrics(
                        origin=(em.latitude, em.longitude),
                        dest=(new_hosp.latitude, new_hosp.longitude)
                    )
                    hosp_route.destination_lat = new_hosp.latitude
                    hosp_route.destination_lng = new_hosp.longitude
                    hosp_route.waypoints_json = json.dumps(new_route_metrics["waypoints"])
                    hosp_route.distance_km = new_route_metrics["distance_km"]
                    hosp_route.duration_minutes = new_route_metrics["duration_minutes"]
                    hosp_route.is_rerouted = True
                    hosp_route.reroute_reason = f"Diverted from {old_hosp_name} due to saturated ICU capacity."

                actions_taken.append(
                    f"Hospital Diversion: Transport for {em.id} redirected from {old_hosp_name} to {new_hosp.name} "
                    f"({hosp_expl.get('icu_status')}, ETA {asg.eta_to_hospital_minutes}m)."
                )
                
                db.add(SystemEvent(
                    timestamp=now,
                    event_type="HOSPITAL_DIVERSION",
                    severity="CRITICAL",
                    title=f"Transport Redirected to {new_hosp.name}",
                    description=f"{old_hosp_name} ICU saturated. Emergency {em.id} redirected to {new_hosp.name}.",
                    reason=f"{old_hosp_name} ICU beds depleted (0 available).",
                    impact=f"Redirected transit ETA: {asg.eta_to_hospital_minutes} mins to Level 1 facility.",
                    emergency_id=em.id,
                    hospital_id=new_hosp.id
                ))

        # C) Check Traffic Conditions & Rerouting opportunities
        routes = db.query(Route).filter(Route.assignment_id == asg.id).all()
        for r in routes:
            should_reroute, reason, saved_time, new_dur = evaluate_rerouting_opportunity(
                current_distance_km=r.distance_km,
                current_traffic=r.traffic_level
            )
            if should_reroute and not r.is_rerouted:
                r.is_rerouted = True
                r.reroute_reason = reason
                r.duration_minutes = new_dur
                alt_waypoints = calculate_route_metrics(
                    origin=(r.origin_lat, r.origin_lng),
                    dest=(r.destination_lat, r.destination_lng),
                    traffic_level="MODERATE",
                    is_rerouted=True
                )["waypoints"]
                r.waypoints_json = json.dumps(alt_waypoints)
                
                if r.route_type == "RESOURCE_TO_SCENE":
                    asg.eta_to_scene_minutes = new_dur
                else:
                    asg.eta_to_hospital_minutes = new_dur

                actions_taken.append(f"Dynamic Traffic Reroute on Route {r.id}: {reason}")
                
                db.add(SystemEvent(
                    timestamp=now,
                    event_type="DYNAMIC_REROUTE",
                    severity="WARNING",
                    title="Dynamic Route Reroute Triggered",
                    description=reason,
                    reason=f"Severe congestion on primary corridor ({r.traffic_level}).",
                    impact=f"Saved {saved_time} minutes of critical response time.",
                    emergency_id=em.id
                ))

    # 4. Allocate resources for any unassigned pending emergencies
    pending_emergencies = [e for e in emergencies if e.status == "PENDING"]
    if pending_emergencies:
        # Determine already committed resources
        committed_amb_ids = {a.ambulance_id for a in db.query(Assignment).filter(Assignment.status.in_(["DISPATCHED", "EN_ROUTE", "ACTIVE"])).all() if a.ambulance_id}
        committed_team_ids = {a.response_team_id for a in db.query(Assignment).filter(Assignment.status.in_(["DISPATCHED", "EN_ROUTE", "ACTIVE"])).all() if a.response_team_id}

        for em in pending_emergencies:
            avail_ambs = [a for a in ambulances if a.status == "AVAILABLE" and a.id not in committed_amb_ids]
            avail_teams = [t for t in teams if t.status == "AVAILABLE" and t.id not in committed_team_ids]

            best_amb, best_team, best_hosp, expl = match_resources_for_emergency(
                emergency=em,
                available_ambulances=avail_ambs,
                available_response_teams=avail_teams,
                hospitals=hospitals,
                doctors=doctors
            )

            if best_amb or best_team:
                assignment_id = f"ASG-{em.id[2:] if em.id.startswith('E-') else em.id}"
                
                # Create Assignment
                asg = Assignment(
                    id=assignment_id,
                    emergency_id=em.id,
                    ambulance_id=best_amb.id if best_amb else None,
                    response_team_id=best_team.id if best_team else None,
                    hospital_id=best_hosp.id if best_hosp else None,
                    status="DISPATCHED",
                    assigned_at=now,
                    distance_to_scene_km=expl["amb_metrics"]["distance_km"] if best_amb else (expl["team_metrics"]["distance_km"] if best_team else 0.0),
                    eta_to_scene_minutes=expl["amb_metrics"]["duration_minutes"] if best_amb else (expl["team_metrics"]["duration_minutes"] if best_team else 0.0),
                    distance_to_hospital_km=expl["hospital_full_details"].get("distance_km", 0.0) if best_hosp else 0.0,
                    eta_to_hospital_minutes=expl["hospital_full_details"].get("travel_time_min", 0.0) if best_hosp else 0.0,
                    resource_explanation=expl["ambulance"] + (" " + expl["team"] if expl["team"] else ""),
                    hospital_explanation=expl["hospital"],
                    decision_timeline=json.dumps([
                        {"time": now.strftime("%H:%M:%S"), "action": "EMERGENCY_REPORTED", "detail": f"{em.title} reported"},
                        {"time": now.strftime("%H:%M:%S"), "action": "RESOURCE_OPTIMIZED", "detail": expl["ambulance"]},
                        {"time": now.strftime("%H:%M:%S"), "action": "HOSPITAL_SELECTED", "detail": expl["hospital"]}
                    ])
                )
                db.add(asg)

                # Create Route 1: Resource to Scene
                if best_amb:
                    r1 = Route(
                        id=f"R-SCENE-{em.id}",
                        assignment_id=assignment_id,
                        route_type="RESOURCE_TO_SCENE",
                        origin_lat=best_amb.latitude,
                        origin_lng=best_amb.longitude,
                        destination_lat=em.latitude,
                        destination_lng=em.longitude,
                        waypoints_json=json.dumps(expl["amb_metrics"]["waypoints"]),
                        distance_km=expl["amb_metrics"]["distance_km"],
                        duration_minutes=expl["amb_metrics"]["duration_minutes"],
                        traffic_level="MODERATE",
                        traffic_multiplier=1.25
                    )
                    db.add(r1)
                    best_amb.status = "DISPATCHED"
                    best_amb.current_emergency_id = em.id
                    committed_amb_ids.add(best_amb.id)

                # Create Route 2: Scene to Hospital
                if best_hosp:
                    hosp_metrics = calculate_route_metrics(
                        origin=(em.latitude, em.longitude),
                        dest=(best_hosp.latitude, best_hosp.longitude),
                        traffic_level="MODERATE"
                    )
                    r2 = Route(
                        id=f"R-HOSP-{em.id}",
                        assignment_id=assignment_id,
                        route_type="SCENE_TO_HOSPITAL",
                        origin_lat=em.latitude,
                        origin_lng=em.longitude,
                        destination_lat=best_hosp.latitude,
                        destination_lng=best_hosp.longitude,
                        waypoints_json=json.dumps(hosp_metrics["waypoints"]),
                        distance_km=hosp_metrics["distance_km"],
                        duration_minutes=hosp_metrics["duration_minutes"],
                        traffic_level="MODERATE",
                        traffic_multiplier=1.25
                    )
                    db.add(r2)

                if best_team:
                    best_team.status = "DISPATCHED"
                    best_team.current_emergency_id = em.id
                    committed_team_ids.add(best_team.id)

                em.status = "ASSIGNED"
                actions_taken.append(f"Optimized allocation for {em.id}: Dispatched {best_amb.call_sign if best_amb else ''} {best_team.name if best_team else ''} -> {best_hosp.name if best_hosp else ''}.")

                db.add(SystemEvent(
                    timestamp=now,
                    event_type="RESOURCE_DISPATCH",
                    severity="SUCCESS",
                    title=f"Optimized Response Dispatched for {em.id}",
                    description=f"{best_amb.call_sign if best_amb else ''} assigned. Receiving hospital: {best_hosp.name if best_hosp else 'TBD'}.",
                    reason=f"Priority queue score {em.priority_score:.1f}.",
                    impact=f"Estimated arrival on scene: {asg.eta_to_scene_minutes} mins.",
                    emergency_id=em.id,
                    resource_id=best_amb.id if best_amb else None,
                    hospital_id=best_hosp.id if best_hosp else None
                ))

    # Commit all transaction changes
    db.commit()

    return {
        "status": "COMPLETED",
        "timestamp": now.isoformat(),
        "trigger_reason": trigger_reason,
        "actions_taken": actions_taken,
        "active_emergencies_count": len(emergencies),
        "total_actions": len(actions_taken)
    }
