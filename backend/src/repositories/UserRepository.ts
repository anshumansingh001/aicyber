import { BaseRepository } from './BaseRepository';

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: 'user' | 'analyst' | 'admin';
  is_active: boolean;
  last_login: Date | null;
  created_at: Date;
  updated_at: Date;
}

export class UserRepository extends BaseRepository<UserRow> {
  constructor() {
    super('users');
  }

  async findByEmail(email: string): Promise<UserRow | undefined> {
    return this.db(this.tableName).where('email', email).first();
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.db(this.tableName).where('id', id).update({ last_login: new Date(), updated_at: new Date() });
  }

  async findByRole(role: string): Promise<UserRow[]> {
    return this.db(this.tableName).where('role', role).orderBy('created_at', 'desc');
  }

  async setActive(id: string, isActive: boolean): Promise<void> {
    await this.db(this.tableName).where('id', id).update({ is_active: isActive, updated_at: new Date() });
  }
}
