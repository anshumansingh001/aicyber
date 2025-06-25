import * as tf from '@tensorflow/tfjs-node';
import { AIModelManager, AIModel } from './AIModelManager';
import logger from '../../utils/logger';

export interface SecurityEvent {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  source: string;
  details: any;
}

export interface PredictionData {
  historicalEvents: SecurityEvent[];
  timeRange: string;
  predictionHorizon: string;
}

export interface PredictionResult {
  threats: Array<{
    type: string;
    probability: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    timeframe: string;
    confidence: number;
  }>;
  trends: Array<{
    metric: string;
    direction: 'increasing' | 'decreasing' | 'stable';
    rate: number;
    confidence: number;
  }>;
  riskScore: number;
  recommendations: string[];
  confidence: number;
  modelInfo: {
    modelUsed: string;
    algorithm: string;
    features: number[];
  };
}

export class PredictiveAnalyticsService {
  private readonly eventTypes = [
    'authentication_failure',
    'authorization_violation',
    'data_access',
    'network_scan',
    'malware_detection',
    'phishing_attempt',
    'ddos_attack',
    'sql_injection',
    'xss_attack'
  ];

  private modelManager: AIModelManager;
  private activeModel: AIModel | null = null;
  private lstmModel: tf.LayersModel | null = null;

  constructor() {
    logger.info('PredictiveAnalyticsService initialized');
    this.modelManager = new AIModelManager();
    this.initializeModels();
  }

  /**
   * Initialize advanced prediction models
   */
  private async initializeModels(): Promise<void> {
    try {
      // Get the prediction model from model manager
      const models = this.modelManager.getModels();
      this.activeModel = models.find(m => m.type === 'prediction') || null;

      if (this.activeModel) {
        const modelInstance = this.modelManager.getActiveModel(this.activeModel.id);
        if (modelInstance) {
          this.lstmModel = modelInstance;
          logger.info(`Loaded prediction model: ${this.activeModel.name}`);
        }
      }
    } catch (error) {
      logger.error('Error initializing prediction models:', error);
    }
  }

