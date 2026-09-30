import json
from datetime import datetime
from typing import Dict, Any, Tuple

def calculate_priority_score(
    severity: str,
    people_affected: int,
    urgency_level: str,
    time_reported: datetime,
    required_resources: list,
    patient_condition: str = None
) -> Tuple[float, Dict[str, Any]]:
    """
    Transparent, explainable multi-criteria priority scoring algorithm.
    Returns: (total_score: float, factors_breakdown: dict)
    """
    # 1. Base Severity Score (Max 45)
    severity_weights = {
        "CRITICAL": 45.0,
        "HIGH": 32.0,
        "MEDIUM": 20.0,
        "LOW": 10.0
    }
    sev_key = severity.upper() if severity else "MEDIUM"
    base_sev_score = severity_weights.get(sev_key, 20.0)

    # 2. People Affected Factor (Max 25)
    # Scaled logarithmically/stepwise: 1 person = 5pts, 2 = 10pts, 3-5 = 18pts, 6+ = 25pts
    if people_affected <= 1:
        people_score = 5.0
    elif people_affected == 2:
        people_score = 10.0
    elif people_affected <= 5:
        people_score = 18.0
    else:
        people_score = 25.0

    # 3. Urgency / Time Sensitivity (Max 18)
    urgency_weights = {
        "EXTREME": 18.0,
        "HIGH": 12.0,
        "MODERATE": 7.0,
        "LOW": 3.0
    }
    urg_key = urgency_level.upper() if urgency_level else "HIGH"
    urgency_score = urgency_weights.get(urg_key, 10.0)

    # 4. Starvation Prevention / Elapsed Time Penalty (Max 12)
    # Emergencies waiting longer gain score to avoid queue starvation
    now = datetime.utcnow()
    wait_minutes = 0.0
    if time_reported:
        delta = now - time_reported
        wait_minutes = max(0.0, delta.total_seconds() / 60.0)
    
    # 0.5 points per minute of waiting, capped at 12
    wait_score = min(12.0, round(wait_minutes * 0.5, 1))

    # 5. Resource Scarcity & Patient Criticality Adjustment
    scarcity_bonus = 0.0
    condition_lower = (patient_condition or "").lower()
    critical_keywords = ["unconscious", "hemorrhage", "burn", "trapped", "cardiac", "stroke", "asphyxia", "arterial"]
    if any(k in condition_lower for k in critical_keywords):
        scarcity_bonus += 5.0

    if any(r in ["Burn Specialist", "Heavy Extraction", "ECMO", "Trauma Surgeon"] for r in (required_resources or [])):
        scarcity_bonus += 4.0

    # Total Score calculation (Capped at 100.0)
    raw_total = base_sev_score + people_score + urgency_score + wait_score + scarcity_bonus
    total_score = min(100.0, round(raw_total, 1))

    # Detailed Explainability Breakdown
    explanation_points = [
        f"Base Severity: {sev_key} ({base_sev_score:.1f} pts)",
        f"Affected Scale: {people_affected} person(s) affected ({people_score:.1f} pts)",
        f"Time Sensitivity: {urg_key} ({urgency_score:.1f} pts)"
    ]
    if wait_minutes > 1.0:
        explanation_points.append(f"Queue Wait Penalty: Waiting {wait_minutes:.1f}m (+{wait_score:.1f} pts starvation safeguard)")
    if scarcity_bonus > 0:
        explanation_points.append(f"Criticality/Scarcity Bonus: Severe physiological factors detected (+{scarcity_bonus:.1f} pts)")

    factors = {
        "severity_score": base_sev_score,
        "people_score": people_score,
        "urgency_score": urgency_score,
        "wait_score": wait_score,
        "wait_minutes": round(wait_minutes, 1),
        "scarcity_bonus": scarcity_bonus,
        "total_score": total_score,
        "explanation_points": explanation_points,
        "summary": f"Prioritized at {total_score}/100 based on {sev_key} severity with {people_affected} casualty impact and {urg_key} clinical urgency."
    }

    return total_score, factors
