import httpx

client = httpx.Client(base_url="http://127.0.0.1:8000/api/v1", timeout=10.0)

print("=== STEP 0: Resetting Demo Scenario to Clean Baseline ===")
r_reset = client.post("/simulation/reset")
print("Reset status:", r_reset.status_code)

print("\n=== STEP 1: Verifying BEFORE State ===")
ambs = client.get("/resources/ambulances").json()
amb_01 = next(a for a in ambs if a["id"] == "AMB-01")
print(f"AMB-01 Status: {amb_01['status']} (Expected: DISPATCHED / ASSIGNED)")

asgs = client.get("/assignments").json()
asg_101 = next(a for a in asgs if a["emergency_id"] == "E-101")
print(f"E-101 Assignment: Ambulance={asg_101['ambulance_id']} (Expected: AMB-01)")

assert asg_101["ambulance_id"] == "AMB-01", f"Expected AMB-01 assigned to E-101, got {asg_101['ambulance_id']}"
assert amb_01["status"] in ["DISPATCHED", "ASSIGNED"], f"Expected AMB-01 to be assigned, got {amb_01['status']}"
print(">>> BEFORE STATE VERIFIED: AMB-01 = ASSIGNED, E-101 = ASSIGNED to AMB-01 <<<")

print("\n=== STEP 2: Trigger EVENT: Disable AMB-01 ===")
r_disable = client.post("/simulation/disable-resource", json={"resource_id": "AMB-01", "status": "UNAVAILABLE"})
print("Disable response:", r_disable.status_code, r_disable.json()["message"])

print("\n=== STEP 3: Verifying AFTER State ===")
ambs_after = client.get("/resources/ambulances").json()
amb_01_after = next(a for a in ambs_after if a["id"] == "AMB-01")
print(f"AMB-01 Status: {amb_01_after['status']} (Expected: UNAVAILABLE)")
assert amb_01_after["status"] == "UNAVAILABLE"

asgs_after = client.get("/assignments").json()
asg_101_after = next(a for a in asgs_after if a["emergency_id"] == "E-101")
replacement_resource = asg_101_after["ambulance_id"]
print(f"E-101 Assignment: Ambulance={replacement_resource} (Replacement unit)")
print(f"Reassignment Reason: '{asg_101_after['reassignment_reason']}'")
print(f"New Arrival ETA to Scene: {asg_101_after['eta_to_scene_minutes']} mins")

assert replacement_resource != "AMB-01", "Replacement resource must not be AMB-01"
assert asg_101_after["reassignment_reason"] == "Assignment changed because AMB-01 became unavailable."
print(">>> AFTER STATE VERIFIED: AMB-01 = UNAVAILABLE, E-101 = ASSIGNED to replacement resource <<<")

print("\n=== STEP 4: Verifying UI / SystemEvent Message ===")
events = client.get("/events?limit=5").json()
top_event = events[0]
print(f"Top SystemEvent Title: '{top_event['title']}'")
print(f"Top SystemEvent Description: '{top_event['description']}'")

assert "Assignment changed because AMB-01 became unavailable." in top_event["title"] or \
       "Assignment changed because AMB-01 became unavailable." in top_event["description"]

print("\n=======================================================")
print("SUCCESS: ALL STATE TRANSITION REQUIREMENTS FULLY MET!")
print("UI MESSAGE CONFIRMED:")
print('  "Assignment changed because AMB-01 became unavailable."')
print("=======================================================")
