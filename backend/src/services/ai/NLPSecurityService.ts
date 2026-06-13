import * as tf from '@tensorflow/tfjs-node';
import * as natural from 'natural';
import * as compromise from 'compromise';
import Sentiment from 'sentiment';
import { AIModelManager, AIModel } from './AIModelManager';
import logger from '../../utils/logger';

export interface NLPTextData {
  text: string;
  timestamp?: number;
  source?: string;
  context?: string;
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
  modelInfo: {
    modelUsed: string;
    algorithm: string;
    features: number[];
  };
  explainability: {
    contributingFactors: string[];
    featureImportance: Record<string, number>;
    confidenceFactors: string[];
  };
}

export class NLPSecurityService {
  private readonly threatKeywords = [
    'hack', 'attack', 'breach', 'vulnerability', 'exploit', 'malware', 'virus',
    'phishing', 'ddos', 'sql injection', 'xss', 'csrf', 'backdoor', 'trojan',
    'ransomware', 'spyware', 'keylogger', 'rootkit', 'botnet', 'zero-day',
    'privilege escalation', 'data exfiltration', 'credential stuffing',
    'man-in-the-middle', 'session hijacking', 'buffer overflow', 'format string',
    'integer overflow', 'race condition', 'time-of-check-to-time-of-use'
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
    /confirm/i,
    /document\.cookie/i,
    /localStorage/i,
    /sessionStorage/i,
    /window\.location/i,
    /history\.pushState/i
  ];

  private readonly securityEntities = [
    'IP_ADDRESS', 'EMAIL', 'URL', 'DOMAIN', 'HASH', 'CVE_ID', 'PORT', 'PROTOCOL'
  ];

  private modelManager: AIModelManager;
  private activeModel: AIModel | null = null;
  private neuralModel: tf.LayersModel | null = null;
  private tokenizer: natural.WordTokenizer;
  private sentimentAnalyzer: Sentiment;
  private tfidf: natural.TfIdf;

  constructor() {
    logger.info('NLPSecurityService initialized');
    this.modelManager = new AIModelManager();
    this.tokenizer = new natural.WordTokenizer();
    this.sentimentAnalyzer = new Sentiment();
    this.tfidf = new natural.TfIdf();
    this.initializeModels();
  }

  /**
   * Initialize advanced NLP models
   */
  private async initializeModels(): Promise<void> {
    try {
      // Get the NLP model from model manager
      const models = this.modelManager.getModels();
      this.activeModel = models.find(m => m.type === 'nlp') || null;

      if (this.activeModel) {
        const modelInstance = this.modelManager.getActiveModel(this.activeModel.id);
        if (modelInstance) {
          this.neuralModel = modelInstance;
          logger.info(`Loaded NLP model: ${this.activeModel.name}`);
        }
      }

      // Initialize TF-IDF with security corpus
      this.initializeTFIDF();

      logger.info('Advanced NLP models initialized');
    } catch (error) {
      logger.error('Error initializing NLP models:', error);
    }
  }

  /**
   * Initialize TF-IDF with security-related corpus
   */
  private initializeTFIDF(): void {
    // Add security-related documents to TF-IDF
    const securityDocs = [
      'cybersecurity threat detection analysis',
      'network security monitoring and alerting',
      'vulnerability assessment and penetration testing',
      'incident response and forensics',
      'malware analysis and reverse engineering',
      'security information and event management',
      'identity and access management',
      'data loss prevention and encryption'
    ];

    securityDocs.forEach((doc, index) => {
      this.tfidf.addDocument(doc, `security_doc_${index}`);
    });
  }

