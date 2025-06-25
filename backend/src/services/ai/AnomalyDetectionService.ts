import * as tf from '@tensorflow/tfjs-node';
import { AIModelManager, AIModel } from './AIModelManager';
import logger from '../../utils/logger';

// Simple statistical functions to replace ML libraries
function calculateMean(data: number[]): number {
  return data.reduce((sum, val) => sum + val, 0) / data.length;
}

function calculateStandardDeviation(data: number[], mean: number): number {
  const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
  return Math.sqrt(variance);
}

function calculateZScore(value: number, mean: number, std: number): number {
  return (value - mean) / std;
}

function calculateMax(data: number[]): number {
  return Math.max(...data);
}

function calculateMin(data: number[]): number {
  return Math.min(...data);
}

function calculatePercentile(data: number[], percentile: number): number {
  if (data.length === 0) return 0;
  const sorted = [...data].sort((a, b) => a - b);
  const index = (percentile / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  
  // Ensure bounds are within array limits
  const lowerValue = sorted[Math.min(lower, sorted.length - 1)] || 0;
  const upperValue = sorted[Math.min(upper, sorted.length - 1)] || 0;
  
  return lowerValue * (1 - weight) + upperValue * weight;
}

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
    modelUsed: string;
    algorithm: string;
    features: number[];
  };
  explanation?: {
    contributingFactors: string[];
    severity: 'low' | 'medium' | 'high' | 'critical';
    recommendations: string[];
  };
}

export class AnomalyDetectionService {
  private threshold = 0.8;
  private modelManager: AIModelManager;
  private activeModel: AIModel | null = null;
  private isolationForest: any = null; // Will be implemented with ML library
  private autoencoder: tf.LayersModel | null = null;

  constructor() {
    logger.info('AnomalyDetectionService initialized');
    this.modelManager = new AIModelManager();
    this.initializeModels();
  }

  /**
   * Initialize advanced anomaly detection models
   */
  private async initializeModels(): Promise<void> {
    try {
      // Get the anomaly detection model from model manager
      const models = this.modelManager.getModels();
      this.activeModel = models.find(m => m.type === 'anomaly') || null;

      if (this.activeModel) {
        const modelInstance = this.modelManager.getActiveModel(this.activeModel.id);
        if (modelInstance) {
          this.autoencoder = modelInstance;
          logger.info(`Loaded autoencoder model: ${this.activeModel.name}`);
        }
      }

      // Initialize isolation forest for ensemble detection
      this.initializeIsolationForest();

      logger.info('Advanced anomaly detection models initialized');
    } catch (error) {
      logger.error('Error initializing anomaly detection models:', error);
    }
  }

  /**
   * Initialize isolation forest for ensemble detection
   */
  private initializeIsolationForest(): void {
    // Simple isolation forest implementation
    // In a production environment, you'd use a proper ML library
    this.isolationForest = {
      contamination: 0.1,
      nEstimators: 100,
      maxSamples: 'auto'
    };
  }

