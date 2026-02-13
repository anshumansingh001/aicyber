import React, { useState } from 'react';
import { aiAPI } from '../services/api';

export default function AIAnalysisPage() {
  const [activeTab, setActiveTab] = useState('anomaly');
  const [input, setInput] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runAnalysis = async () => {
    setLoading(true);
    setResults(null);
    try {
      let response;
      if (activeTab === 'anomaly') {
        const data = { networkTraffic: [1, 2, 3, 15, 2, 1, 50], userBehavior: [5, 5, 5, 5, 30], systemMetrics: [70, 72, 71, 95] };
        response = await aiAPI.anomalyDetection({ data });
      } else if (activeTab === 'nlp') {
        response = await aiAPI.nlpAnalysis(input || 'Suspicious login attempt from unknown IP with potential SQL injection payload');
      } else {
        const historicalData = [
          { type: 'malware_detection', severity: 'high', timestamp: Date.now() - 86400000 },
          { type: 'phishing_attempt', severity: 'medium', timestamp: Date.now() - 172800000 },
          { type: 'authentication_failure', severity: 'low', timestamp: Date.now() - 259200000 },
        ];
        response = await aiAPI.predictiveAnalytics(historicalData);
      }
      setResults(response.data.data);
    } catch (err: any) {
      setResults({ error: err.response?.data?.error || 'Analysis failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <h2>AI Security Analysis</h2>
      <div className="tabs">
        {['anomaly', 'nlp', 'predictive'].map((tab) => (
          <button key={tab} className={`tab ${activeTab === tab ? 'active' : ''}`} onClick={() => { setActiveTab(tab); setResults(null); }}>
            {tab === 'anomaly' ? 'Anomaly Detection' : tab === 'nlp' ? 'NLP Analysis' : 'Predictive Analytics'}
          </button>
        ))}
      </div>

      <div className="card">
        {activeTab === 'nlp' && (
          <div className="form-group">
            <label>Text to analyze</label>
            <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={4} placeholder="Enter text for NLP security analysis..." />
          </div>
        )}
        <button className="btn btn-primary" onClick={runAnalysis} disabled={loading}>
          {loading ? 'Analyzing...' : 'Run Analysis'}
        </button>
      </div>

      {results && !results.error && (
        <div className="card">
          <h3>Results</h3>
          <pre className="results-json">{JSON.stringify(results, null, 2)}</pre>
        </div>
      )}
      {results?.error && <div className="card error">{results.error}</div>}
    </div>
  );
}
