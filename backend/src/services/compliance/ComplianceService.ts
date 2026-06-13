import { SecurityEventRepository } from '../../repositories/SecurityEventRepository';
import { ScanRepository } from '../../repositories/ScanRepository';

export interface ComplianceRequirement {
  id: string;
  name: string;
  description: string;
  status: 'compliant' | 'non_compliant' | 'partial';
  score: number;
  evidence: string;
}

export interface ComplianceGap {
  requirementId: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  remediation: string;
}

export interface ComplianceResult {
  framework: string;
  overallScore: number;
  status: 'compliant' | 'non_compliant' | 'partial';
  requirements: ComplianceRequirement[];
  gaps: ComplianceGap[];
  lastAssessedAt: string;
}

const FRAMEWORKS: Record<string, ComplianceRequirement[]> = {
  soc2: [
    { id: 'CC1.1', name: 'Control Environment', description: 'Organization demonstrates commitment to integrity', status: 'compliant', score: 90, evidence: 'Security policies defined and enforced' },
    { id: 'CC2.1', name: 'Communication & Information', description: 'Relevant information is communicated', status: 'compliant', score: 85, evidence: 'Logging and monitoring implemented' },
    { id: 'CC3.1', name: 'Risk Assessment', description: 'Organization identifies and assesses risks', status: 'partial', score: 70, evidence: 'AI-based threat detection active' },
    { id: 'CC6.1', name: 'Logical Access Controls', description: 'Logical access security implemented', status: 'compliant', score: 88, evidence: 'JWT auth, RBAC, rate limiting in place' },
    { id: 'CC7.1', name: 'System Operations', description: 'Detects and manages anomalies', status: 'partial', score: 72, evidence: 'Anomaly detection active' },
    { id: 'CC8.1', name: 'Change Management', description: 'Changes to infrastructure are managed', status: 'non_compliant', score: 40, evidence: 'CI/CD pipeline not fully configured' },
  ],
  gdpr: [
    { id: 'ART5', name: 'Data Processing Principles', description: 'Lawfulness, fairness and transparency', status: 'partial', score: 75, evidence: 'Data handling policies defined' },
    { id: 'ART25', name: 'Data Protection by Design', description: 'Privacy controls built into systems', status: 'compliant', score: 85, evidence: 'Encryption, access controls, audit logging' },
    { id: 'ART30', name: 'Records of Processing', description: 'Maintain records of processing activities', status: 'partial', score: 65, evidence: 'Audit logs available' },
    { id: 'ART32', name: 'Security of Processing', description: 'Appropriate technical measures', status: 'compliant', score: 88, evidence: 'Encryption, access controls, monitoring' },
    { id: 'ART33', name: 'Breach Notification', description: 'Notify authority within 72 hours', status: 'non_compliant', score: 45, evidence: 'Automated notification not configured' },
    { id: 'ART17', name: 'Right to Erasure', description: 'Right to be forgotten', status: 'partial', score: 60, evidence: 'Data deletion API partially implemented' },
  ],
  hipaa: [
    { id: '164.312a', name: 'Access Control', description: 'Implement technical policies for access', status: 'compliant', score: 85, evidence: 'RBAC and authentication implemented' },
    { id: '164.312b', name: 'Audit Controls', description: 'Record and examine activity', status: 'compliant', score: 80, evidence: 'Comprehensive audit logging' },
    { id: '164.312c', name: 'Integrity Controls', description: 'Protect data from improper alteration', status: 'partial', score: 70, evidence: 'Data validation present' },
    { id: '164.312d', name: 'Authentication', description: 'Verify entity identity', status: 'compliant', score: 90, evidence: 'JWT-based auth with bcrypt' },
    { id: '164.312e', name: 'Transmission Security', description: 'Guard against unauthorized access', status: 'partial', score: 65, evidence: 'HTTPS configured' },
  ],
};

export class ComplianceService {
  private eventRepo: SecurityEventRepository;
  private scanRepo: ScanRepository;

  constructor() {
    this.eventRepo = new SecurityEventRepository();
    this.scanRepo = new ScanRepository();
  }

  async assessFramework(framework: string): Promise<ComplianceResult> {
    const requirements = FRAMEWORKS[framework];
    if (!requirements) {
      return { framework, overallScore: 0, status: 'non_compliant', requirements: [], gaps: [], lastAssessedAt: new Date().toISOString() };
    }

    const eventCounts = await this.eventRepo.countBySeverity();
    const vulnSummary = await this.scanRepo.getVulnerabilitySummary();
    const hasCriticalVulns = (vulnSummary['critical'] ?? 0) > 0;

    const adjustedReqs = requirements.map((req) => {
      let scoreAdj = req.score;
      if (hasCriticalVulns && ['CC7.1', 'ART32', '164.312c'].includes(req.id)) {
        scoreAdj = Math.max(scoreAdj - 15, 0);
      }
      if (((eventCounts['high'] ?? 0) + (eventCounts['critical'] ?? 0)) > 10) {
        scoreAdj = Math.max(scoreAdj - 5, 0);
      }
      return { ...req, score: scoreAdj };
    });

    const overallScore = Math.round(adjustedReqs.reduce((sum, r) => sum + r.score, 0) / adjustedReqs.length);
    const gaps: ComplianceGap[] = adjustedReqs
      .filter((r) => r.status !== 'compliant')
      .map((r) => ({
        requirementId: r.id,
        description: `${r.name}: ${r.description}`,
        severity: (r.score < 50 ? 'high' : r.score < 70 ? 'medium' : 'low') as ComplianceGap['severity'],
        remediation: `Address gaps in ${r.name} to improve from ${r.score}%`,
      }));

    return {
      framework,
      overallScore,
      status: overallScore >= 80 ? 'compliant' : overallScore >= 60 ? 'partial' : 'non_compliant',
      requirements: adjustedReqs,
      gaps,
      lastAssessedAt: new Date().toISOString(),
    };
  }

  async getOverallStatus(): Promise<Record<string, { score: number; status: string }>> {
    const result: Record<string, { score: number; status: string }> = {};
    for (const fw of Object.keys(FRAMEWORKS)) {
      const assessment = await this.assessFramework(fw);
      result[fw] = { score: assessment.overallScore, status: assessment.status };
    }
    return result;
  }
}
