import React, { useEffect, useState } from 'react';
import { healthAPI, securityAPI, analyticsAPI } from '../services/api';

interface SummaryData {
  events: Record<string, number>;
  threats: Record<string, number>;
  vulnerabilities: Record<string, number>;
}

export default function DashboardPage() {
  const [health, setHealth] = useState<any>(null);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [monitoring, setMonitoring] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [healthRes, summaryRes, monitorRes] = await Promise.allSettled([
        healthAPI.check(),
        analyticsAPI.getSummary(),
        securityAPI.getMonitoring(),
      ]);
      if (healthRes.status === 'fulfilled') setHealth(healthRes.value.data.data);
      if (summaryRes.status === 'fulfilled') setSummary(summaryRes.value.data.data);
      if (monitorRes.status === 'fulfilled') setMonitoring(monitorRes.value.data.data);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading dashboard...</div>;

  return (
    <div className="page">
      <h2>Security Dashboard</h2>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>System Status</h3>
          <div className={`status-badge ${health?.status || 'unknown'}`}>{health?.status?.toUpperCase() || 'UNKNOWN'}</div>
          <p>Uptime: {Math.floor((health?.uptime || 0) / 3600)}h</p>
        </div>
        <div className="stat-card">
          <h3>Active Threats</h3>
          <div className="stat-number">{monitoring?.activeThreats ?? summary?.threats?.['active'] ?? 0}</div>
        </div>
        <div className="stat-card">
          <h3>Blocked Attacks</h3>
          <div className="stat-number">{monitoring?.blockedAttacks ?? 0}</div>
        </div>
        <div className="stat-card">
          <h3>Open Vulnerabilities</h3>
          <div className="stat-number">
            {Object.values(summary?.vulnerabilities || {}).reduce((a: number, b: any) => a + Number(b), 0)}
          </div>
        </div>
      </div>

      <div className="cards-row">
        <div className="card">
          <h3>Services Health</h3>
          <div className="services-list">
            {health?.services && Object.entries(health.services).map(([name, svc]: [string, any]) => (
              <div key={name} className="service-row">
                <span>{name}</span>
                <span className={`status-dot ${svc.status}`}>{svc.status}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <h3>Events by Severity</h3>
          <div className="severity-bars">
            {summary?.events && Object.entries(summary.events).map(([severity, count]) => (
              <div key={severity} className="severity-row">
                <span className={`severity-label ${severity}`}>{severity}</span>
                <div className="severity-bar">
                  <div className={`severity-fill ${severity}`} style={{ width: `${Math.min(Number(count) * 10, 100)}%` }} />
                </div>
                <span>{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {monitoring?.securityEvents && (
        <div className="card">
          <h3>Recent Security Events</h3>
          <table className="data-table">
            <thead>
              <tr><th>Type</th><th>Severity</th><th>Description</th><th>Source</th><th>Time</th></tr>
            </thead>
            <tbody>
              {monitoring.securityEvents.map((evt: any, i: number) => (
                <tr key={i}>
                  <td>{evt.type}</td>
                  <td><span className={`badge ${evt.severity?.toLowerCase()}`}>{evt.severity}</span></td>
                  <td>{evt.description}</td>
                  <td>{evt.source}</td>
                  <td>{new Date(evt.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
