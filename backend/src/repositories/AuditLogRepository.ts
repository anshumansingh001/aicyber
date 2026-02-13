import { BaseRepository, PaginationOptions, PaginatedResult } from './BaseRepository';

export interface AuditLogRow {
  id: string;
  user_id: string | null;
  action: string;
  resource: string | null;
  details: Record<string, unknown>;
  ip_address: string | null;
  created_at: Date;
  updated_at: Date;
}

export class AuditLogRepository extends BaseRepository<AuditLogRow> {
  constructor() {
    super('audit_logs');
  }

  async log(
    action: string,
    resource: string,
    userId?: string,
    ipAddress?: string,
    details?: Record<string, unknown>
  ): Promise<AuditLogRow> {
    return this.create({
      action,
      resource,
      user_id: userId ?? null,
      ip_address: ipAddress ?? null,
      details: details ?? {},
    });
  }

  async findByUser(userId: string, options?: PaginationOptions): Promise<PaginatedResult<AuditLogRow>> {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 25;
    const offset = (page - 1) * limit;

    const [countResult] = await this.db(this.tableName).where('user_id', userId).count('* as total');
    const total = Number(countResult?.['total'] ?? 0);

    const rows = await this.db(this.tableName)
      .where('user_id', userId)
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    return {
      data: rows as AuditLogRow[],
      pagination: {
        page, limit, total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  async findByAction(action: string, options?: PaginationOptions): Promise<PaginatedResult<AuditLogRow>> {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 25;
    const offset = (page - 1) * limit;

    const [countResult] = await this.db(this.tableName).where('action', action).count('* as total');
    const total = Number(countResult?.['total'] ?? 0);

    const rows = await this.db(this.tableName)
      .where('action', action)
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    return {
      data: rows as AuditLogRow[],
      pagination: {
        page, limit, total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }
}
