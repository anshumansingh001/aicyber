import React, { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { analyticsAPI } from '../services/api';

const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe', '#43e97b'];

export default function AnalyticsPage() {
  const [timeline, setTimeline] = useState<any[]>([]);
  const [threatTypes, setThreatTypes] = useState<any[]>([]);
  const [scansSummary, setScansSummary] = useState<any[]>([]);
  const [aiPerformance, setAIPerformance] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [timelineRes, threatsRes, scansRes, aiRes] = await Promise.allSettled([
        analyticsAPI.getEventsTimeline(30),
        analyticsAPI.getThreatsByType(),
        analyticsAPI.getScansSummary(),
        analyticsAPI.getAIPerformance(),
      ]);
      if (timelineRes.status === 'fulfilled') {
        setTimeline(timelineRes.value.data.data.map((d: any) => ({
          date: new Date(d.day).toLocaleDateString(),
          count: Number(d.count),
        })));
      }
      if (threatsRes.status === 'fulfilled') setThreatTypes(threatsRes.value.data.data);
      if (scansRes.status === 'fulfilled') setScansSummary(scansRes.value.data.data);
      if (aiRes.status === 'fulfilled') setAIPerformance(aiRes.value.data.data);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading analytics...</div>;

  return (
    <div className="page">
      <h2>Security Analytics</h2>

      <div className="charts-grid">
        <div className="card chart-card">
          <h3>Security Events (30 days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timeline}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="count" stroke="#667eea" strokeWidth={2} name="Events" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card chart-card">
          <h3>Threats by Type</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={threatTypes}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="threat_type" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#764ba2" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card chart-card">
          <h3>Scan Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={scansSummary} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={100} label>
                {scansSummary.map((_: any, index: number) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card chart-card">
          <h3>AI Model Performance</h3>
          {aiPerformance && (
            <div className="ai-stats">
              <div className="stat-item"><span>Total Analyses</span><strong>{aiPerformance.totalAnalyses}</strong></div>
              <div className="stat-item"><span>Avg Confidence</span><strong>{(aiPerformance.averageConfidence * 100).toFixed(1)}%</strong></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
