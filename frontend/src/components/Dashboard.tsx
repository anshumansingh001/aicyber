import React, { useState, useEffect } from 'react';
import './Dashboard.css';

interface SecurityStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  services: {
    database: { status: string };
    redis: { status: string };
    ai: { status: string };
  };
}

const Dashboard: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<SecurityStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHealthStatus();
    const interval = setInterval(fetchHealthStatus, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchHealthStatus = async () => {
    try {
      const response = await fetch('http://localhost:3001/health');
      if (response.ok) {
        const data = await response.json();
        setHealthStatus(data.data);
      } else {
        setError('Failed to fetch health status');
      }
    } catch (err) {
      setError('Network error while fetching health status');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>System Health Dashboard</h2>
        <div className={`status-indicator ${healthStatus?.status}`}>
          {healthStatus?.status.toUpperCase()}
        </div>
      </div>

      <div className="services-grid">
        <div className="service-card">
          <h3>Database</h3>
          <div className={`service-status ${healthStatus?.services.database.status}`}>
            {healthStatus?.services.database.status}
          </div>
        </div>

        <div className="service-card">
          <h3>Redis</h3>
          <div className={`service-status ${healthStatus?.services.redis.status}`}>
            {healthStatus?.services.redis.status}
          </div>
        </div>

        <div className="service-card">
          <h3>AI Services</h3>
          <div className={`service-status ${healthStatus?.services.ai.status}`}>
            {healthStatus?.services.ai.status}
          </div>
        </div>
      </div>

      <div className="system-info">
        <p>Uptime: {Math.floor((healthStatus?.uptime || 0) / 3600)} hours</p>
        <p>Last Updated: {new Date(healthStatus?.timestamp || '').toLocaleString()}</p>
      </div>
    </div>
  );
};

export default Dashboard; 