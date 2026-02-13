import React, { useEffect, useState } from 'react';
import { incidentAPI } from '../services/api';

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', severity: 'medium' });

  useEffect(() => {
    loadIncidents();
  }, []);

  const loadIncidents = async () => {
    try {
      const { data } = await incidentAPI.list();
      setIncidents(data.data || []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const createIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await incidentAPI.create(form);
      setShowCreate(false);
      setForm({ title: '', description: '', severity: 'medium' });
      loadIncidents();
    } catch {
      // handle error
    }
  };

  if (loading) return <div className="loading">Loading incidents...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h2>Incidents</h2>
        <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? 'Cancel' : 'New Incident'}
        </button>
      </div>

      {showCreate && (
        <div className="card">
          <h3>Create Incident</h3>
          <form onSubmit={createIncident}>
            <div className="form-group">
              <label>Title</label>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
            <div className="form-group">
              <label>Severity</label>
              <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary">Create</button>
          </form>
        </div>
      )}

      <div className="card">
        <table className="data-table">
          <thead><tr><th>Title</th><th>Severity</th><th>Status</th><th>Assigned To</th><th>Created</th></tr></thead>
          <tbody>
            {incidents.length === 0 && <tr><td colSpan={5} className="empty">No incidents</td></tr>}
            {incidents.map((inc: any) => (
              <tr key={inc.id}>
                <td>{inc.title}</td>
                <td><span className={`badge ${inc.severity}`}>{inc.severity}</span></td>
                <td><span className={`badge status-${inc.status}`}>{inc.status}</span></td>
                <td>{inc.assigned_to || '-'}</td>
                <td>{new Date(inc.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