  /**
   * Predict potential security threats using advanced ML
   */
  async predictThreats(data: PredictionData): Promise<PredictionResult> {
    try {
      const { historicalEvents, predictionHorizon } = data;
      
      // Prepare features for neural model
      const features = this.prepareFeatures(historicalEvents);
      
      // Neural prediction (LSTM)
      const neuralPredictions = await this.predictWithLSTM(features);
      
      // Statistical trend analysis
      const patterns = this.analyzePatterns(historicalEvents);
      const threats = this.generateThreatPredictions(patterns, predictionHorizon, neuralPredictions);
      const trends = this.analyzeTrends(historicalEvents);
      const riskScore = this.calculateRiskScore(threats, trends, neuralPredictions);
      const recommendations = this.generateRecommendations(threats, trends, riskScore);
      const confidence = this.calculateConfidence(historicalEvents, threats, trends, neuralPredictions);

      const result: PredictionResult = {
        threats,
        trends,
        riskScore,
        recommendations,
        confidence,
        modelInfo: {
          modelUsed: this.activeModel?.name || 'LSTM + Statistical Ensemble',
          algorithm: 'LSTM + Statistical Trend Analysis',
          features: features.flat()
        }
      };

      logger.info('Advanced predictive analytics completed', {
        threatsCount: threats.length,
        riskScore,
        confidence: result.confidence,
        modelUsed: result.modelInfo.modelUsed
      });

      return result;
    } catch (error) {
      logger.error('Error in advanced predictive analytics:', error);
      throw new Error(`Predictive analytics failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Prepare features for LSTM model
   */
  private prepareFeatures(events: SecurityEvent[]): number[][] {
    if (events.length === 0) return [];

    // Sort events by timestamp
    const sorted = events.slice().sort((a, b) => a.timestamp - b.timestamp);
    
    // Create time buckets (hourly windows)
    const windowSize = 60 * 60 * 1000; // 1 hour
    const timeBuckets: { [key: string]: number[] } = {};
    
    // Initialize buckets
    sorted.forEach(event => {
      const bucketKey = Math.floor(event.timestamp / windowSize) * windowSize;
      const bucket = bucketKey.toString();
      if (!timeBuckets[bucket]) {
        timeBuckets[bucket] = new Array(this.eventTypes.length).fill(0);
      }
    });

    // Fill buckets with event counts
    sorted.forEach(event => {
      const bucketKey = Math.floor(event.timestamp / windowSize) * windowSize;
      const bucket = bucketKey.toString();
      const idx = this.eventTypes.indexOf(event.type);
      if (idx >= 0) {
        const bucketArray = timeBuckets[bucket];
        if (bucketArray && bucketArray[idx] !== undefined) {
          bucketArray[idx] += 1;
        }
      }
    });
    return Object.values(timeBuckets);
  }

  /**
   * Predict with LSTM model
   */
  private async predictWithLSTM(features: number[][]): Promise<number[]> {
    if (!this.lstmModel || features.length === 0) return new Array(features.length).fill(0);
    try {
      if (features[0] && features[0].length > 0) {
        const inputTensor = tf.tensor3d([features], [1, features.length, features[0].length]);
        const prediction = this.lstmModel.predict(inputTensor) as tf.Tensor;
        const predictionData = await prediction.data();
        inputTensor.dispose();
        prediction.dispose();
        return Array.from(predictionData);
      }
      return new Array(features.length).fill(0);
    } catch (error) {
      logger.error('Error in LSTM prediction:', error);
      return new Array(features.length).fill(0);
    }
  }

  /**
   * Analyze patterns in historical events (statistical)
   */
  private analyzePatterns(events: SecurityEvent[]): any {
    const patterns: any = {};
    this.eventTypes.forEach(type => {
      const typeEvents = events.filter(e => e.type === type);
      patterns[type] = {
        count: typeEvents.length,
        frequency: typeEvents.length / Math.max(events.length, 1),
        severityDistribution: this.calculateSeverityDistribution(typeEvents),
        timeDistribution: this.calculateTimeDistribution(typeEvents)
      };
    });
    return patterns;
  }

  /**
   * Generate threat predictions (ensemble)
   */
  private generateThreatPredictions(patterns: any, horizon: string, neuralPredictions: number[]): Array<{
    type: string;
    probability: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    timeframe: string;
    confidence: number;
  }> {
    return this.eventTypes.map((type, idx) => {
      const statProb = patterns[type]?.frequency || 0;
      const neuralProb = neuralPredictions[idx] || 0;
      const probability = Math.min((statProb * 0.4) + (neuralProb * 0.6), 1.0);
      const severity = this.determinePredictedSeverity(patterns[type]?.severityDistribution || {});
      return {
        type,
        probability,
        severity,
        timeframe: horizon,
        confidence: Math.min(probability + 0.2, 1.0)
      };
    });
  }

  /**
   * Calculate severity distribution
   */
  private calculateSeverityDistribution(events: SecurityEvent[]): { [key: string]: number } {
    const distribution: { [key: string]: number } = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    };
    events.forEach(event => {
      const current = distribution[event.severity];
      if (current !== undefined) {
        distribution[event.severity] = current + 1;
      }
    });
    const total = events.length;
    Object.keys(distribution).forEach(severity => {
      const value = distribution[severity];
      if (value !== undefined) {
        distribution[severity] = total > 0 ? value / total : 0;
      }
    });
    return distribution;
  }

  /**
   * Calculate time distribution
   */
  private calculateTimeDistribution(events: SecurityEvent[]): { [key: string]: number } {
    const distribution: { [key: string]: number } = {
      hourly: 0,
      daily: 0,
      weekly: 0
    };
    if (events.length === 0) return distribution;
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const oneDay = 24 * oneHour;
    const oneWeek = 7 * oneDay;
    events.forEach(event => {
      const timeDiff = now - event.timestamp;
      if (timeDiff <= oneHour) {
        const current = distribution['hourly'];
        if (current !== undefined) distribution['hourly'] = current + 1;
      }
      else if (timeDiff <= oneDay) {
        const current = distribution['daily'];
        if (current !== undefined) distribution['daily'] = current + 1;
      }
      else if (timeDiff <= oneWeek) {
        const current = distribution['weekly'];
        if (current !== undefined) distribution['weekly'] = current + 1;
      }
    });
    const total = events.length;
    Object.keys(distribution).forEach(period => {
      const value = distribution[period];
      if (value !== undefined) {
        distribution[period] = total > 0 ? value / total : 0;
      }
    });
    return distribution;
  }

  /**
   * Analyze trends in historical events
   */
  private analyzeTrends(events: SecurityEvent[]): Array<{
    metric: string;
    direction: 'increasing' | 'decreasing' | 'stable';
    rate: number;
    confidence: number;
  }> {
    // Example: frequency and severity trends
    return [
      this.calculateFrequencyTrend(events),
      this.calculateSeverityTrend(events)
    ];
  }

  /**
   * Calculate frequency trend
   */
  private calculateFrequencyTrend(events: SecurityEvent[]): {
    metric: string;
    direction: 'increasing' | 'decreasing' | 'stable';
    rate: number;
    confidence: number;
  } {
    if (events.length < 2) return { metric: 'frequency', direction: 'stable', rate: 0, confidence: 0.5 };
    const sorted = events.slice().sort((a, b) => a.timestamp - b.timestamp);
    const first = sorted[0]?.timestamp || 0;
    const last = sorted[sorted.length - 1]?.timestamp || 0;
    const duration = last - first;
    const rate = events.length / (duration / (24 * 60 * 60 * 1000));
    let direction: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (rate > 1.2) direction = 'increasing';
    else if (rate < 0.8) direction = 'decreasing';
    return { metric: 'frequency', direction, rate, confidence: 0.7 };
  }

  /**
   * Calculate severity trend
   */
  private calculateSeverityTrend(events: SecurityEvent[]): {
    metric: string;
    direction: 'increasing' | 'decreasing' | 'stable';
    rate: number;
    confidence: number;
  } {
    if (events.length === 0) return { metric: 'severity', direction: 'stable', rate: 0, confidence: 0.5 };
    const severityMap = { low: 1, medium: 2, high: 3, critical: 4 };
    const avgSeverity = events.reduce((sum, e) => sum + (severityMap[e.severity] || 1), 0) / events.length;
    let direction: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (avgSeverity > 2.5) direction = 'increasing';
    else if (avgSeverity < 1.5) direction = 'decreasing';
    return { metric: 'severity', direction, rate: avgSeverity, confidence: 0.7 };
  }

  /**
   * Calculate risk score (ensemble)
   */
  private calculateRiskScore(
    threats: Array<{ probability: number; severity: string }>,
    trends: Array<{ direction: string; rate: number }>,
    neuralPredictions: number[]
  ): number {
    let risk = 0;
    risk += threats.reduce((sum, t) => sum + t.probability, 0) / Math.max(threats.length, 1) * 0.5;
    risk += trends.reduce((sum, t) => sum + (t.direction === 'increasing' ? 0.2 : 0), 0);
    risk += (neuralPredictions.reduce((sum, v) => sum + v, 0) / Math.max(neuralPredictions.length, 1)) * 0.3;
    return Math.min(risk, 1.0);
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    threats: Array<{ type: string; probability: number; severity: string }>,
    trends: Array<{ metric: string; direction: string }>,
    riskScore: number
  ): string[] {
    const recommendations: string[] = [];
    if (riskScore > 0.7) {
      recommendations.push('Immediate risk mitigation required');
      recommendations.push('Increase monitoring and alerting');
    }
    if (threats.some(t => t.severity === 'critical')) {
      recommendations.push('Critical threat detected: escalate to incident response');
    }
    if (trends.some(t => t.direction === 'increasing')) {
      recommendations.push('Trends indicate rising threat activity');
    }
    if (recommendations.length === 0) {
      recommendations.push('Continue regular monitoring');
    }
    return recommendations;
  }

  /**
   * Calculate confidence (ensemble)
   */
  private calculateConfidence(
    events: SecurityEvent[],
    threats: Array<{ confidence: number }>,
    trends: Array<{ confidence: number }>,
    neuralPredictions: number[]
  ): number {
    let confidence = 0.5;
    confidence += Math.min(threats.reduce((sum, t) => sum + t.confidence, 0) / Math.max(threats.length, 1), 0.2);
    confidence += Math.min(trends.reduce((sum, t) => sum + t.confidence, 0) / Math.max(trends.length, 1), 0.2);
    confidence += Math.min((neuralPredictions.reduce((sum, v) => sum + v, 0) / Math.max(neuralPredictions.length, 1)), 0.1);
    confidence += Math.min(events.length / 1000, 0.1);
    return Math.min(confidence, 1.0);
  }

  /**
   * Determine predicted severity based on distribution
   */
  private determinePredictedSeverity(distribution: { [key: string]: number }): 'low' | 'medium' | 'high' | 'critical' {
    if (distribution['critical'] && distribution['critical'] > 0.2) return 'critical';
    if (distribution['high'] && distribution['high'] > 0.3) return 'high';
    if (distribution['medium'] && distribution['medium'] > 0.3) return 'medium';
    return 'low';
  }

  /**
   * Get service status with model information
   */
  getStatus(): {
    isAvailable: boolean;
    eventTypesCount: number;
    activeModel: string | null;
    modelAccuracy: number | null;
    algorithms: string[];
  } {
    return {
      isAvailable: true,
      eventTypesCount: this.eventTypes.length,
      activeModel: this.activeModel?.name || null,
      modelAccuracy: this.activeModel?.accuracy || null,
      algorithms: ['LSTM', 'Statistical Trend Analysis']
    };
  }

  /**
   * Retrain the prediction model
   */
  async retrainModel(trainingData: { features: number[][]; labels: number[] }): Promise<void> {
    try {
      if (!this.activeModel) {
        throw new Error('No active model to retrain');
      }

      // Prepare training data
      const features = trainingData.features;
      const labels = trainingData.labels;

      if (features.length === 0 || !features[0] || features[0].length === 0) {
        throw new Error('Invalid training data');
      }

      // Convert to tensors - reshape for 3D tensor
      const reshapedFeatures = features.map(feature => feature.map(val => [val]));
      const inputTensor = tf.tensor3d(reshapedFeatures, [features.length, features[0]!.length, 1]);
      const outputTensor = tf.tensor2d(labels, [labels.length, 1]);

      // Train the model
      await this.modelManager.trainModel(
        this.activeModel.id,
        inputTensor,
        outputTensor,
        {
          epochs: 100,
          batchSize: 32,
          learningRate: 0.001,
          validationSplit: 0.2,
          earlyStoppingPatience: 15,
          callbacks: ['earlyStopping']
        }
      );

      // Reload the updated model
      await this.initializeModels();

      logger.info('Prediction model retrained successfully');
    } catch (error) {
      logger.error('Error retraining prediction model:', error);
      throw error;
    }
  }
} 