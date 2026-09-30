import React, { useState } from 'react';
import { X, PlusCircle, AlertTriangle, MapPin, Users, HeartPulse } from 'lucide-react';
import { api } from '../api/client';

export function CreateEmergencyModal({ isOpen, onClose, onCreated }) {
  if (!isOpen) return null;

  const [title, setTitle] = useState('');
  const [type, setType] = useState('Multi-Vehicle Collision');
  const [severity, setSeverity] = useState('HIGH');
  const [peopleAffected, setPeopleAffected] = useState(2);
  const [condition, setCondition] = useState('');
  const [locationName, setLocationName] = useState('Punjagutta Junction / Somajiguda, Hyderabad');
  const [latitude, setLatitude] = useState(17.4220);
  const [longitude, setLongitude] = useState(78.4520);
  const [urgency, setUrgency] = useState('HIGH');
  const [selectedResources, setSelectedResources] = useState(['Ambulance', 'Trauma Surgeon']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableResourceTags = [
    'Ambulance',
    'Heavy Extraction',
    'HazMat',
    'Fire Unit',
    'Trauma Surgeon',
    'Cardiologist',
    'Burn Specialist',
    'ICU Bed',
    'Ventilator',
    'ECMO'
  ];

  const toggleResource = (tag) => {
    if (selectedResources.includes(tag)) {
      setSelectedResources(selectedResources.filter((r) => r !== tag));
    } else {
      setSelectedResources([...selectedResources, tag]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        title,
        type,
        severity,
        people_affected: Number(peopleAffected),
        patient_condition: condition,
        latitude: Number(latitude),
        longitude: Number(longitude),
        location_name: locationName,
        urgency_level: urgency,
        required_resources: selectedResources
      };

      const res = await api.createEmergency(payload);
      onCreated(res);
      onClose();
    } catch (err) {
      alert('Error creating incident: ' + (err.response?.data?.detail || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-ops-surface border border-ops-border rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="p-4 border-b border-ops-border flex items-center justify-between bg-ops-surfaceLight/80">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-red-500" />
            <h2 className="font-mono text-base font-bold text-white">Manual Emergency Incident Intake</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-mono mb-1">Incident Headline / Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. [SIMULATED] Multi-Vehicle Incident at Jubilee Hills Checkpost"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-ops-border text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-mono mb-1">Emergency Category</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-ops-border text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="Multi-Vehicle Collision">Multi-Vehicle Collision</option>
                <option value="Cardiac Arrest">Cardiac Arrest / STEMI</option>
                <option value="Factory Fire">Factory / Chemical Fire</option>
                <option value="Building Collapse">Building Collapse / Structural</option>
                <option value="Severe Trauma">Severe Trauma / Penetrating</option>
                <option value="Stroke">Acute Ischemic Stroke</option>
                <option value="Respiratory Failure">Acute Respiratory Failure</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-mono mb-1">Triage Severity Level</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-ops-border text-white font-bold focus:outline-none focus:border-cyan-500"
              >
                <option value="CRITICAL" className="text-red-400">CRITICAL (Immediate Life Threat)</option>
                <option value="HIGH" className="text-amber-400">HIGH (Urgent Care Needed)</option>
                <option value="MEDIUM" className="text-yellow-400">MEDIUM (Semi-Urgent)</option>
                <option value="LOW" className="text-emerald-400">LOW (Non-Urgent)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-mono mb-1">Casualties / Affected Count</label>
              <input
                type="number"
                min="1"
                max="50"
                value={peopleAffected}
                onChange={(e) => setPeopleAffected(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-ops-border text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-mono mb-1">Estimated Urgency Window</label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-ops-border text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="EXTREME">EXTREME (Minutes Matter)</option>
                <option value="HIGH">HIGH (Under 15 Mins)</option>
                <option value="MODERATE">MODERATE (Under 30 Mins)</option>
                <option value="LOW">LOW (Standard)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-mono mb-1">Location Name / Sector</label>
            <input
              type="text"
              required
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-ops-border text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-mono mb-1">Patient Clinical Condition Description</label>
            <textarea
              rows="2"
              placeholder="e.g. 2 passengers pinned in sedan, active arterial bleed, unconscious with head trauma"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-ops-border text-white focus:outline-none focus:border-cyan-500"
            ></textarea>
          </div>

          {/* Required Resources Tags */}
          <div>
            <label className="block text-slate-300 font-mono mb-1.5">Required Clinical & Tactical Resources</label>
            <div className="flex flex-wrap gap-1.5">
              {availableResourceTags.map((tag) => {
                const isSelected = selectedResources.includes(tag);
                return (
                  <button
                    type="button"
                    key={tag}
                    onClick={() => toggleResource(tag)}
                    className={`px-2.5 py-1 rounded-md text-xs font-mono transition border ${
                      isSelected
                        ? 'bg-cyan-950 text-cyan-300 border-cyan-700 font-bold'
                        : 'bg-slate-900 text-slate-400 border-ops-border hover:text-white'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-ops-border flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold flex items-center gap-1.5 disabled:opacity-50"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{isSubmitting ? 'Optimizing...' : 'Intake & Dispatch'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
