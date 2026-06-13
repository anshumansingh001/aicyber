import { Knex } from 'knex';
import db from '../services/database/db';

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export abstract class BaseRepository<T> {
  protected db: Knex;
  protected tableName: string;

  constructor(tableName: string) {
    this.db = db;
    this.tableName = tableName;
  }

  async findById(id: string): Promise<T | undefined> {
    const row = await this.db(this.tableName).where('id', id).first();
    return row as T | undefined;
  }

  async findAll(options?: PaginationOptions): Promise<PaginatedResult<T>> {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 25;
    const offset = (page - 1) * limit;

    const [countResult] = await this.db(this.tableName).count('* as total');
    const total = Number(countResult?.['total'] ?? 0);

    const rows = await this.db(this.tableName)
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    return {
      data: rows as T[],
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

  async create(data: Partial<T>): Promise<T> {
    const [row] = await this.db(this.tableName).insert(data).returning('*');
    return row as T;
  }

  async update(id: string, data: Partial<T>): Promise<T | undefined> {
    const [row] = await this.db(this.tableName).where('id', id).update({ ...data, updated_at: new Date() }).returning('*');
    return row as T | undefined;
  }

  async delete(id: string): Promise<boolean> {
    const count = await this.db(this.tableName).where('id', id).del();
    return count > 0;
  }
}
