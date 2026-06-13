import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { ComplianceService } from '../services/compliance/ComplianceService';

const router = Router();
const complianceService = new ComplianceService();

router.get('/status', asyncHandler(async (_req: Request, res: Response) => {
  const status = await complianceService.getOverallStatus();
  res.json({ success: true, data: status });
}));

router.get('/report/:framework', asyncHandler(async (req: Request, res: Response) => {
  const framework = req.params['framework'] as string;
  const report = await complianceService.assessFramework(framework.toLowerCase());
  res.json({ success: true, data: report });
}));

router.get('/gaps', asyncHandler(async (_req: Request, res: Response) => {
  const allGaps: Array<{ framework: string; gaps: unknown[] }> = [];
  for (const fw of ['soc2', 'gdpr', 'hipaa']) {
    const report = await complianceService.assessFramework(fw);
    if (report.gaps.length > 0) {
      allGaps.push({ framework: fw, gaps: report.gaps });
    }
  }
  res.json({ success: true, data: allGaps });
}));

export default router;
