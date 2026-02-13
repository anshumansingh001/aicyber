import React, { useEffect, useState } from 'react';
import { complianceAPI } from '../services/api';

export default function CompliancePage() {
  const [status, setStatus] = useState<Record<string, { score: number; status: string }> | null>(null);
  const [selectedFramework, setSelectedFramework] = useState<string | null>(null);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const { data } = await complianceAPI.getStatus();
      setStatus(data.data);
    } finally {
      setLoading(false);
    }
  };

  const loadReport = async (framework: string) => {
    setSelectedFramework(framework);
    const { data } = await complianceAPI.getReport(framework);
    setReport(data.data);
  };

  if (loading) return <div className="loading">Loading compliance data...</div>;

  return (
    <div className="page">
      <h2>Compliance Dashboard</h2>

      <div className="stats-grid">
        {status && Object.entries(status).map(([fw, info]) => (
          <div key={fw} className="stat-card clickable" onClick={() => loadReport(fw)}>
            <h3>{fw.toUpperCase()}</h3>
            <div className="score-circle">
              <div className={`score-number ${info.status}`}>{info.score}%</div>
            </div>
            <span className={`badge ${info.status}`}>{info.status.replace('_', ' ')}</span>
          </div>
        ))}
      </div>

      {selectedFramework && report && (
        <div className="card">
          <h3>{selectedFramework.toUpperCase()} Compliance Report</h3>
          <table className="data-table">
            <thead><tr><th>ID</th><th>Requirement</th><th>Status</th><th>Score</th><th>Evidence</th></tr></thead>
            <tbody>
              {report.requirements?.map((req: any) => (
                <tr key={req.id}>
                  <td>{req.id}</td>
                  <td>{req.name}</td>
                  <td><span className={`badge ${req.status}`}>{req.status.replace('_', ' ')}</span></td>
                  <td>{req.score}%</td>
                  <td>{req.evidence}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {report.gaps?.length > 0 && (
            <>
              <h4>Compliance Gaps</h4>
              <div className="gaps-list">
                {report.gaps.map((gap: any) => (
                  <div key={gap.requirementId} className={`gap-item ${gap.severity}`}>
                    <strong>{gap.description}</strong>
                    <p>Severity: <span className={`badge ${gap.severity}`}>{gap.severity}</span></p>
                    <p>{gap.remediation}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
