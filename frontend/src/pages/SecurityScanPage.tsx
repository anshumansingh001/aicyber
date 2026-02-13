import React, { useState } from 'react';
import { securityAPI } from '../services/api';

export default function SecurityScanPage() {
  const [scanType, setScanType] = useState('vulnerability');
  const [target, setTarget] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResults(null);
    try {
      let response;
      if (scanType === 'vulnerability') {
        response = await securityAPI.scanVulnerabilities({ target, scanType: 'full' });
      } else if (scanType === 'device') {
        response = await securityAPI.assessDevice({ deviceId: target, deviceType: 'server' });
      } else {
        response = await securityAPI.detectThreats({ networkTraffic: [], systemLogs: [] });
      }
      setResults(response.data.data);
    } catch (err: any) {
      setResults({ error: err.response?.data?.error || 'Scan failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <h2>Security Scans</h2>
      <div className="card">
        <form onSubmit={runScan} className="scan-form">
          <div className="form-row">
            <div className="form-group">
              <label>Scan Type</label>
              <select value={scanType} onChange={(e) => setScanType(e.target.value)}>
                <option value="vulnerability">Vulnerability Scan</option>
                <option value="device">Device Assessment</option>
                <option value="threat">Threat Detection</option>
              </select>
            </div>
            <div className="form-group">
              <label>Target</label>
              <input type="text" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="e.g., web-server-01" required />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Scanning...' : 'Run Scan'}
            </button>
          </div>
        </form>
      </div>

      {results && !results.error && (
        <div className="card">
          <h3>Scan Results</h3>
          {results.vulnerabilities && (
            <table className="data-table">
              <thead><tr><th>CVE</th><th>Severity</th><th>Title</th><th>CVSS</th><th>Remediation</th></tr></thead>
              <tbody>
                {results.vulnerabilities.map((v: any, i: number) => (
                  <tr key={i}>
                    <td>{v.cve}</td>
                    <td><span className={`badge ${v.severity?.toLowerCase()}`}>{v.severity}</span></td>
                    <td>{v.title || v.description}</td>
                    <td>{v.cvss}</td>
                    <td>{v.remediation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {results.securityScore !== undefined && (
            <div className="score-display">
              <div className="score-number">{results.securityScore}</div>
              <div>Security Score</div>
            </div>
          )}
          {results.threats && (
            <div>
              <p>Threats found: {results.totalThreats || results.threats.length}</p>
              <p>Risk Level: <span className={`badge ${(results.riskLevel || '').toLowerCase()}`}>{results.riskLevel}</span></p>
            </div>
          )}
        </div>
      )}
      {results?.error && <div className="card error">{results.error}</div>}
    </div>
  );
}
