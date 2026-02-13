import { BaseRepository, PaginationOptions, PaginatedResult } from './BaseRepository';

export interface SecurityEventRow {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string | null;
  target: string | null;
  description: string | null;
  payload: Record<string, unknown>;
  user_id: string | null;
  ip_address: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface SecurityEventFilters {
  type?: string;
  severity?: string;
  startDate?: Date;
  endDate?: Date;
}

export class SecurityEventRepository extends BaseRepository<SecurityEventRow> {
  constructor() {
    super('security_events');
  }

  async findWithFilters(
    filters: SecurityEventFilters,
    options?: PaginationOptions
  ): Promise<PaginatedResult<SecurityEventRow>> {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 25;
    const offset = (page - 1) * limit;

    let query = this.db(this.tableName);
    let countQuery = this.db(this.tableName);

    if (filters.type) {
      query = query.where('type', filters.type);
      countQuery = countQuery.where('type', filters.type);
    }
    if (filters.severity) {
      query = query.where('severity', filters.severity);
      countQuery = countQuery.where('severity', filters.severity);
    }
    if (filters.startDate) {
      query = query.where('created_at', '>=', filters.startDate);
      countQuery = countQuery.where('created_at', '>=', filters.startDate);
    }
    if (filters.endDate) {
      query = query.where('created_at', '<=', filters.endDate);
      countQuery = countQuery.where('created_at', '<=', filters.endDate);
    }

    const [countResult] = await countQuery.count('* as total');
    const total = Number(countResult?.['total'] ?? 0);

    const rows = await query.orderBy('created_at', 'desc').limit(limit).offset(offset);

    return {
      data: rows as SecurityEventRow[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  async getRecentEvents(count: number): Promise<SecurityEventRow[]> {
    return this.db(this.tableName).orderBy('created_at', 'desc').limit(count);
  }

  async countBySeverity(): Promise<Record<string, number>> {
    const rows = await this.db(this.tableName)
      .select('severity')
      .count('* as count')
      .groupBy('severity');

    const result: Record<string, number> = {};
    for (const row of rows) {
      result[row['severity'] as string] = Number(row['count']);
    }
    return result;
  }
}