  /**
   * Analyze text for security threats using advanced NLP
   */
  async analyzeText(data: NLPTextData): Promise<NLPAnalysisResult> {
    try {
      const { text } = data;
      
      // Extract entities and keywords using advanced NLP
      const entities = await this.extractEntitiesAdvanced(text);
      const keywords = await this.extractKeywordsAdvanced(text);
      
      // Analyze sentiment using multiple approaches
      const sentiment = await this.analyzeSentimentAdvanced(text);
      
      // Detect threats using ensemble approach
      const threats = await this.detectThreatsAdvanced(text, entities, keywords);
      
      // Calculate risk score using neural model
      const risk = await this.calculateRiskScoreAdvanced(text, entities, keywords, threats);
      
      // Determine threat level
      const threatLevel = this.determineThreatLevel(risk);
      
      // Generate comprehensive analysis
      const analysis = this.generateAnalysisAdvanced(threatLevel, threats, entities, text);
      
      // Generate explainability information
      const explainability = this.generateExplainability(text, entities, threats, risk);

      const result: NLPAnalysisResult = {
        risk,
        sentiment,
        entities,
        keywords,
        threats,
        confidence: this.calculateConfidenceAdvanced(text, entities, threats, risk),
        analysis,
        modelInfo: {
          modelUsed: this.activeModel?.name || 'Advanced NLP Ensemble',
          algorithm: 'Neural Network + TF-IDF + Rule-based',
          features: this.extractFeatures(text)
        },
        explainability
      };

      logger.info('Advanced NLP analysis completed', { 
        risk, 
        sentiment, 
        threatLevel: analysis.threatLevel,
        entitiesCount: entities.length,
        modelUsed: result.modelInfo.modelUsed
      });

      return result;
    } catch (error) {
      logger.error('Error in advanced NLP analysis:', error);
      throw new Error(`NLP analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract entities using advanced NLP techniques
   */
  private async extractEntitiesAdvanced(text: string): Promise<string[]> {
    const entities: string[] = [];
    
    try {
      // Use compromise for advanced entity extraction
      const doc = (compromise as any).nlp(text);
      
      // Extract various entity types
      const emails = doc.emails().out('array');
      const urls = doc.urls().out('array');
      const phoneNumbers = doc.phoneNumbers().out('array');
      const organizations = doc.organizations().out('array');
      const people = doc.people().out('array');
      const places = doc.places().out('array');
      
      // Extract IP addresses using regex
      const ipAddresses = text.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g) || [];
      
      // Extract domains
      const domains = text.match(/\b[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.([a-zA-Z]{2,})\b/g) || [];
      
      // Extract potential CVE IDs
      const cveIds = text.match(/CVE-\d{4}-\d{4,7}/gi) || [];
      
      // Extract potential hashes
      const hashes = text.match(/\b[a-fA-F0-9]{32,64}\b/g) || [];
      
      // Combine all entities
      entities.push(
        ...emails,
        ...urls,
        ...phoneNumbers,
        ...organizations,
        ...people,
        ...places,
        ...ipAddresses,
        ...domains,
        ...cveIds,
        ...hashes
      );
      
      // Remove duplicates and filter
      return [...new Set(entities)].filter(entity => entity.length > 0);
    } catch (error) {
      logger.error('Error in advanced entity extraction:', error);
      return this.extractEntities(text); // Fallback to basic extraction
    }
  }

  /**
   * Extract keywords using advanced NLP techniques
   */
  private async extractKeywordsAdvanced(text: string): Promise<string[]> {
    try {
      // Tokenize and clean text
      const tokens = this.tokenizer.tokenize(text.toLowerCase()) || [];
      const cleanTokens = tokens.filter(token => 
        token && token.length > 2 && !/^[0-9]+$/.test(token)
      );
      
      // Add text to TF-IDF
      this.tfidf.addDocument(text, 'current_doc');
      
      // Get TF-IDF scores - use document index instead of string
      const docIndex = this.tfidf.documents.length - 1;
      const tfidfScores = this.tfidf.listTerms(docIndex);
      
      // Extract keywords based on TF-IDF scores
      const keywords = tfidfScores
        .slice(0, 15) // Top 15 terms
        .map(term => term.term)
        .filter(term => term.length > 2);
      
      // Also include security-related terms
      const securityTerms = cleanTokens.filter(token => 
        this.threatKeywords.some(keyword => 
          token.includes(keyword) || keyword.includes(token)
        )
      );
      
      // Combine and deduplicate
      const allKeywords = [...keywords, ...securityTerms];
      return [...new Set(allKeywords)].slice(0, 20);
    } catch (error) {
      logger.error('Error in advanced keyword extraction:', error);
      return this.extractKeywords(text); // Fallback to basic extraction
    }
  }

  /**
   * Analyze sentiment using multiple approaches
   */
  private async analyzeSentimentAdvanced(text: string): Promise<'positive' | 'negative' | 'neutral'> {
    try {
      // Use sentiment library
      const sentimentResult = this.sentimentAnalyzer.analyze(text);
      
      // Use neural model if available
      let neuralSentiment: number = 0;
      if (this.neuralModel) {
        const features = this.extractFeatures(text);
        const inputTensor = tf.tensor2d([features], [1, features.length]);
        const prediction = this.neuralModel.predict(inputTensor) as tf.Tensor;
        const predictionData = await prediction.data();
        neuralSentiment = predictionData[0] || 0; // Handle undefined
        inputTensor.dispose();
        prediction.dispose();
      }
      
      // Combine results
      const combinedScore = (sentimentResult.score / 10) + (neuralSentiment * 0.5);
      
      if (combinedScore > 0.1) return 'positive';
      if (combinedScore < -0.1) return 'negative';
      return 'neutral';
    } catch (error) {
      logger.error('Error in advanced sentiment analysis:', error);
      return this.analyzeSentiment(text); // Fallback to basic analysis
    }
  }

  /**
   * Detect threats using advanced techniques
   */
  private async detectThreatsAdvanced(
    text: string, 
    _entities: string[], 
    _keywords: string[]
  ): Promise<string[]> {
    const threats: string[] = [];
    
    try {
      // Check for threat keywords
      this.threatKeywords.forEach(keyword => {
        if (text.toLowerCase().includes(keyword.toLowerCase())) {
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
      if (this.detectCodeInjectionAdvanced(text)) {
        threats.push('potential_code_injection');
      }
      
      // Check for data exfiltration indicators
      if (this.detectDataExfiltration(text)) {
        threats.push('potential_data_exfiltration');
      }
      
      // Check for privilege escalation indicators
      if (this.detectPrivilegeEscalation(text)) {
        threats.push('potential_privilege_escalation');
      }
      
      // Use neural model for threat classification
      if (this.neuralModel) {
        const features = this.extractFeatures(text);
        const inputTensor = tf.tensor2d([features], [1, features.length]);
        const prediction = this.neuralModel.predict(inputTensor) as tf.Tensor;
        const predictionData = await prediction.data();
        
        // If neural model predicts high threat probability
        if ((predictionData[0] || 0) > 0.7) {
          threats.push('ai_detected_threat');
        }
        
        inputTensor.dispose();
        prediction.dispose();
      }
      
      return [...new Set(threats)]; // Remove duplicates
    } catch (error) {
      logger.error('Error in advanced threat detection:', error);
      return this.detectThreats(text); // Fallback to basic detection
    }
  }

  /**
   * Calculate risk score using advanced methods
   */
  private async calculateRiskScoreAdvanced(
    text: string, 
    entities: string[], 
    keywords: string[], 
    threats: string[]
  ): Promise<number> {
    try {
      let riskScore = 0;
      
      // Base risk from threats
      riskScore += threats.length * 0.15;
      
      // Risk from entities
      riskScore += entities.filter(entity => 
        this.securityEntities.some(securityEntity => 
          entity.includes(securityEntity.toLowerCase())
        )
      ).length * 0.1;
      
      // Risk from keywords
      riskScore += keywords.filter(keyword => 
        this.threatKeywords.includes(keyword)
      ).length * 0.05;
      
      // Risk from text length (longer texts might contain more information)
      riskScore += Math.min(text.length / 1000, 0.2);
      
      // Use neural model for risk assessment
      if (this.neuralModel) {
        const features = this.extractFeatures(text);
        const inputTensor = tf.tensor2d([features], [1, features.length]);
        const prediction = this.neuralModel.predict(inputTensor) as tf.Tensor;
        const predictionData = await prediction.data();
        riskScore += (predictionData[0] || 0) * 0.3; // Neural model contributes 30%
        inputTensor.dispose();
        prediction.dispose();
      }
      
      return Math.min(riskScore, 1.0);
    } catch (error) {
      logger.error('Error in advanced risk calculation:', error);
      return this.calculateRiskScore(text, entities, keywords, threats);
    }
  }

  /**
   * Generate advanced analysis
   */
  private generateAnalysisAdvanced(
    threatLevel: 'low' | 'medium' | 'high' | 'critical',
    threats: string[],
    entities: string[],
    _text: string
  ): {
    threatLevel: 'low' | 'medium' | 'high' | 'critical';
    categories: string[];
    recommendations: string[];
  } {
    const categories: string[] = [];
    const recommendations: string[] = [];

    // Categorize threats
    if (threats.some(t => t.includes('injection'))) {
      categories.push('Code Injection');
      recommendations.push('Implement input validation and sanitization');
      recommendations.push('Use parameterized queries for database operations');
    }

    if (threats.some(t => t.includes('phishing'))) {
      categories.push('Social Engineering');
      recommendations.push('Implement email security filters');
      recommendations.push('Train users on phishing awareness');
    }

    if (threats.some(t => t.includes('ddos'))) {
      categories.push('DDoS Attack');
      recommendations.push('Implement DDoS protection services');
      recommendations.push('Monitor network traffic patterns');
    }

    if (threats.some(t => t.includes('malware'))) {
      categories.push('Malware');
      recommendations.push('Update antivirus signatures');
      recommendations.push('Implement application whitelisting');
    }

    if (entities.some(e => e.includes('@'))) {
      categories.push('Data Exposure');
      recommendations.push('Review data handling procedures');
      recommendations.push('Implement data loss prevention');
    }

    // Add severity-based recommendations
    if (threatLevel === 'critical' || threatLevel === 'high') {
      recommendations.push('Immediate security review required');
      recommendations.push('Consider incident response procedures');
      recommendations.push('Notify security team immediately');
    }

    if (categories.length === 0) {
      categories.push('General Security');
      recommendations.push('Conduct regular security assessments');
    }

    return {
      threatLevel,
      categories,
      recommendations
    };
  }

  /**
   * Generate explainability information
   */
  private generateExplainability(
    text: string,
    entities: string[],
    threats: string[],
    _risk: number
  ): {
    contributingFactors: string[];
    featureImportance: Record<string, number>;
    confidenceFactors: string[];
  } {
    const contributingFactors: string[] = [];
    const featureImportance: Record<string, number> = {};
    const confidenceFactors: string[] = [];

    // Analyze contributing factors
    if (threats.length > 0) {
      contributingFactors.push(`${threats.length} threat indicators detected`);
      featureImportance['threat_count'] = threats.length * 0.15;
    }

    if (entities.length > 0) {
      contributingFactors.push(`${entities.length} security-relevant entities found`);
      featureImportance['entity_count'] = entities.length * 0.1;
    }

    if (text.length > 100) {
      contributingFactors.push('Text contains substantial security-relevant content');
      featureImportance['text_length'] = Math.min(text.length / 1000, 0.2);
    }

    // Confidence factors
    if (this.neuralModel) {
      confidenceFactors.push('Neural model analysis performed');
    }

    if (threats.length > 2) {
      confidenceFactors.push('Multiple threat indicators detected');
    }

    if (entities.some(e => e.includes('CVE'))) {
      confidenceFactors.push('Known vulnerability references found');
    }

    return {
      contributingFactors,
      featureImportance,
      confidenceFactors
    };
  }

  /**
   * Extract features for neural model
   */
  private extractFeatures(text: string): number[] {
    const features: number[] = [];
    
    // Text length features
    features.push(Math.min(text.length / 1000, 1.0));
    features.push(text.split(' ').length / 100);
    
    // Threat keyword features
    const threatCount = this.threatKeywords.filter(keyword => 
      text.toLowerCase().includes(keyword.toLowerCase())
    ).length;
    features.push(Math.min(threatCount / 10, 1.0));
    
    // Pattern features
    const patternCount = this.suspiciousPatterns.filter(pattern => 
      pattern.test(text)
    ).length;
    features.push(Math.min(patternCount / 5, 1.0));
    
    // Entity features
    const entityCount = this.extractEntities(text).length;
    features.push(Math.min(entityCount / 10, 1.0));
    
    // Sentiment features
    const sentimentResult = this.sentimentAnalyzer.analyze(text);
    features.push((sentimentResult.score + 10) / 20); // Normalize to 0-1
    
    // Pad to required length (50 features for the model)
    while (features.length < 50) {
      features.push(0);
    }
    
    return features.slice(0, 50);
  }

  /**
   * Detect advanced code injection patterns
   */
  private detectCodeInjectionAdvanced(text: string): boolean {
    const injectionPatterns = [
      /<script[^>]*>/i,
      /javascript:/i,
      /vbscript:/i,
      /on\w+\s*=/i,
      /eval\s*\(/i,
      /exec\s*\(/i,
      /system\s*\(/i,
      /shell_exec\s*\(/i,
      /passthru\s*\(/i,
      /`.*`/,
      /\$\{.*\}/,
      /<iframe[^>]*>/i,
      /<object[^>]*>/i,
      /<embed[^>]*>/i
    ];
    
    return injectionPatterns.some(pattern => pattern.test(text));
  }

  /**
   * Detect data exfiltration indicators
   */
  private detectDataExfiltration(text: string): boolean {
    const exfiltrationPatterns = [
      /download.*data/i,
      /upload.*file/i,
      /export.*data/i,
      /backup.*database/i,
      /dump.*table/i,
      /extract.*information/i,
      /copy.*files/i,
      /transfer.*data/i
    ];
    
    return exfiltrationPatterns.some(pattern => pattern.test(text));
  }

  /**
   * Detect privilege escalation indicators
   */
  private detectPrivilegeEscalation(text: string): boolean {
    const escalationPatterns = [
      /sudo.*su/i,
      /runas.*admin/i,
      /elevate.*privileges/i,
      /escalate.*permissions/i,
      /admin.*access/i,
      /root.*shell/i,
      /privilege.*escalation/i
    ];
    
    return escalationPatterns.some(pattern => pattern.test(text));
  }

  // Fallback methods (original implementations)
  private extractEntities(text: string): string[] {
    const entities: string[] = [];
    
    const patterns = [
      /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g,
      /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      /\bhttps?:\/\/[^\s]+/g,
      /\b[A-Z]{2,}\b/g
    ];
    
    patterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        entities.push(...matches);
      }
    });
    
    return [...new Set(entities)];
  }

  private extractKeywords(text: string): string[] {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    const wordCount: { [key: string]: number } = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });
    
    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

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

  private detectThreats(text: string): string[] {
    const threats: string[] = [];
    const lowerText = text.toLowerCase();
    
    this.threatKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        threats.push(keyword);
      }
    });
    
    this.suspiciousPatterns.forEach(pattern => {
      if (pattern.test(text)) {
        threats.push(pattern.source || 'suspicious_pattern');
      }
    });
    
    if (this.detectCodeInjection(text)) {
      threats.push('potential_code_injection');
    }
    
    return [...new Set(threats)];
  }

  private detectCodeInjection(text: string): boolean {
    const injectionPatterns = [
      /<script/i,
      /javascript:/i,
      /vbscript:/i,
      /on\w+\s*=/i
    ];
    
    return injectionPatterns.some(pattern => pattern.test(text));
  }

  private calculateRiskScore(
    text: string, 
    entities: string[], 
    _keywords: string[], 
    threats: string[]
  ): number {
    let risk = 0;
    
    // Base risk from threats
    risk += threats.length * 0.2;
    
    // Risk from entities
    risk += entities.length * 0.1;
    
    // Risk from text length
    risk += Math.min(text.length / 1000, 0.3);
    
    return Math.min(risk, 1.0);
  }

  private calculateConfidenceAdvanced(
    text: string, 
    entities: string[], 
    threats: string[], 
    _risk: number
  ): number {
    let confidence = 0.5; // Base confidence
    
    // Higher confidence with more entities
    confidence += Math.min(entities.length * 0.05, 0.2);
    
    // Higher confidence with more threats
    confidence += Math.min(threats.length * 0.1, 0.2);
    
    // Higher confidence with neural model
    if (this.neuralModel) {
      confidence += 0.1;
    }
    
    // Higher confidence with longer text
    confidence += Math.min(text.length / 2000, 0.1);
    
    return Math.min(confidence, 1.0);
  }

  private determineThreatLevel(risk: number): 'low' | 'medium' | 'high' | 'critical' {
    if (risk > 0.8) return 'critical';
    if (risk > 0.6) return 'high';
    if (risk > 0.3) return 'medium';
    return 'low';
  }

  /**
   * Get service status with model information
   */
  getStatus(): { 
    isAvailable: boolean; 
    threatKeywordsCount: number;
    activeModel: string | null;
    modelAccuracy: number | null;
    algorithms: string[];
  } {
    return {
      isAvailable: true,
      threatKeywordsCount: this.threatKeywords.length,
      activeModel: this.activeModel?.name || null,
      modelAccuracy: this.activeModel?.accuracy || null,
      algorithms: ['Neural Network', 'TF-IDF', 'Rule-based', 'Sentiment Analysis']
    };
  }

  /**
   * Retrain the NLP model
   */
  async retrainModel(trainingData: { text: string; label: number }[]): Promise<void> {
    try {
      if (!this.activeModel) {
        throw new Error('No active model to retrain');
      }

      // Prepare training data
      const features = trainingData.map(item => this.extractFeatures(item.text));
      const labels = trainingData.map(item => {
        // Convert to one-hot encoding for 4 classes
        const oneHot = [0, 0, 0, 0];
        oneHot[Math.floor(item.label * 3)] = 1; // Map 0-1 to 0-3 classes
        return oneHot;
      });

      // Convert to tensors
      const inputTensor = tf.tensor2d(features);
      const outputTensor = tf.tensor2d(labels);

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

      logger.info('NLP model retrained successfully');
    } catch (error) {
      logger.error('Error retraining NLP model:', error);
      throw error;
    }
  }
} 