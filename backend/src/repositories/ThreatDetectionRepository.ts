import { BaseRepository } from './BaseRepository';

export interface ThreatDetectionRow {
  id: string;
  event_id: string | null;
  threat_type: string;
  confidence: number;
  ai_model: string | null;
  details: Record<string, unknown>;
  status: 'active' | 'mitigated' | 'resolved' | 'false_positive';
  created_at: Date;
  updated_at: Date;
}

export class ThreatDetectionRepository extends BaseRepository<ThreatDetectionRow> {
  constructor() {
    super('threat_detections');
  }

  async findActive(): Promise<ThreatDetectionRow[]> {
    return this.db(this.tableName).where('status', 'active').orderBy('created_at', 'desc');
  }

  async findByType(threatType: string): Promise<ThreatDetectionRow[]> {
    return this.db(this.tableName).where('threat_type', threatType).orderBy('created_at', 'desc');
  }

  async updateStatus(id: string, status: ThreatDetectionRow['status']): Promise<ThreatDetectionRow | undefined> {
    const [row] = await this.db(this.tableName)
      .where('id', id)
      .update({ status, updated_at: new Date() })
      .returning('*');
    return row as ThreatDetectionRow | undefined;
  }

  async countByStatus(): Promise<Record<string, number>> {
    const rows = await this.db(this.tableName)
      .select('status')
      .count('* as count')
      .groupBy('status');

    const result: Record<string, number> = {};
    for (const row of rows) {
      result[row['status'] as string] = Number(row['count']);
    }
    return result;
  }
}
