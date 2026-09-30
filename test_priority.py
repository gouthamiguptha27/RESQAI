import pytest
from datetime import datetime, timedelta
from ..optimization.priority_engine import calculate_priority_score

def test_critical_severity_scores_higher_than_low():
    now = datetime.utcnow()
    crit_score, crit_factors = calculate_priority_score(
        severity="CRITICAL",
        people_affected=4,
        urgency_level="EXTREME",
        time_reported=now,
        required_resources=["Ambulance", "Trauma Surgeon"]
    )
    
    low_score, low_factors = calculate_priority_score(
        severity="LOW",
        people_affected=1,
        urgency_level="LOW",
        time_reported=now,
        required_resources=["Ambulance"]
    )
    
    assert crit_score > low_score
    assert crit_score >= 80.0
    assert low_score <= 35.0
    assert "Base Severity: CRITICAL" in str(crit_factors["explanation_points"])

def test_people_affected_increases_priority():
    now = datetime.utcnow()
    score_1, _ = calculate_priority_score(
        severity="HIGH",
        people_affected=1,
        urgency_level="HIGH",
        time_reported=now,
        required_resources=["Ambulance"]
    )
    score_6, _ = calculate_priority_score(
        severity="HIGH",
        people_affected=6,
        urgency_level="HIGH",
        time_reported=now,
        required_resources=["Ambulance"]
    )
    assert score_6 > score_1
    assert (score_6 - score_1) >= 15.0 # Significant bump for mass casualties

def test_queue_starvation_prevention():
    now = datetime.utcnow()
    fresh_time = now
    stale_time = now - timedelta(minutes=15)
    
    score_fresh, fresh_factors = calculate_priority_score(
        severity="MEDIUM",
        people_affected=1,
        urgency_level="MODERATE",
        time_reported=fresh_time,
        required_resources=["Ambulance"]
    )
    score_waiting, wait_factors = calculate_priority_score(
        severity="MEDIUM",
        people_affected=1,
        urgency_level="MODERATE",
        time_reported=stale_time,
        required_resources=["Ambulance"]
    )
    
    assert score_waiting > score_fresh
    assert wait_factors["wait_score"] > 0
    assert "Queue Wait Penalty" in str(wait_factors["explanation_points"])
