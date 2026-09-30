import json
from typing import List, Dict, Any, Tuple, Optional, Set
from .routing_engine import calculate_route_metrics, haversine_distance
from .hospital_engine import select_optimal_hospital

def match_resources_for_emergency(
    emergency,
    available_ambulances: List[Any],
    available_response_teams: List[Any],
    hospitals: List[Any],
    doctors: List[Any],
    traffic_level: str = "MODERATE"
) -> Tuple[Optional[Any], Optional[Any], Optional[Any], Dict[str, Any]]:
    """
    Intelligently assigns the most suitable ambulance, response team, and receiving hospital
    to an emergency, considering clinical requirements, capabilities, and transit times.
    """
    em_lat, em_lng = emergency.latitude, emergency.longitude
    req_res = emergency.required_resources
    if isinstance(req_res, str):
        try:
            req_res = json.loads(req_res)
        except Exception:
            req_res = []

    is_critical = emergency.severity.upper() in ["CRITICAL", "HIGH"]
    needs_heavy_rescue = any(r in ["Heavy Extraction", "Fire Unit", "HazMat"] for r in req_res) or "trapped" in (emergency.patient_condition or "").lower() or emergency.type in ["Factory Fire", "Building Collapse"]
    needs_als = is_critical or any("als" in r.lower() or "ventilator" in r.lower() or "cardiac" in r.lower() for r in req_res)

    best_ambulance = None
    ambulance_explanation = ""
    best_amb_metrics = None

    # Evaluate Ambulances
    if available_ambulances:
        scored_ambs = []
        for amb in available_ambulances:
            route = calculate_route_metrics(
                origin=(amb.latitude, amb.longitude),
                dest=(em_lat, em_lng),
                base_speed_kmh=amb.speed_kmh,
                traffic_level=traffic_level
            )
            score = 100.0
            reasons = []
            penalties = []

            # Clinical capability match
            is_amb_als = "ALS" in amb.type or "Mobile ICU" in amb.type
            if needs_als and not is_amb_als:
                score -= 35.0
                penalties.append("Basic Life Support (BLS) only - lacks Advanced Critical Care capability (-35 pts)")
            elif is_amb_als:
                score += 25.0
                reasons.append("Advanced Life Support (ALS) with critical care crew (+25 pts)")

            # Travel time penalty
            t_pen = round(route["duration_minutes"] * 1.5, 1)
            score -= t_pen
            reasons.append(f"Transit ETA: {route['duration_minutes']}m ({route['distance_km']} km)")

            scored_ambs.append({
                "ambulance": amb,
                "score": score,
                "route": route,
                "reasons": reasons,
                "penalties": penalties,
                "dist_km": route["distance_km"]
            })

        scored_ambs.sort(key=lambda x: x["score"], reverse=True)
        top_amb = scored_ambs[0]
        best_ambulance = top_amb["ambulance"]
        best_amb_metrics = top_amb["route"]

        # Explainability text
        bypassed = []
        for other in scored_ambs[1:2]:
            if other["dist_km"] < top_amb["dist_km"]:
                pen_text = ", ".join(other["penalties"]) if other["penalties"] else "lower capability index"
                bypassed.append(f"Closer unit {other['ambulance'].call_sign} was bypassed because: {pen_text}.")

        ambulance_explanation = (
            f"Assigned {best_ambulance.call_sign} ({best_ambulance.type}): "
            f"ETA {best_amb_metrics['duration_minutes']} min, {best_amb_metrics['distance_km']} km away. "
            f"{' '.join(top_amb['reasons'][:2])}. "
            + (" ".join(bypassed) if bypassed else "")
        )

    # Evaluate Response Teams (if required or helpful)
    best_team = None
    team_explanation = ""
    best_team_metrics = None

    if needs_heavy_rescue and available_response_teams:
        scored_teams = []
        for team in available_response_teams:
            route = calculate_route_metrics(
                origin=(team.latitude, team.longitude),
                dest=(em_lat, em_lng),
                base_speed_kmh=45.0,
                traffic_level=traffic_level
            )
            score = 100.0
            reasons = []

            # Check specialty match
            specs = team.specialties if isinstance(team.specialties, list) else json.loads(team.specialties or "[]")
            if any(s.lower() in emergency.type.lower() or s.lower() in (emergency.patient_condition or "").lower() for s in specs):
                score += 30.0
                reasons.append(f"Direct specialty match in rescue capabilities (+30 pts)")

            time_pen = round(route["duration_minutes"] * 1.2, 1)
            score -= time_pen
            reasons.append(f"ETA: {route['duration_minutes']}m ({route['distance_km']} km)")

            scored_teams.append({
                "team": team,
                "score": score,
                "route": route,
                "reasons": reasons
            })

        scored_teams.sort(key=lambda x: x["score"], reverse=True)
        best_team_record = scored_teams[0]
        best_team = best_team_record["team"]
        best_team_metrics = best_team_record["route"]
        team_explanation = (
            f"Dispatched specialized team {best_team.name}: "
            f"ETA {best_team_metrics['duration_minutes']} min. {', '.join(best_team_record['reasons'])}."
        )

    # Optimal Hospital Selection
    selected_hospital, hosp_expl, _ = select_optimal_hospital(
        emergency_lat=em_lat,
        emergency_lng=em_lng,
        emergency_severity=emergency.severity,
        required_resources=req_res,
        patient_condition=emergency.patient_condition,
        hospitals=hospitals,
        doctors=doctors,
        traffic_level=traffic_level
    )

    combined_explanation = {
        "ambulance": ambulance_explanation,
        "team": team_explanation,
        "hospital": hosp_expl.get("summary", ""),
        "hospital_full_details": hosp_expl,
        "amb_metrics": best_amb_metrics,
        "team_metrics": best_team_metrics
    }

    return best_ambulance, best_team, selected_hospital, combined_explanation
