import { Express } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AICyber Platform API',
      version: '1.0.0',
      description: 'AI-Powered Cybersecurity Platform REST API',
    },
    servers: [{ url: 'http://localhost:3001', description: 'Development' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
    security: [{ bearerAuth: [] }],
    paths: {
      '/api/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Register a new user',
          security: [],
          requestBody: {
            content: { 'application/json': { schema: { type: 'object', properties: { email: { type: 'string' }, password: { type: 'string' }, name: { type: 'string' } }, required: ['email', 'password', 'name'] } } },
          },
          responses: { '201': { description: 'User registered' }, '409': { description: 'Email already exists' } },
        },
      },
      '/api/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login',
          security: [],
          requestBody: {
            content: { 'application/json': { schema: { type: 'object', properties: { email: { type: 'string' }, password: { type: 'string' } }, required: ['email', 'password'] } } },
          },
          responses: { '200': { description: 'Login successful' }, '401': { description: 'Invalid credentials' } },
        },
      },
      '/api/security/device/assess': {
        post: { tags: ['Security'], summary: 'Device security assessment', responses: { '200': { description: 'Assessment result' } } },
      },
      '/api/security/threats/detect': {
        post: { tags: ['Security'], summary: 'Detect threats', responses: { '200': { description: 'Threat detection result' } } },
      },
      '/api/security/vulnerabilities/scan': {
        post: { tags: ['Security'], summary: 'Vulnerability scan', responses: { '200': { description: 'Scan result' } } },
      },
      '/api/ai-security/anomaly-detection': {
        post: { tags: ['AI Security'], summary: 'Anomaly detection', responses: { '200': { description: 'Detection result' } } },
      },
      '/api/ai-security/nlp-analysis': {
        post: { tags: ['AI Security'], summary: 'NLP security analysis', responses: { '200': { description: 'Analysis result' } } },
      },
      '/api/ai-security/predictive-analytics': {
        post: { tags: ['AI Security'], summary: 'Predictive analytics', responses: { '200': { description: 'Prediction result' } } },
      },
      '/api/compliance/status': {
        get: { tags: ['Compliance'], summary: 'Get compliance status', responses: { '200': { description: 'Compliance overview' } } },
      },
      '/api/compliance/report/{framework}': {
        get: { tags: ['Compliance'], summary: 'Get compliance report', parameters: [{ name: 'framework', in: 'path', required: true, schema: { type: 'string', enum: ['soc2', 'gdpr', 'hipaa'] } }], responses: { '200': { description: 'Compliance report' } } },
      },
      '/api/incidents': {
        get: { tags: ['Incidents'], summary: 'List incidents', responses: { '200': { description: 'Incident list' } } },
        post: { tags: ['Incidents'], summary: 'Create incident', responses: { '201': { description: 'Incident created' } } },
      },
      '/api/analytics/summary': {
        get: { tags: ['Analytics'], summary: 'Get analytics summary', responses: { '200': { description: 'Summary data' } } },
      },
      '/health': {
        get: { tags: ['Health'], summary: 'Health check', security: [], responses: { '200': { description: 'Healthy' } } },
      },
    },
  },
  apis: [],
};

const swaggerSpec = swaggerJsdoc(options);

export function setupSwagger(app: Express): void {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/api/docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}
