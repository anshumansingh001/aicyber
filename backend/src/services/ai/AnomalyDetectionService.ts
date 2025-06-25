import logger from '../../utils/logger';

export interface AnomalyDetectionData {
  networkTraffic?: number[];
  userBehavior?: number[];
  systemMetrics?: number[];
  timestamp?: number;
}

export interface AnomalyResult {
  isAnomaly: boolean;
  confidence: number;
  score: number;
  threshold: number;
  details: {
    networkScore?: number;
    behaviorScore?: number;
    systemScore?: number;
  };
}

export class AnomalyDetectionService {
  private threshold = 0.8;

  constructor() {
    logger.info('AnomalyDetectionService initialized');
  }

  /**
   * Detect anomalies in security data
   */
  async detectAnomaly(data: AnomalyDetectionData): Promise<AnomalyResult> {
    try {
      // Prepare input data
      const inputData = this.prepareInputData(data);
      
      // Calculate anomaly score using statistical methods
      const anomalyScore = this.calculateAnomalyScore(inputData);
      
      // Determine if anomaly
      const isAnomaly = anomalyScore > this.threshold;
      
      // Calculate confidence
      const confidence = Math.min(anomalyScore, 1.0);
      
      const result: AnomalyResult = {
        isAnomaly,
        confidence,
        score: anomalyScore,
        threshold: this.threshold,
        details: {
          ...(data.networkTraffic && { networkScore: this.calculateNetworkScore(data.networkTraffic) }),
          ...(data.userBehavior && { behaviorScore: this.calculateBehaviorScore(data.userBehavior) }),
          ...(data.systemMetrics && { systemScore: this.calculateSystemScore(data.systemMetrics) })
        }
      };

      logger.info('Anomaly detection completed', { 
        isAnomaly, 
        confidence, 
        score: anomalyScore 
      });

      return result;
    } catch (error) {
      logger.error('Error in anomaly detection:', error);
      throw new Error(`Anomaly detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Prepare input data for anomaly detection
   */
  private prepareInputData(data: AnomalyDetectionData): number[] {
    const features: number[] = [];
    
    // Network traffic features (normalize to 4 features)
    if (data.networkTraffic) {
      const networkFeatures = this.extractFeatures(data.networkTraffic, 4);
      features.push(...networkFeatures);
    } else {
      features.push(0, 0, 0, 0);
    }
    
    // User behavior features
    if (data.userBehavior) {
      const behaviorFeatures = this.extractFeatures(data.userBehavior, 3);
      features.push(...behaviorFeatures);
    } else {
      features.push(0, 0, 0);
    }
    
    // System metrics features
    if (data.systemMetrics) {
      const systemFeatures = this.extractFeatures(data.systemMetrics, 3);
      features.push(...systemFeatures);
    } else {
      features.push(0, 0, 0);
    }
    
    return features;
  }

  /**
   * Extract statistical features from data array
   */
  private extractFeatures(data: number[], maxFeatures: number): number[] {
    if (data.length === 0) {
      return new Array(maxFeatures).fill(0);
    }
    
    const features: number[] = [];
    
    // Mean
    features.push(data.reduce((sum, val) => sum + val, 0) / data.length);
    
    // Standard deviation
    const mean = features[0] ?? 0; // Handle undefined case
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    features.push(Math.sqrt(variance));
    
    // Min and Max
    features.push(Math.min(...data));
    features.push(Math.max(...data));
    
    // Pad with zeros if needed
    while (features.length < maxFeatures) {
      features.push(0);
    }
    
    return features.slice(0, maxFeatures);
  }

  /**
   * Calculate anomaly score based on statistical analysis
   */
  private calculateAnomalyScore(data: number[]): number {
    if (data.length === 0) return 0;
    
    // Calculate various statistical measures
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    const stdDev = Math.sqrt(variance);
    
    // Calculate z-scores for outlier detection
    const zScores = data.map(val => Math.abs((val - mean) / stdDev));
    const maxZScore = Math.max(...zScores);
    
    // Calculate score based on outliers and variance
    const outlierScore = Math.min(maxZScore / 3, 1.0); // Normalize to 0-1
    const varianceScore = Math.min(variance, 1.0);
    
    // Combine scores
    const score = (outlierScore * 0.7) + (varianceScore * 0.3);
    
    return Math.min(score, 1.0);
  }

  /**
   * Calculate network-specific anomaly score
   */
  private calculateNetworkScore(networkData: number[]): number {
    if (networkData.length === 0) return 0;
    
    const mean = networkData.reduce((sum, val) => sum + val, 0) / networkData.length;
    const variance = networkData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / networkData.length;
    
    // Higher variance in network traffic might indicate anomaly
    return Math.min(variance, 1.0);
  }

  /**
   * Calculate behavior-specific anomaly score
   */
  private calculateBehaviorScore(behaviorData: number[]): number {
    if (behaviorData.length === 0) return 0;
    
    // Look for unusual patterns in user behavior
    const changes = [];
    for (let i = 1; i < behaviorData.length; i++) {
      const current = behaviorData[i];
      const previous = behaviorData[i - 1];
      if (current !== undefined && previous !== undefined) {
        changes.push(Math.abs(current - previous));
      }
    }
    
    const avgChange = changes.reduce((sum, val) => sum + val, 0) / changes.length;
    return Math.min(avgChange, 1.0);
  }

  /**
   * Calculate system-specific anomaly score
   */
  private calculateSystemScore(systemData: number[]): number {
    if (systemData.length === 0) return 0;
    
    // Check for unusual system metrics
    const max = Math.max(...systemData);
    const min = Math.min(...systemData);
    const range = max - min;
    
    // Large ranges might indicate system issues
    return Math.min(range / 100, 1.0);
  }

  /**
   * Get service status
   */
  getStatus(): { isAvailable: boolean; threshold: number } {
    return {
      isAvailable: true,
      threshold: this.threshold
    };
  }

  /**
   * Update anomaly detection threshold
   */
  updateThreshold(newThreshold: number): void {
    this.threshold = Math.max(0, Math.min(1, newThreshold));
    logger.info('Anomaly detection threshold updated', { newThreshold: this.threshold });
  }
} 