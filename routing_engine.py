import math
import random
from typing import List, Tuple, Dict, Any

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance between two points on the earth in kilometers.
    """
    R = 6371.0 # Radius of earth in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)

def generate_urban_waypoints(
    origin: Tuple[float, float],
    dest: Tuple[float, float],
    alternate: bool = False
) -> List[List[float]]:
    """
    Generates realistic urban street-grid waypoints between origin and destination.
    Simulates turning through major avenue and street corridors rather than an unrealistic straight line.
    """
    lat1, lon1 = origin
    lat2, lon2 = dest
    
    waypoints = [[lat1, lon1]]
    
    # Calculate intermediate corner turning points (simulating arterial street grid)
    delta_lat = lat2 - lat1
    delta_lon = lon2 - lon1
    
    num_segments = 5
    for i in range(1, num_segments):
        t = i / float(num_segments)
        
        # Add subtle natural curve/detour representative of city blocks
        # If alternate route is requested (bypass), take a wider boulevard arc
        if alternate:
            lateral_offset = math.sin(t * math.pi) * 0.006 * (-1 if delta_lon > 0 else 1)
        else:
            lateral_offset = math.sin(t * math.pi) * 0.0015
            
        mid_lat = lat1 + t * delta_lat + lateral_offset
        mid_lon = lon1 + t * delta_lon + (lateral_offset * 0.5)
        waypoints.append([round(mid_lat, 6), round(mid_lon, 6)])
        
    waypoints.append([lat2, lon2])
    return waypoints

def calculate_route_metrics(
    origin: Tuple[float, float],
    dest: Tuple[float, float],
    base_speed_kmh: float = 48.0,
    traffic_level: str = "MODERATE",
    is_rerouted: bool = False
) -> Dict[str, Any]:
    """
    Calculates distance, ETA, waypoints, and traffic multipliers for emergency responders.
    """
    dist_km = haversine_distance(origin[0], origin[1], dest[0], dest[1])
    # Road network factor (streets are ~1.28x Euclidean distance)
    actual_road_km = round(max(0.5, dist_km * 1.28), 2)
    
    traffic_multipliers = {
        "LOW": 1.0,
        "MODERATE": 1.25,
        "HEAVY": 1.85,
        "SEVERE": 2.6,
        "GRIDLOCK": 3.4
    }
    multiplier = traffic_multipliers.get(traffic_level.upper(), 1.25)
    
    # Base travel time in minutes = (distance / speed) * 60
    base_minutes = (actual_road_km / max(20.0, base_speed_kmh)) * 60.0
    effective_minutes = round(base_minutes * multiplier, 1)
    
    waypoints = generate_urban_waypoints(origin, dest, alternate=is_rerouted)
    
    return {
        "distance_km": actual_road_km,
        "duration_minutes": effective_minutes,
        "traffic_level": traffic_level.upper(),
        "traffic_multiplier": multiplier,
        "waypoints": waypoints,
        "is_rerouted": is_rerouted
    }

def evaluate_rerouting_opportunity(
    current_distance_km: float,
    current_traffic: str,
    base_speed_kmh: float = 48.0
) -> Tuple[bool, str, float, float]:
    """
    Determines if dynamic traffic conditions justify switching to an alternate bypass corridor.
    Returns: (should_reroute: bool, reason: str, time_saved_min: float, new_duration_min: float)
    """
    if current_traffic.upper() in ["HEAVY", "SEVERE", "GRIDLOCK"]:
        # Primary corridor congested:
        traffic_multipliers = {"HEAVY": 1.85, "SEVERE": 2.6, "GRIDLOCK": 3.4}
        curr_mult = traffic_multipliers.get(current_traffic.upper(), 2.0)
        curr_duration = (current_distance_km / base_speed_kmh) * 60.0 * curr_mult
        
        # Alternate bypass is slightly longer in distance (+15%) but operates with MODERATE traffic (1.25x)
        alt_distance = current_distance_km * 1.15
        alt_duration = (alt_distance / base_speed_kmh) * 60.0 * 1.25
        
        time_saved = round(curr_duration - alt_duration, 1)
        if time_saved >= 3.0: # Significant time savings threshold
            reason = (f"Traffic spike ({current_traffic}) on primary arterial road. "
                      f"Rerouted via Boulevard Bypass: saves {time_saved} minutes (ETA reduced from {round(curr_duration,1)}m to {round(alt_duration,1)}m).")
            return True, reason, time_saved, round(alt_duration, 1)
            
    return False, "", 0.0, 0.0
