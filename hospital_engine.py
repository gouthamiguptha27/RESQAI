import json
from typing import List, Dict, Any, Tuple, Optional
from .routing_engine import haversine_distance, calculate_route_metrics

def select_optimal_hospital(
    emergency_lat: float,
    emergency_lng: float,
    emergency_severity: str,
    required_resources: List[str],
    patient_condition: str,
    hospitals: list,
    doctors: list,
    traffic_level: str = "MODERATE"
) -> Tuple[Optional[Any], Dict[str, Any], List[Dict[str, Any]]]:
    """
    Evaluates candidate hospitals using a multi-criteria utility function.
    Balances clinical capability match, ICU/ER bed availability, specialist presence,
    and transit time, explicitly avoiding naive nearest-hospital selection.
    
    Returns:
        (best_hospital, explanation_dict, all_hospital_evaluations)
    """
    if not hospitals:
        return None, {"error": "No hospitals available"}, []

    is_critical = emergency_severity.upper() in ["CRITICAL", "HIGH"]
    needs_icu = is_critical or any("icu" in r.lower() for r in required_resources)

    # Extract required specialties
    specialty_keywords = ["Trauma Surgeon", "Cardiologist", "Neurologist", "Burn Specialist", "Intensivist"]
    required_specialists = [s for s in specialty_keywords if any(s.lower() in r.lower() for r in required_resources)]
    if is_critical and not required_specialists:
        required_specialists = ["Trauma Surgeon"]

    evaluations = []

    for hosp in hospitals:
        # 1. Routing & Distance
        route_info = calculate_route_metrics(
            origin=(emergency_lat, emergency_lng),
            dest=(hosp.latitude, hosp.longitude),
            traffic_level=traffic_level
        )
        travel_time_min = route_info["duration_minutes"]
        dist_km = route_info["distance_km"]

        # Parse hospital specialties & equipment if stored as JSON text
        hosp_specs = hosp.specialties if isinstance(hosp.specialties, list) else json.loads(hosp.specialties or "[]")
        hosp_equip = hosp.equipment if isinstance(hosp.equipment, list) else json.loads(hosp.equipment or "[]")

        # Doctors available at this hospital
        hosp_doctors = [
            d for d in doctors 
            if d.hospital_id == hosp.id and d.status == "AVAILABLE"
        ]
        available_specialties = [d.specialty for d in hosp_doctors] + hosp_specs

        # Scoring metrics
        score = 100.0
        reasons = []
        penalties = []

        # Diversion / Status check
        if hosp.status == "DIVERSION":
            score -= 80.0
            penalties.append("Hospital is on DIVERSION protocol (-80 pts)")
        elif hosp.status == "FULL":
            score -= 100.0
            penalties.append("Hospital is completely at CAPACITY (-100 pts)")

        # ICU Capacity Check
        icu_avail = hosp.icu_beds_available
        if needs_icu:
            if icu_avail <= 0:
                score -= 75.0
                penalties.append("CRITICAL DEFICIT: No ICU beds available for high-acuity patient (-75 pts)")
            else:
                score += 30.0
                reasons.append(f"ICU Bed available ({icu_avail}/{hosp.icu_beds_total} open, +30 pts)")
        else:
            if icu_avail > 0:
                score += 10.0

        # ER Load Check
        er_utilization = hosp.er_capacity_occupied / max(1, hosp.er_capacity_total)
        if er_utilization < 0.6:
            score += 15.0
            reasons.append(f"Low ER load ({int(er_utilization*100)}% occupied, +15 pts)")
        elif er_utilization >= 0.9:
            score -= 20.0
            penalties.append(f"High ER overcrowding ({int(er_utilization*100)}% occupied, -20 pts)")

        # Specialist Match
        for req_spec in required_specialists:
            if req_spec in available_specialties:
                score += 35.0
                reasons.append(f"Required specialist available: {req_spec} on-duty (+35 pts)")
            else:
                score -= 30.0
                penalties.append(f"Missing required specialist: {req_spec} unavailable (-30 pts)")

        # Equipment Match
        for req_item in required_resources:
            if req_item in hosp_equip:
                score += 15.0
                reasons.append(f"Equipped with {req_item} (+15 pts)")

        # Travel Time Penalty: -1.2 pts per minute of transit
        time_penalty = round(travel_time_min * 1.2, 1)
        score -= time_penalty
        reasons.append(f"Estimated transit: {travel_time_min} mins / {dist_km} km (-{time_penalty} pts transit cost)")

        evaluations.append({
            "hospital_id": hosp.id,
            "hospital_name": hosp.name,
            "trauma_level": hosp.trauma_level,
            "score": round(score, 1),
            "travel_time_min": travel_time_min,
            "dist_km": dist_km,
            "icu_available": icu_avail,
            "icu_total": hosp.icu_beds_total,
            "er_utilization_pct": int(er_utilization * 100),
            "reasons": reasons,
            "penalties": penalties,
            "hospital_obj": hosp,
            "route_info": route_info
        })

    # Sort evaluations by score descending
    evaluations.sort(key=lambda x: x["score"], reverse=True)
    best_eval = evaluations[0]
    best_hospital = best_eval["hospital_obj"]

    # Generate explainability comparison
    bypassed_explanations = []
    for other in evaluations[1:3]:
        diff_dist = round(other["dist_km"] - best_eval["dist_km"], 1)
        if diff_dist < 0: # other was closer
            reasons_why_bypassed = ", ".join(other["penalties"][:2]) if other["penalties"] else "lower resource score"
            bypassed_explanations.append(
                f"Closer facility {other['hospital_name']} ({abs(diff_dist)} km closer) was bypassed due to: {reasons_why_bypassed}."
            )

    explanation = {
        "selected_hospital_id": best_hospital.id,
        "selected_hospital_name": best_hospital.name,
        "suitability_score": best_eval["score"],
        "travel_time_min": best_eval["travel_time_min"],
        "distance_km": best_eval["dist_km"],
        "icu_status": f"{best_eval['icu_available']}/{best_eval['icu_total']} ICU beds available",
        "key_reasons": best_eval["reasons"],
        "penalties_incurred": best_eval["penalties"],
        "bypassed_facilities": bypassed_explanations,
        "summary": (
            f"{best_hospital.name} selected (Score {best_eval['score']}): "
            f"{best_eval['icu_available']} ICU beds open, matching emergency clinical requirements with {best_eval['travel_time_min']}m ETA. "
            + (" ".join(bypassed_explanations) if bypassed_explanations else "")
        )
    }

    return best_hospital, explanation, evaluations
