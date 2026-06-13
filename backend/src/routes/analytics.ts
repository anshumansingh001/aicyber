import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { SecurityEventRepository } from '../repositories/SecurityEventRepository';
import { ScanRepository } from '../repositories/ScanRepository';
import { ThreatDetectionRepository } from '../repositories/ThreatDetectionRepository';
import { AIAnalysisRepository } from '../repositories/AIAnalysisRepository';
import db from '../services/database/db';

const router = Router();
const eventRepo = new SecurityEventRepository();
const scanRepo = new ScanRepository();
const threatRepo = new ThreatDetectionRepository();
const aiRepo = new AIAnalysisRepository();

router.get('/summary', asyncHandler(async (_req: Request, res: Response) => {
  const [severityCounts, threatCounts, vulnSummary] = await Promise.all([
    eventRepo.countBySeverity(),
    threatRepo.countByStatus(),
    scanRepo.getVulnerabilitySummary(),
  ]);

  res.json({
    success: true,
    data: { events: severityCounts, threats: threatCounts, vulnerabilities: vulnSummary, timestamp: new Date().toISOString() },
  });
}));

router.get('/events/timeline', asyncHandler(async (req: Request, res: Response) => {
  const days = parseInt(req.query['days'] as string) || 30;
  const rows = await db('security_events')
    .select(db.raw("date_trunc('day', created_at) as day"))
    .count('* as count')
    .where('created_at', '>=', db.raw(`now() - interval '${days} days'`))
    .groupByRaw("date_trunc('day', created_at)")
    .orderBy('day', 'asc');

  res.json({ success: true, data: rows });
}));

router.get('/threats/by-type', asyncHandler(async (_req: Request, res: Response) => {
  const rows = await db('threat_detections')
    .select('threat_type')
    .count('* as count')
    .groupBy('threat_type')
    .orderBy('count', 'desc');

  res.json({ success: true, data: rows });
}));

router.get('/ai/performance', asyncHandler(async (_req: Request, res: Response) => {
  const results = await aiRepo.findByType('anomaly_detection');
  const avgConfidence = results.length > 0
    ? results.reduce((sum, r) => sum + (r.confidence ?? 0), 0) / results.length
    : 0;

  res.json({
    success: true,
    data: {
      totalAnalyses: results.length,
      averageConfidence: Math.round(avgConfidence * 100) / 100,
      recentResults: results.slice(0, 10),
    },
  });
}));

router.get('/scans/summary', asyncHandler(async (_req: Request, res: Response) => {
  const rows = await db('security_scans')
    .select('status')
    .count('* as count')
    .groupBy('status');

  res.json({ success: true, data: rows });
}));

export default router;
