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

  constructor() {
    logger.info('PredictiveAnalyticsService initialized');
  }

  /**
   * Predict potential security threats
   */
  async predictThreats(data: PredictionData): Promise<PredictionResult> {
    try {
      const { historicalEvents, predictionHorizon } = data;
      
      // Analyze historical patterns
      const patterns = this.analyzePatterns(historicalEvents);
      
      // Generate predictions
      const threats = this.generateThreatPredictions(patterns, predictionHorizon);
      
      // Analyze trends
      const trends = this.analyzeTrends(historicalEvents);
      
      // Calculate overall risk score
      const riskScore = this.calculateRiskScore(threats, trends);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(threats, trends, riskScore);
      
      const result: PredictionResult = {
        threats,
        trends,
        riskScore,
        recommendations,
        confidence: this.calculateConfidence(historicalEvents, threats, trends)
      };

      logger.info('Predictive analytics completed', { 
        threatsCount: threats.length,
        riskScore,
        confidence: result.confidence
      });

      return result;
    } catch (error) {
      logger.error('Error in predictive analytics:', error);
      throw new Error(`Predictive analytics failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyze patterns in historical events
   */
  private analyzePatterns(events: SecurityEvent[]): any {
    const patterns: any = {};
    
    // Group events by type
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
    
    // Convert to percentages
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
    
    // Convert to percentages
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
   * Generate threat predictions
   */
  private generateThreatPredictions(patterns: any, horizon: string): Array<{
    type: string;
    probability: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    timeframe: string;
    confidence: number;
  }> {
    const predictions: Array<{
      type: string;
      probability: number;
      severity: 'low' | 'medium' | 'high' | 'critical';
      timeframe: string;
      confidence: number;
    }> = [];
    
    Object.entries(patterns).forEach(([type, pattern]: [string, any]) => {
      if (pattern.count > 0) {
        // Calculate probability based on frequency and recent activity
        const probability = Math.min(pattern.frequency * 2, 0.9);
        
        // Determine severity based on historical distribution
        const severity = this.determinePredictedSeverity(pattern.severityDistribution);
        
        // Calculate confidence based on data quality
        const confidence = Math.min(pattern.count / 10, 1.0);
        
        predictions.push({
          type,
          probability,
          severity,
          timeframe: horizon,
          confidence
        });
      }
    });
    
    return predictions.sort((a, b) => b.probability - a.probability);
  }

  /**
   * Determine predicted severity based on distribution
   */
  private determinePredictedSeverity(distribution: { [key: string]: number }): 'low' | 'medium' | 'high' | 'critical' {
    // Find the severity with the highest probability
    let maxProb = 0;
    let predictedSeverity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    
    Object.entries(distribution).forEach(([severity, prob]) => {
      if (prob > maxProb) {
        maxProb = prob;
        predictedSeverity = severity as 'low' | 'medium' | 'high' | 'critical';
      }
    });
    
    return predictedSeverity;
  }

  /**
   * Analyze trends in historical data
   */
  private analyzeTrends(events: SecurityEvent[]): Array<{
    metric: string;
    direction: 'increasing' | 'decreasing' | 'stable';
    rate: number;
    confidence: number;
  }> {
    const trends: Array<{
      metric: string;
      direction: 'increasing' | 'decreasing' | 'stable';
      rate: number;
      confidence: number;
    }> = [];
    
    // Analyze event frequency trend
    const frequencyTrend = this.calculateFrequencyTrend(events);
    trends.push({
      metric: 'event_frequency',
      direction: frequencyTrend.direction,
      rate: frequencyTrend.rate,
      confidence: frequencyTrend.confidence
    });
    
    // Analyze severity trend
    const severityTrend = this.calculateSeverityTrend(events);
    trends.push({
      metric: 'event_severity',
      direction: severityTrend.direction,
      rate: severityTrend.rate,
      confidence: severityTrend.confidence
    });
    
    return trends;
  }

  /**
   * Calculate frequency trend
   */
  private calculateFrequencyTrend(events: SecurityEvent[]): {
    direction: 'increasing' | 'decreasing' | 'stable';
    rate: number;
    confidence: number;
  } {
    if (events.length < 2) {
      return { direction: 'stable', rate: 0, confidence: 0 };
    }
    
    // Split events into two time periods
    const sortedEvents = events.sort((a, b) => a.timestamp - b.timestamp);
    const midPoint = Math.floor(sortedEvents.length / 2);
    const firstHalf = sortedEvents.slice(0, midPoint);
    const secondHalf = sortedEvents.slice(midPoint);
    
    const firstRate = firstHalf.length;
    const secondRate = secondHalf.length;
    
    let direction: 'increasing' | 'decreasing' | 'stable';
    let rate = 0;
    
    if (secondRate > firstRate * 1.2) {
      direction = 'increasing';
      rate = (secondRate - firstRate) / firstRate;
    } else if (firstRate > secondRate * 1.2) {
      direction = 'decreasing';
      rate = (firstRate - secondRate) / firstRate;
    } else {
      direction = 'stable';
      rate = 0;
    }
    
    const confidence = Math.min(events.length / 20, 1.0);
    
    return { direction, rate, confidence };
  }

  /**
   * Calculate severity trend
   */
  private calculateSeverityTrend(events: SecurityEvent[]): {
    direction: 'increasing' | 'decreasing' | 'stable';
    rate: number;
    confidence: number;
  } {
    if (events.length < 2) {
      return { direction: 'stable', rate: 0, confidence: 0 };
    }
    
    const severityValues = { low: 1, medium: 2, high: 3, critical: 4 };
    
    // Split events into two time periods
    const sortedEvents = events.sort((a, b) => a.timestamp - b.timestamp);
    const midPoint = Math.floor(sortedEvents.length / 2);
    const firstHalf = sortedEvents.slice(0, midPoint);
    const secondHalf = sortedEvents.slice(midPoint);
    
    const firstAvg = firstHalf.reduce((sum, e) => sum + severityValues[e.severity], 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, e) => sum + severityValues[e.severity], 0) / secondHalf.length;
    
    let direction: 'increasing' | 'decreasing' | 'stable';
    let rate = 0;
    
    if (secondAvg > firstAvg * 1.1) {
      direction = 'increasing';
      rate = (secondAvg - firstAvg) / firstAvg;
    } else if (firstAvg > secondAvg * 1.1) {
      direction = 'decreasing';
      rate = (firstAvg - secondAvg) / firstAvg;
    } else {
      direction = 'stable';
      rate = 0;
    }
    
    const confidence = Math.min(events.length / 20, 1.0);
    
    return { direction, rate, confidence };
  }

  /**
   * Calculate risk score based on threats and trends
   */
  private calculateRiskScore(
    threats: Array<{ probability: number; severity: string }>,
    trends: Array<{ direction: string; rate: number }>
  ): number {
    let score = 0;
    
    const severityValues: { [key: string]: number } = { 
      low: 0.25, 
      medium: 0.5, 
      high: 0.75, 
      critical: 1.0 
    };
    
    // Score from threats
    threats.forEach(threat => {
      const severityValue = severityValues[threat.severity] || 0.5;
      score += threat.probability * severityValue;
    });
    
    // Score from trends
    trends.forEach(trend => {
      if (trend.direction === 'increasing') {
        score += Math.min(trend.rate * 0.1, 0.2);
      }
    });
    
    return Math.min(score, 1.0);
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
    
    // Recommendations based on high-probability threats
    threats.filter(t => t.probability > 0.7).forEach(threat => {
      recommendations.push(`Prepare for potential ${threat.type} attacks`);
    });
    
    // Recommendations based on trends
    trends.forEach(trend => {
      if (trend.direction === 'increasing') {
        recommendations.push(`Monitor ${trend.metric} trend closely`);
      }
    });
    
    // General recommendations based on risk score
    if (riskScore > 0.8) {
      recommendations.push('Implement enhanced security measures');
      recommendations.push('Consider incident response preparation');
    } else if (riskScore > 0.5) {
      recommendations.push('Review and update security policies');
      recommendations.push('Increase monitoring frequency');
    } else {
      recommendations.push('Continue normal security monitoring');
    }
    
    return recommendations;
  }

  /**
   * Calculate confidence in predictions
   */
  private calculateConfidence(
    events: SecurityEvent[],
    threats: Array<{ confidence: number }>,
    trends: Array<{ confidence: number }>
  ): number {
    let confidence = 0.5; // Base confidence
    
    // Higher confidence with more historical data
    confidence += Math.min(events.length / 100, 0.3);
    
    // Average confidence from threats
    if (threats.length > 0) {
      const avgThreatConfidence = threats.reduce((sum, t) => sum + t.confidence, 0) / threats.length;
      confidence += avgThreatConfidence * 0.1;
    }
    
    // Average confidence from trends
    if (trends.length > 0) {
      const avgTrendConfidence = trends.reduce((sum, t) => sum + t.confidence, 0) / trends.length;
      confidence += avgTrendConfidence * 0.1;
    }
    
    return Math.min(confidence, 1.0);
  }

  /**
   * Get service status
   */
  getStatus(): { isAvailable: boolean; eventTypesCount: number } {
    return {
      isAvailable: true,
      eventTypesCount: this.eventTypes.length
    };
  }
} 