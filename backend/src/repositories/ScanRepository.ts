import { BaseRepository } from './BaseRepository';

export interface ScanRow {
  id: string;
  user_id: string | null;
  scan_type: string;
  target: string | null;
  status: 'pending' | 'running' | 'completed' | 'failed';
  results: Record<string, unknown>;
  started_at: Date | null;
  completed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface VulnerabilityRow {
  id: string;
  scan_id: string;
  cve_id: string | null;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string | null;
  remediation: string | null;
  cvss_score: number | null;
  status: 'open' | 'patched' | 'accepted' | 'mitigated';
  created_at: Date;
  updated_at: Date;
}

export class ScanRepository extends BaseRepository<ScanRow> {
  constructor() {
    super('security_scans');
  }

  async findByUserId(userId: string): Promise<ScanRow[]> {
    return this.db(this.tableName).where('user_id', userId).orderBy('created_at', 'desc');
  }

  async updateStatus(id: string, status: ScanRow['status'], results?: Record<string, unknown>): Promise<ScanRow | undefined> {
    const updateData: Partial<ScanRow> = { status, updated_at: new Date() };
    if (status === 'running') {
      updateData.started_at = new Date();
    }
    if (status === 'completed' || status === 'failed') {
      updateData.completed_at = new Date();
    }
    if (results) {
      updateData.results = results;
    }
    const [row] = await this.db(this.tableName).where('id', id).update(updateData).returning('*');
    return row as ScanRow | undefined;
  }

  async addVulnerability(data: Partial<VulnerabilityRow>): Promise<VulnerabilityRow> {
    const [row] = await this.db('vulnerability_reports').insert(data).returning('*');
    return row as VulnerabilityRow;
  }

  async getVulnerabilitiesByScan(scanId: string): Promise<VulnerabilityRow[]> {
    return this.db('vulnerability_reports').where('scan_id', scanId).orderBy('cvss_score', 'desc');
  }

  async getVulnerabilitySummary(): Promise<Record<string, number>> {
    const rows = await this.db('vulnerability_reports')
      .select('severity')
      .count('* as count')
      .where('status', 'open')
      .groupBy('severity');

    const result: Record<string, number> = {};
    for (const row of rows) {
      result[row['severity'] as string] = Number(row['count']);
    }
    return result;
  }
}
