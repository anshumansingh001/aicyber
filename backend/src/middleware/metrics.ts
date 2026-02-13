import { Request, Response, NextFunction } from 'express';
import client from 'prom-client';

const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register],
});

const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

const activeConnections = new client.Gauge({
  name: 'http_active_connections',
  help: 'Number of active HTTP connections',
  registers: [register],
});

const aiInferenceDuration = new client.Histogram({
  name: 'ai_inference_duration_seconds',
  help: 'Duration of AI inference in seconds',
  labelNames: ['model', 'type'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 5, 10],
  registers: [register],
});

const securityEventsTotal = new client.Counter({
  name: 'security_events_total',
  help: 'Total security events',
  labelNames: ['type', 'severity'],
  registers: [register],
});

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  activeConnections.inc();
  const end = httpRequestDuration.startTimer();

  res.on('finish', () => {
    const route = req.route?.path ?? req.path;
    const labels = { method: req.method, route, status_code: String(res.statusCode) };
    end(labels);
    httpRequestTotal.inc(labels);
    activeConnections.dec();
  });

  next();
};

export const metricsEndpoint = async (_req: Request, res: Response): Promise<void> => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
};

export function recordAIInference(model: string, type: string, durationSeconds: number): void {
  aiInferenceDuration.observe({ model, type }, durationSeconds);
}

export function recordSecurityEvent(type: string, severity: string): void {
  securityEventsTotal.inc({ type, severity });
}