  /**
   * Detect anomalies using advanced ML models
   */
  async detectAnomaly(data: AnomalyDetectionData): Promise<AnomalyResult> {
    try {
      // Prepare input data
      const inputData = this.prepareInputData(data);
      
      // Use ensemble approach: combine multiple algorithms
      const results = await Promise.all([
        this.detectWithAutoencoder(inputData),
        this.detectWithIsolationForest(inputData),
        this.detectWithStatisticalMethods(inputData)
      ]);

      // Ensemble the results
      const ensembleScore = this.ensembleResults(results);
      const isAnomaly = ensembleScore > this.threshold;
      
      // Calculate confidence based on model agreement
      const confidence = this.calculateConfidence(results);
      
      // Generate explanation
      const explanation = this.generateExplanation(data, results, ensembleScore);

      const result: AnomalyResult = {
        isAnomaly,
        confidence,
        score: ensembleScore,
        threshold: this.threshold,
        details: {
          ...(data.networkTraffic && { networkScore: this.calculateNetworkScore(data.networkTraffic) }),
          ...(data.userBehavior && { behaviorScore: this.calculateBehaviorScore(data.userBehavior) }),
          ...(data.systemMetrics && { systemScore: this.calculateSystemScore(data.systemMetrics) }),
          modelUsed: this.activeModel?.name || 'Ensemble',
          algorithm: 'Autoencoder + Isolation Forest + Statistical',
          features: inputData
        },
        ...(explanation && { explanation })
      };

      logger.info('Advanced anomaly detection completed', { 
        isAnomaly, 
        confidence, 
        score: ensembleScore,
        modelUsed: result.details.modelUsed
      });

      return result;
    } catch (error) {
      logger.error('Error in advanced anomaly detection:', error);
      throw new Error(`Anomaly detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Detect anomalies using autoencoder
   */
  private async detectWithAutoencoder(data: number[]): Promise<number> {
    if (!this.autoencoder || data.length === 0) return 0;

    try {
      // Convert data to tensor
      const inputTensor = tf.tensor2d([data], [1, data.length]);
      
      // Get reconstruction
      const reconstruction = this.autoencoder.predict(inputTensor) as tf.Tensor;
      
      // Calculate reconstruction error
      const mse = tf.mean(tf.square(tf.sub(inputTensor, reconstruction)));
      const mseValue = await mse.data();
      
      // Clean up tensors
      inputTensor.dispose();
      reconstruction.dispose();
      mse.dispose();
      
      // Normalize the error to 0-1 range
      return Math.min((mseValue[0] || 0) / 10, 1.0); // Assuming max error is around 10
    } catch (error) {
      logger.error('Error in autoencoder detection:', error);
      return 0;
    }
  }

  /**
   * Detect anomalies using isolation forest
   */
  private async detectWithIsolationForest(data: number[]): Promise<number> {
    if (!this.isolationForest || data.length === 0) return 0;

    try {
      // Simplified isolation forest implementation
      // In production, use a proper ML library like scikit-learn equivalent
      
      // Calculate anomaly score based on distance from mean
      const mean = calculateMean(data);
      const std = calculateStandardDeviation(data, mean);
      
      // Calculate z-scores
      const zScores = data.map(val => Math.abs(calculateZScore(val, mean, std)));
      const maxZScore = Math.max(...zScores);
      
      // Convert to anomaly score (0-1)
      return Math.min(maxZScore / 3, 1.0);
    } catch (error) {
      logger.error('Error in isolation forest detection:', error);
      return 0;
    }
  }

  /**
   * Detect anomalies using statistical methods
   */
  private async detectWithStatisticalMethods(data: number[]): Promise<number> {
    if (data.length === 0) return 0;

    try {
      // Calculate various statistical measures
      const dataMean = calculateMean(data);
      const dataStd = calculateStandardDeviation(data, dataMean);
      
      // Calculate z-scores for outlier detection
      const zScores = data.map(val => Math.abs(calculateZScore(val, dataMean, dataStd)));
      const maxZScore = Math.max(...zScores);
      
      // Calculate IQR-based outliers
      const q1 = calculatePercentile(data, 25);
      const q3 = calculatePercentile(data, 75);
      const iqr = q3 - q1;
      const lowerBound = q1 - 1.5 * iqr;
      const upperBound = q3 + 1.5 * iqr;
      
      // Count outliers
      const outliers = data.filter(val => val < lowerBound || val > upperBound).length;
      
      // Calculate anomaly score based on multiple factors
      const zScoreAnomaly = Math.min(maxZScore / 3, 1.0); // Normalize z-score
      const outlierAnomaly = Math.min(outliers / data.length, 1.0); // Normalize outlier ratio
      const varianceAnomaly = Math.min(dataStd / dataMean, 1.0); // Coefficient of variation
      
      // Combine scores with weights
      const anomalyScore = (zScoreAnomaly * 0.4) + (outlierAnomaly * 0.4) + (varianceAnomaly * 0.2);
      
      return Math.min(anomalyScore, 1.0);
    } catch (error) {
      logger.error('Error in statistical anomaly detection:', error);
      return 0.5; // Default score on error
    }
  }

  /**
   * Ensemble results from multiple algorithms
   */
  private ensembleResults(results: number[]): number {
    if (results.length === 0) return 0;
    
    // Weighted ensemble (can be tuned based on model performance)
    const weights = [0.4, 0.3, 0.3]; // Autoencoder, Isolation Forest, Statistical
    
    let weightedSum = 0;
    let totalWeight = 0;
    
    results.forEach((result: number, index: number) => {
      const weight = weights[index] || 1 / results.length;
      weightedSum += result * weight;
      totalWeight += weight;
    });
    
    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  /**
   * Calculate confidence based on model agreement
   */
  private calculateConfidence(results: number[]): number {
    if (results.length === 0) return 0;
    
    // Calculate standard deviation of results
    const mean = results.reduce((sum, val) => sum + val, 0) / results.length;
    const variance = results.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / results.length;
    const stdDev = Math.sqrt(variance);
    
    // Higher agreement (lower std dev) means higher confidence
    const agreementScore = Math.max(0, 1 - stdDev);
    
    // Also consider the magnitude of the anomaly score
    const magnitudeScore = Math.max(...results);
    
    // Combine agreement and magnitude
    return (agreementScore * 0.6) + (magnitudeScore * 0.4);
  }

  /**
   * Generate explanation for the anomaly detection result
   */
  private generateExplanation(
    data: AnomalyDetectionData, 
    _results: number[], 
    ensembleScore: number
  ): AnomalyResult['explanation'] {
    const contributingFactors: string[] = [];
    const recommendations: string[] = [];

    // Analyze contributing factors
    if (data.networkTraffic && this.calculateNetworkScore(data.networkTraffic) > 0.7) {
      contributingFactors.push('Unusual network traffic patterns detected');
      recommendations.push('Review network logs for suspicious connections');
    }

    if (data.userBehavior && this.calculateBehaviorScore(data.userBehavior) > 0.7) {
      contributingFactors.push('Abnormal user behavior patterns identified');
      recommendations.push('Investigate user activity and access patterns');
    }

    if (data.systemMetrics && this.calculateSystemScore(data.systemMetrics) > 0.7) {
      contributingFactors.push('System metrics showing unusual patterns');
      recommendations.push('Check system performance and resource usage');
    }

    // Determine severity
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (ensembleScore > 0.9) severity = 'critical';
    else if (ensembleScore > 0.7) severity = 'high';
    else if (ensembleScore > 0.5) severity = 'medium';

    // Add general recommendations based on severity
    if (severity === 'critical' || severity === 'high') {
      recommendations.push('Immediate investigation required');
      recommendations.push('Consider implementing additional monitoring');
    }

    if (contributingFactors.length === 0) {
      contributingFactors.push('Multiple AI models detected subtle anomalies');
    }

    return {
      contributingFactors,
      severity,
      recommendations
    };
  }

  /**
   * Prepare input data for anomaly detection
   */
  private prepareInputData(data: AnomalyDetectionData): number[] {
    const features: number[] = [];
    
    // Network traffic features (normalize to 4 features)
    if (data.networkTraffic) {
      const networkFeatures = this.extractFeatures(data.networkTraffic);
      features.push(...networkFeatures);
    } else {
      features.push(0, 0, 0, 0);
    }
    
    // User behavior features
    if (data.userBehavior) {
      const behaviorFeatures = this.extractFeatures(data.userBehavior);
      features.push(...behaviorFeatures);
    } else {
      features.push(0, 0, 0);
    }
    
    // System metrics features
    if (data.systemMetrics) {
      const systemFeatures = this.extractFeatures(data.systemMetrics);
      features.push(...systemFeatures);
    } else {
      features.push(0, 0, 0);
    }
    
    return features;
  }

  /**
   * Extract features for ML model
   */
  private extractFeatures(data: number[]): number[] {
    if (data.length === 0) return new Array(50).fill(0);
    
    const features: number[] = [];
    
    // Basic statistics
    features.push(calculateMean(data));
    features.push(calculateStandardDeviation(data, calculateMean(data)));
    features.push(calculateMin(data));
    features.push(calculateMax(data));
    
    // Percentiles
    features.push(calculatePercentile(data, 25));
    features.push(calculatePercentile(data, 50));
    features.push(calculatePercentile(data, 75));
    features.push(calculatePercentile(data, 90));
    features.push(calculatePercentile(data, 95));
    
    // Additional features
    features.push(data.length);
    features.push(calculateMax(data) - calculateMin(data)); // Range
    
    // Pad with zeros if needed
    while (features.length < 50) {
      features.push(0);
    }
    
    return features.slice(0, 50);
  }

  /**
   * Calculate network traffic anomaly score
   */
  private calculateNetworkScore(networkData: number[]): number {
    if (networkData.length === 0) return 0;
    
    const dataMean = calculateMean(networkData);
    const dataStd = calculateStandardDeviation(networkData, dataMean);
    
    // Higher variance in network traffic might indicate anomaly
    const cv = dataStd / Math.max(dataMean, 1);
    return Math.min(cv, 1.0);
  }

  /**
   * Calculate user behavior anomaly score
   */
  private calculateBehaviorScore(behaviorData: number[]): number {
    if (behaviorData.length === 0) return 0;
    
    // Check for unusual patterns in user behavior
    const dataMax = calculateMax(behaviorData);
    const dataMin = calculateMin(behaviorData);
    const dataMean = calculateMean(behaviorData);
    
    // Calculate coefficient of variation
    const dataStd = calculateStandardDeviation(behaviorData, dataMean);
    const cv = dataStd / Math.max(dataMean, 1);
    
    // Check for sudden spikes or drops
    const range = dataMax - dataMin;
    const normalizedRange = range / Math.max(dataMean, 1);
    
    return Math.min((cv + normalizedRange) / 2, 1.0);
  }

  /**
   * Calculate system metrics anomaly score
   */
  private calculateSystemScore(systemData: number[]): number {
    if (systemData.length === 0) return 0;
    
    // Check for unusual system metrics
    const dataMean = calculateMean(systemData);
    
    // Calculate coefficient of variation
    const dataStd = calculateStandardDeviation(systemData, dataMean);
    const cv = dataStd / Math.max(dataMean, 1);
    
    // Check for resource exhaustion patterns
    const highUsageThreshold = 0.8;
    const highUsageCount = systemData.filter(val => val > highUsageThreshold).length;
    const highUsageRatio = highUsageCount / systemData.length;
    
    return Math.min((cv + highUsageRatio) / 2, 1.0);
  }

  /**
   * Update detection threshold
   */
  updateThreshold(newThreshold: number): void {
    if (newThreshold >= 0 && newThreshold <= 1) {
      this.threshold = newThreshold;
      logger.info(`Anomaly detection threshold updated to: ${newThreshold}`);
    } else {
      throw new Error('Threshold must be between 0 and 1');
    }
  }

  /**
   * Get service status with model information
   */
  getStatus(): { 
    isAvailable: boolean; 
    threshold: number;
    activeModel: string | null;
    modelAccuracy: number | null;
    algorithms: string[];
  } {
    return {
      isAvailable: true,
      threshold: this.threshold,
      activeModel: this.activeModel?.name || null,
      modelAccuracy: this.activeModel?.accuracy || null,
      algorithms: ['Autoencoder', 'Isolation Forest', 'Statistical Analysis']
    };
  }

  /**
   * Retrain the anomaly detection model
   */
  async retrainModel(trainingData: number[][]): Promise<void> {
    try {
      if (!this.activeModel) {
        throw new Error('No active model to retrain');
      }

      // Convert training data to tensors
      const inputTensor = tf.tensor2d(trainingData);
      const outputTensor = tf.tensor2d(trainingData); // Autoencoder: input = output

      // Train the model
      await this.modelManager.trainModel(
        this.activeModel.id,
        inputTensor,
        outputTensor,
        {
          epochs: 50,
          batchSize: 32,
          learningRate: 0.001,
          validationSplit: 0.2,
          earlyStoppingPatience: 10,
          callbacks: ['earlyStopping']
        }
      );

      // Reload the updated model
      await this.initializeModels();

      logger.info('Anomaly detection model retrained successfully');
    } catch (error) {
      logger.error('Error retraining anomaly detection model:', error);
      throw error;
    }
  }
} 