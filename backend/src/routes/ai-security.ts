import { Router, Request, Response } from 'express';
import { AnomalyDetectionService } from '../services/ai/AnomalyDetectionService';
import { NLPSecurityService } from '../services/ai/NLPSecurityService';
import { PredictiveAnalyticsService } from '../services/ai/PredictiveAnalyticsService';
import logger from '../utils/logger';

const router = Router();

// Initialize AI services
const anomalyDetectionService = new AnomalyDetectionService();
const nlpSecurityService = new NLPSecurityService();
const predictiveAnalyticsService = new PredictiveAnalyticsService();

/**
 * @route POST /api/ai-security/anomaly-detection
 * @desc Detect anomalies in security data
 * @access Private
 */
router.post('/anomaly-detection', async (req: Request, res: Response) => {
  try {
    const { data, threshold } = req.body;

    if (!data) {
      return res.status(400).json({
        success: false,
        error: 'Data is required for anomaly detection'
      });
    }

    const result = await anomalyDetectionService.detectAnomaly(data);

    // Update threshold if provided
    if (threshold !== undefined) {
      anomalyDetectionService.updateThreshold(threshold);
    }

    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Anomaly detection error:', error);
    return res.status(500).json({
      success: false,
      error: 'Anomaly detection failed'
    });
  }
});

/**
 * @route POST /api/ai-security/nlp-analysis
 * @desc Analyze text for security threats using NLP
 * @access Private
 */
router.post('/nlp-analysis', async (req: Request, res: Response) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required for NLP analysis'
      });
    }

    const result = await nlpSecurityService.analyzeText({
      text,
      timestamp: Date.now(),
      source: 'api'
    });

    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('NLP analysis error:', error);
    return res.status(500).json({
      success: false,
      error: 'NLP analysis failed'
    });
  }
});

/**
 * @route POST /api/ai-security/predictive-analytics
 * @desc Predict potential security threats
 * @access Private
 */
router.post('/predictive-analytics', async (req: Request, res: Response) => {
  try {
    const { historicalData, timeRange, predictionHorizon } = req.body;

    if (!historicalData || !Array.isArray(historicalData)) {
      return res.status(400).json({
        success: false,
        error: 'Historical data array is required for predictive analytics'
      });
    }

    const result = await predictiveAnalyticsService.predictThreats({
      historicalEvents: historicalData,
      timeRange: timeRange || '30d',
      predictionHorizon: predictionHorizon || '7d'
    });

    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Predictive analytics error:', error);
    return res.status(500).json({
      success: false,
      error: 'Predictive analytics failed'
    });
  }
});

/**
 * @route GET /api/ai-security/status
 * @desc Get status of all AI services
 * @access Private
 */
router.get('/status', async (_req: Request, res: Response) => {
  try {
    const anomalyStatus = anomalyDetectionService.getStatus();
    const nlpStatus = nlpSecurityService.getStatus();
    const predictiveStatus = predictiveAnalyticsService.getStatus();

    return res.json({
      success: true,
      data: {
        anomalyDetection: anomalyStatus,
        nlpAnalysis: nlpStatus,
        predictiveAnalytics: predictiveStatus,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('AI services status error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get AI services status'
    });
  }
});

export default router; 