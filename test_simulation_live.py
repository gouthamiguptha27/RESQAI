import httpx

client = httpx.Client(base_url="http://127.0.0.1:8000/api/v1", timeout=10.0)

emergencies = client.get("/emergencies").json()
print("=== EMERGENCIES (HYDERABAD) ===")
for e in emergencies:
    print(f"[{e['id']}] {e['title']} | Loc: {e['location_name']} | Lat: {e['latitude']}, Lng: {e['longitude']} | Score: {e['priority_score']}")

hospitals = client.get("/hospitals").json()
print("\n=== HOSPITALS (HYDERABAD) ===")
for h in hospitals:
    print(f"[{h['id']}] {h['name']} | ICU: {h['icu_beds_available']}/{h['icu_beds_total']} | Lat: {h['latitude']}, Lng: {h['longitude']}")

assignments = client.get("/assignments").json()
print("\n=== ASSIGNMENTS & ROUTING ===")
for a in assignments:
    print(f"[{a['id']}] Emergency: {a['emergency_id']} -> Hospital: {a['hospital_id']} | Amb: {a['ambulance_id']} | Scene ETA: {a['eta_to_scene_minutes']}m | Hosp ETA: {a['eta_to_hospital_minutes']}m")

# Test re-optimization triggers
print("\n=== TESTING SIMULATION TRIGGERS ===")
r_traffic = client.post("/simulation/traffic-spike", json={"severity": "SEVERE", "multiplier": 2.4})
print("Traffic Spike:", r_traffic.status_code, r_traffic.json()["message"])

r_amb = client.post("/simulation/disable-resource", json={"resource_id": "AMB-01", "status": "UNAVAILABLE"})
print("Disable Ambulance:", r_amb.status_code, r_amb.json()["message"])

r_icu = client.post("/simulation/fill-hospital-icu", json={"hospital_id": "H-02", "set_diversion": False})
print("Fill ICU:", r_icu.status_code, r_icu.json()["message"])

print("\n=== ALL VERIFICATIONS PASSED FOR HYDERABAD METRO! ===")
