import { BaseRepository } from './BaseRepository';

export interface AIAnalysisRow {
  id: string;
  analysis_type: string;
  input_hash: string | null;
  results: Record<string, unknown>;
  model_version: string | null;
  confidence: number | null;
  created_at: Date;
  updated_at: Date;
}

export class AIAnalysisRepository extends BaseRepository<AIAnalysisRow> {
  constructor() {
    super('ai_analysis_results');
  }

  async findByType(analysisType: string): Promise<AIAnalysisRow[]> {
    return this.db(this.tableName)
      .where('analysis_type', analysisType)
      .orderBy('created_at', 'desc')
      .limit(50);
  }

  async findByHash(inputHash: string): Promise<AIAnalysisRow | undefined> {
    return this.db(this.tableName).where('input_hash', inputHash).orderBy('created_at', 'desc').first();
  }

  async storeResult(
    analysisType: string,
    results: Record<string, unknown>,
    modelVersion?: string,
    confidence?: number,
    inputHash?: string
  ): Promise<AIAnalysisRow> {
    return this.create({
      analysis_type: analysisType,
      results,
      model_version: modelVersion ?? null,
      confidence: confidence ?? null,
      input_hash: inputHash ?? null,
    });
  }
}
