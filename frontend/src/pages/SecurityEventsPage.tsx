import React, { useEffect, useState } from 'react';
import { securityAPI } from '../services/api';

export default function SecurityEventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
    const interval = setInterval(loadEvents, 15000);
    return () => clearInterval(interval);
  }, []);

  const loadEvents = async () => {
    try {
      const { data } = await securityAPI.getMonitoring();
      setEvents(data.data.securityEvents || []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading events...</div>;

  return (
    <div className="page">
      <h2>Security Events</h2>
      <div className="card">
        <table className="data-table">
          <thead>
            <tr><th>ID</th><th>Type</th><th>Severity</th><th>Description</th><th>Source</th><th>User</th><th>Time</th></tr>
          </thead>
          <tbody>
            {events.length === 0 && (
              <tr><td colSpan={7} className="empty">No events found</td></tr>
            )}
            {events.map((evt: any, i: number) => (
              <tr key={i}>
                <td>{evt.id}</td>
                <td>{evt.type}</td>
                <td><span className={`badge ${evt.severity?.toLowerCase()}`}>{evt.severity}</span></td>
                <td>{evt.description}</td>
                <td>{evt.source}</td>
                <td>{evt.user || '-'}</td>
                <td>{new Date(evt.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
