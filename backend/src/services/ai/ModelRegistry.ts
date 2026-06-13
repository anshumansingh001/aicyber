import db from '../database/db';
import logger from '../../utils/logger';

export interface ModelInfo {
  id: string;
  name: string;
  version: string;
  type: string;
  status: string;
  metrics: Record<string, number>;
  hyperparameters: Record<string, unknown>;
  filePath: string | null;
  createdAt: Date;
}

export class ModelRegistry {
  async listModels(status?: string): Promise<ModelInfo[]> {
    let query = db('ai_models');
    if (status) {
      query = query.where('status', status);
    }
    const rows = await query.orderBy('created_at', 'desc');
    return rows.map(this.toModelInfo);
  }

  async getModel(id: string): Promise<ModelInfo | null> {
    const row = await db('ai_models').where('id', id).first();
    return row ? this.toModelInfo(row) : null;
  }

  async promoteModel(id: string): Promise<void> {
    const model = await db('ai_models').where('id', id).first();
    if (!model) throw new Error('Model not found');

    // Retire previous active models of the same name
    await db('ai_models')
      .where({ name: model.name, status: 'active' })
      .whereNot('id', id)
      .update({ status: 'retired', updated_at: new Date() });

    await db('ai_models').where('id', id).update({ status: 'active', updated_at: new Date() });
    logger.info(`Model promoted to active: ${model.name} ${model.version}`);
  }

  async deleteModel(id: string): Promise<void> {
    await db('ai_models').where('id', id).del();
  }

  private toModelInfo(row: Record<string, unknown>): ModelInfo {
    return {
      id: row['id'] as string,
      name: row['name'] as string,
      version: row['version'] as string,
      type: row['type'] as string,
      status: row['status'] as string,
      metrics: typeof row['metrics'] === 'string' ? JSON.parse(row['metrics']) : (row['metrics'] as Record<string, number>) ?? {},
      hyperparameters: typeof row['hyperparameters'] === 'string' ? JSON.parse(row['hyperparameters']) : (row['hyperparameters'] as Record<string, unknown>) ?? {},
      filePath: row['file_path'] as string | null,
      createdAt: row['created_at'] as Date,
    };
  }
}
