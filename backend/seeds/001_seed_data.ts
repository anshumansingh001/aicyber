import type { Knex } from 'knex';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export async function seed(knex: Knex): Promise<void> {
  await knex('audit_logs').del();
  await knex('ai_analysis_results').del();
  await knex('vulnerability_reports').del();
  await knex('threat_detections').del();
  await knex('security_scans').del();
  await knex('security_events').del();
  await knex('sessions').del();
  await knex('users').del();

  // Hash the demo password at seed time so seeded users are always loginable.
  const passwordHash = await bcrypt.hash('password123', 12);

  const adminId = crypto.randomUUID();
  const analystId = crypto.randomUUID();
  const userId = crypto.randomUUID();

  await knex('users').insert([
    { id: adminId, email: 'admin@aicyber.com', password_hash: passwordHash, name: 'Admin User', role: 'admin' },
    { id: analystId, email: 'analyst@aicyber.com', password_hash: passwordHash, name: 'Security Analyst', role: 'analyst' },
    { id: userId, email: 'user@aicyber.com', password_hash: passwordHash, name: 'Regular User', role: 'user' },
  ]);

  const eventIds = [crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID()];

  await knex('security_events').insert([
    {
      id: eventIds[0],
      type: 'login_attempt',
      severity: 'medium',
      source: '192.168.1.50',
      description: 'Multiple failed login attempts detected',
      payload: JSON.stringify({ attempts: 5, username: 'admin' }),
      user_id: adminId,
      ip_address: '192.168.1.50',
    },
    {
      id: eventIds[1],
      type: 'malware_detected',
      severity: 'high',
      source: '192.168.1.75',
      description: 'Trojan detected and quarantined',
      payload: JSON.stringify({ malware_name: 'Trojan.Gen', file: '/tmp/suspicious.exe' }),
      user_id: userId,
      ip_address: '192.168.1.75',
    },
    {
      id: eventIds[2],
      type: 'unauthorized_access',
      severity: 'critical',
      source: '10.0.0.15',
      description: 'Unauthorized access attempt to admin panel',
      payload: JSON.stringify({ path: '/admin', method: 'POST' }),
      ip_address: '10.0.0.15',
    },
  ]);

  const scanId = crypto.randomUUID();

  await knex('security_scans').insert([
    {
      id: scanId,
      user_id: analystId,
      scan_type: 'vulnerability',
      target: 'web-server-01',
      status: 'completed',
      results: JSON.stringify({ total_vulnerabilities: 2, critical: 1, high: 1 }),
      started_at: new Date(Date.now() - 600000),
      completed_at: new Date(),
    },
  ]);

  await knex('vulnerability_reports').insert([
    {
      scan_id: scanId,
      cve_id: 'CVE-2024-1234',
      severity: 'critical',
      description: 'SQL Injection vulnerability in login form',
      remediation: 'Use parameterized queries for all database operations',
      cvss_score: 9.8,
      status: 'open',
    },
    {
      scan_id: scanId,
      cve_id: 'CVE-2024-5678',
      severity: 'high',
      description: 'Reflected XSS in search input',
      remediation: 'Implement input validation and output encoding',
      cvss_score: 7.5,
      status: 'open',
    },
  ]);

  await knex('threat_detections').insert([
    {
      event_id: eventIds[1],
      threat_type: 'malware',
      confidence: 0.95,
      ai_model: 'anomaly_detection_v1',
      details: JSON.stringify({ classification: 'trojan', family: 'GenericTrojan' }),
      status: 'active',
    },
  ]);

  await knex('audit_logs').insert([
    { user_id: adminId, action: 'user.login', resource: '/api/auth/login', details: JSON.stringify({ success: true }), ip_address: '192.168.1.1' },
    { user_id: analystId, action: 'scan.create', resource: '/api/security/vulnerabilities/scan', details: JSON.stringify({ target: 'web-server-01' }), ip_address: '192.168.1.2' },
  ]);
}
