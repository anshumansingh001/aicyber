import logger from '../../utils/logger';

export interface NLPTextData {
  text: string;
  timestamp?: number;
  source?: string;
}

export interface NLPAnalysisResult {
  risk: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  entities: string[];
  keywords: string[];
  threats: string[];
  confidence: number;
  analysis: {
    threatLevel: 'low' | 'medium' | 'high' | 'critical';
    categories: string[];
    recommendations: string[];
  };
}

export class NLPSecurityService {
  private readonly threatKeywords = [
    'hack', 'attack', 'breach', 'vulnerability', 'exploit', 'malware', 'virus',
    'phishing', 'ddos', 'sql injection', 'xss', 'csrf', 'backdoor', 'trojan',
    'ransomware', 'spyware', 'keylogger', 'rootkit', 'botnet', 'zero-day'
  ];

  private readonly suspiciousPatterns = [
    /password/i,
    /login/i,
    /admin/i,
    /root/i,
    /sudo/i,
    /exec/i,
    /eval/i,
    /script/i,
    /alert/i,
    /confirm/i
  ];

  constructor() {
    logger.info('NLPSecurityService initialized');
  }

  /**
   * Analyze text for security threats using NLP
   */
  async analyzeText(data: NLPTextData): Promise<NLPAnalysisResult> {
    try {
      const { text } = data;
      
      // Extract entities and keywords
      const entities = this.extractEntities(text);
      const keywords = this.extractKeywords(text);
      
      // Analyze sentiment
      const sentiment = this.analyzeSentiment(text);
      
      // Detect threats
      const threats = this.detectThreats(text);
      
      // Calculate risk score
      const risk = this.calculateRiskScore(text, entities, keywords, threats);
      
      // Determine threat level
      const threatLevel = this.determineThreatLevel(risk);
      
      // Generate analysis
      const analysis = this.generateAnalysis(threatLevel, threats, entities);
      
      const result: NLPAnalysisResult = {
        risk,
        sentiment,
        entities,
        keywords,
        threats,
        confidence: this.calculateConfidence(text, entities, threats),
        analysis
      };

      logger.info('NLP analysis completed', { 
        risk, 
        sentiment, 
        threatLevel: analysis.threatLevel,
        entitiesCount: entities.length 
      });

      return result;
    } catch (error) {
      logger.error('Error in NLP analysis:', error);
      throw new Error(`NLP analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract named entities from text
   */
  private extractEntities(text: string): string[] {
    const entities: string[] = [];
    
    // Simple entity extraction based on patterns
    const patterns = [
      /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, // Names
      /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, // IP addresses
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email addresses
      /\bhttps?:\/\/[^\s]+/g, // URLs
      /\b[A-Z]{2,}\b/g // Acronyms
    ];
    
    patterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        entities.push(...matches);
      }
    });
    
    return [...new Set(entities)]; // Remove duplicates
  }

  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string): string[] {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    // Simple keyword extraction based on frequency and importance
    const wordCount: { [key: string]: number } = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });
    
    // Sort by frequency and return top keywords
    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  /**
   * Analyze sentiment of text
   */
  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ['good', 'secure', 'safe', 'protected', 'trusted', 'verified'];
    const negativeWords = ['bad', 'unsafe', 'vulnerable', 'threat', 'attack', 'breach', 'hack'];
    
    const words = text.toLowerCase().split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;
    
    words.forEach(word => {
      if (positiveWords.includes(word)) positiveCount++;
      if (negativeWords.includes(word)) negativeCount++;
    });
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  /**
   * Detect security threats in text
   */
  private detectThreats(text: string): string[] {
    const threats: string[] = [];
    const lowerText = text.toLowerCase();
    
    // Check for threat keywords
    this.threatKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        threats.push(keyword);
      }
    });
    
    // Check for suspicious patterns
    this.suspiciousPatterns.forEach(pattern => {
      if (pattern.test(text)) {
        threats.push(pattern.source || 'suspicious_pattern');
      }
    });
    
    // Check for potential code injection
    if (this.detectCodeInjection(text)) {
      threats.push('potential_code_injection');
    }
    
    return [...new Set(threats)]; // Remove duplicates
  }

  /**
   * Detect potential code injection
   */
  private detectCodeInjection(text: string): boolean {
    const injectionPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /eval\s*\(/i,
      /exec\s*\(/i,
      /system\s*\(/i,
      /union\s+select/i,
      /drop\s+table/i,
      /insert\s+into/i
    ];
    
    return injectionPatterns.some(pattern => pattern.test(text));
  }

  /**
   * Calculate risk score based on analysis
   */
  private calculateRiskScore(
    text: string, 
    entities: string[], 
    _keywords: string[], 
    threats: string[]
  ): number {
    let score = 0;
    
    // Base score from text length
    score += Math.min(text.length / 1000, 0.1);
    
    // Score from entities
    score += Math.min(entities.length * 0.05, 0.2);
    
    // Score from threats
    score += Math.min(threats.length * 0.15, 0.5);
    
    return Math.min(score, 1.0);
  }

  /**
   * Determine threat level based on risk score
   */
  private determineThreatLevel(risk: number): 'low' | 'medium' | 'high' | 'critical' {
    if (risk < 0.25) return 'low';
    if (risk < 0.5) return 'medium';
    if (risk < 0.75) return 'high';
    return 'critical';
  }

  /**
   * Generate analysis and recommendations
   */
  private generateAnalysis(
    threatLevel: 'low' | 'medium' | 'high' | 'critical',
    threats: string[],
    entities: string[]
  ): {
    threatLevel: 'low' | 'medium' | 'high' | 'critical';
    categories: string[];
    recommendations: string[];
  } {
    const categories: string[] = [];
    const recommendations: string[] = [];
    
    // Determine categories
    if (threats.some(t => t.includes('injection'))) {
      categories.push('code_injection');
      recommendations.push('Review input validation and sanitization');
    }
    
    if (threats.some(t => t.includes('phishing'))) {
      categories.push('social_engineering');
      recommendations.push('Implement user awareness training');
    }
    
    if (entities.some(e => /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(e))) {
      categories.push('network_information');
      recommendations.push('Review network information disclosure');
    }
    
    // Add general recommendations based on threat level
    switch (threatLevel) {
      case 'critical':
        recommendations.push('Immediate security review required');
        recommendations.push('Consider incident response procedures');
        break;
      case 'high':
        recommendations.push('Enhanced monitoring recommended');
        recommendations.push('Review security controls');
        break;
      case 'medium':
        recommendations.push('Monitor for similar patterns');
        recommendations.push('Review security policies');
        break;
      case 'low':
        recommendations.push('Continue normal monitoring');
        break;
    }
    
    return {
      threatLevel,
      categories,
      recommendations
    };
  }

  /**
   * Calculate confidence in analysis
   */
  private calculateConfidence(text: string, entities: string[], threats: string[]): number {
    let confidence = 0.5; // Base confidence
    
    // Higher confidence with more entities
    confidence += Math.min(entities.length * 0.05, 0.2);
    
    // Higher confidence with detected threats
    confidence += Math.min(threats.length * 0.1, 0.2);
    
    // Higher confidence with longer text (more context)
    confidence += Math.min(text.length / 1000, 0.1);
    
    return Math.min(confidence, 1.0);
  }

  /**
   * Get service status
   */
  getStatus(): { isAvailable: boolean; threatKeywordsCount: number } {
    return {
      isAvailable: true,
      threatKeywordsCount: this.threatKeywords.length
    };
  }
} 