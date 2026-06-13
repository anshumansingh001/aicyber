# AICyber Platform - Phase 2 & Phase 3 Implementation Plan

**Created**: February 13, 2026
**Branch**: `claude/plan-phases-2-3-ZfAFT`
**Status**: Planning

---

## Current State Summary (Phase 1 Complete)

### What's Built
- Express.js backend with TypeScript, full middleware pipeline (Helmet, CORS, rate limiting, compression)
- 3 AI services: AnomalyDetectionService (ensemble), NLPSecurityService (entity extraction, TF-IDF, sentiment), PredictiveAnalyticsService (LSTM + statistical)
- AIModelManager coordinating 3 TensorFlow.js models (autoencoder, NLP classifier, LSTM predictor)
- Database abstraction layer with MockDatabaseService and PostgresDatabaseService (pg pool)
- Bull queue service with Redis backend
- Health monitoring endpoints (basic, detailed, per-service)
- 15+ security API endpoints (returning simulated data)
- Minimal React frontend with a single Dashboard component (health status display)
- Docker + docker-compose configuration
- Comprehensive documentation

### What's Missing
- No authentication or authorization (placeholder routes only)
- No real database schema, migrations, or data persistence
- Security routes return hardcoded/simulated data
- Frontend has 1 component, no routing, no state management
- Zero test coverage
- No CI/CD pipeline
- No monitoring/observability beyond health checks

---

## Phase 2: Core Platform Features

**Goal**: Transform the platform from a prototype into a functional, testable application with real data persistence, authentication, and a usable frontend.

---

### 2.1 Database Schema & Migrations

**Priority**: Critical (blocks most other Phase 2 work)

**Objective**: Implement real data persistence with PostgreSQL, replacing all mock/simulated data.

#### Tasks

1. **Install and configure a migration tool**
   - Add Knex.js (or Prisma) as the migration/query builder
   - Create `backend/knexfile.ts` with environment-specific database configs
   - Add npm scripts: `migrate:up`, `migrate:down`, `migrate:make`, `seed`

2. **Design and create database tables**
   - `users` — id, email, password_hash, name, role, created_at, updated_at, last_login
   - `sessions` — id, user_id, refresh_token, expires_at, ip_address, user_agent
   - `security_events` — id, type, severity, source_ip, target, payload (JSONB), created_at
   - `security_scans` — id, user_id, scan_type, status, results (JSONB), started_at, completed_at
   - `threat_detections` — id, event_id, threat_type, confidence, ai_model, details (JSONB), created_at
   - `vulnerability_reports` — id, scan_id, cve_id, severity, description, remediation, status
   - `ai_analysis_results` — id, analysis_type, input_hash, results (JSONB), model_version, created_at
   - `audit_logs` — id, user_id, action, resource, details (JSONB), ip_address, created_at

3. **Create seed data** for development and testing

4. **Refactor security routes** to read/write from the database instead of returning hardcoded responses

5. **Add a repository layer** between routes and database (e.g., `backend/src/repositories/`) to keep route handlers clean

#### Files to Create/Modify
- `backend/src/repositories/` (new directory)
- `backend/migrations/` (new directory)
- `backend/seeds/` (new directory)
- `backend/knexfile.ts` (new)
- `backend/package.json` (add knex, pg dependencies)
- `backend/src/routes/security.ts` (refactor to use repositories)

---

### 2.2 Authentication & Authorization

**Priority**: Critical

**Objective**: Implement JWT-based authentication with role-based access control.

#### Tasks

1. **Implement auth service** (`backend/src/services/auth/AuthService.ts`)
   - `register(email, password, name)` — hash password with bcrypt, create user, return tokens
   - `login(email, password)` — verify credentials, return access + refresh tokens
   - `refreshToken(token)` — validate refresh token, issue new access token
   - `logout(userId, sessionId)` — invalidate session
   - `changePassword(userId, oldPassword, newPassword)`

2. **Implement auth routes** (`backend/src/routes/auth.ts`)
   - `POST /api/auth/register` — user registration with input validation
   - `POST /api/auth/login` — login with email/password
   - `POST /api/auth/refresh` — refresh access token
   - `POST /api/auth/logout` — invalidate session
   - `POST /api/auth/change-password` — change password (authenticated)

3. **Implement auth middleware** (`backend/src/middleware/auth.ts`)
   - `authenticate` — verify JWT from Authorization header, attach user to request
   - `authorize(...roles)` — check user role against allowed roles

4. **Implement user routes** (`backend/src/routes/users.ts`)
   - `GET /api/users/me` — get current user profile
   - `PUT /api/users/me` — update profile
   - `GET /api/users` — list users (admin only)
   - `PUT /api/users/:id/role` — change user role (admin only)

5. **Define roles**: `user`, `analyst`, `admin`

6. **Protect existing routes** — apply `authenticate` middleware to `/api/security/*` and `/api/ai-security/*`

#### Files to Create/Modify
- `backend/src/services/auth/AuthService.ts` (new)
- `backend/src/routes/auth.ts` (new, replacing placeholder)
- `backend/src/routes/users.ts` (new, replacing placeholder)
- `backend/src/middleware/auth.ts` (new)
- `backend/src/app.ts` (register new routes, apply middleware)
- `backend/package.json` (add bcrypt, jsonwebtoken)

---

### 2.3 Testing Infrastructure

**Priority**: High

**Objective**: Establish test coverage for backend services and API endpoints.

#### Tasks

1. **Set up test framework**
   - Install Jest + ts-jest for backend
   - Install supertest for HTTP endpoint testing
   - Configure `backend/jest.config.ts`
   - Add `.env.test` for test environment variables

2. **Write unit tests for core services**
   - `AuthService` — registration, login, token refresh, password validation
   - `AnomalyDetectionService` — anomaly scoring, threshold behavior
   - `NLPSecurityService` — threat keyword detection, entity extraction
   - `PredictiveAnalyticsService` — prediction output structure
   - `DatabaseService` — connection, health check
   - Error utility functions

3. **Write integration tests for API endpoints**
   - Health endpoints (all variants)
   - Auth endpoints (register, login, refresh, logout)
   - Security endpoints (with authentication)
   - AI security endpoints (with authentication)

4. **Add test npm scripts** to root and backend `package.json`
   - `test` — run all tests
   - `test:unit` — run unit tests only
   - `test:integration` — run integration tests only
   - `test:coverage` — run with coverage report

#### Files to Create/Modify
- `backend/jest.config.ts` (new)
- `backend/src/__tests__/` (new directory)
- `backend/src/__tests__/unit/services/` (new)
- `backend/src/__tests__/integration/routes/` (new)
- `backend/package.json` (add jest, ts-jest, supertest)

---

### 2.4 Frontend: Authentication UI & Routing

**Priority**: High

**Objective**: Add routing, authentication pages, and state management to the React app.

#### Tasks

1. **Install dependencies**
   - `react-router-dom` for routing
   - `@tanstack/react-query` (or Context API) for server state management
   - A UI library (Tailwind CSS recommended for flexibility — or Material-UI)

2. **Implement auth context** (`frontend/src/context/AuthContext.tsx`)
   - Store user + tokens in state
   - Provide `login()`, `logout()`, `register()` methods
   - Persist tokens in localStorage
   - Auto-refresh token before expiration

3. **Create auth pages**
   - `LoginPage.tsx` — email/password form, error display, link to register
   - `RegisterPage.tsx` — name/email/password form, validation
   - `ProtectedRoute.tsx` — wrapper that redirects to login if unauthenticated

4. **Set up routing** (in `App.tsx`)
   - `/login` — LoginPage
   - `/register` — RegisterPage
   - `/dashboard` — Dashboard (protected)
   - `/` — redirect to dashboard or login

5. **Add navigation bar** (`Navbar.tsx`)
   - Logo/brand
   - Navigation links (Dashboard, Scans, Events)
   - User menu (profile, logout)

6. **Add layout component** (`Layout.tsx`)
   - Sidebar navigation (collapsible)
   - Main content area
   - Consistent header/footer

#### Files to Create/Modify
- `frontend/src/context/AuthContext.tsx` (new)
- `frontend/src/pages/LoginPage.tsx` (new)
- `frontend/src/pages/RegisterPage.tsx` (new)
- `frontend/src/components/ProtectedRoute.tsx` (new)
- `frontend/src/components/Navbar.tsx` (new)
- `frontend/src/components/Layout.tsx` (new)
- `frontend/src/App.tsx` (refactor with routing)
- `frontend/package.json` (add dependencies)

---

### 2.5 Frontend: Security Dashboard

**Priority**: High

**Objective**: Build out the main dashboard to display real security data from the API.

#### Tasks

1. **Enhance Dashboard component**
   - Security events feed (recent events from `/api/security/monitoring/status`)
   - Threat summary cards (count by severity)
   - System health overview (existing, improved)
   - Quick-action buttons (run scan, view reports)

2. **Create Security Scan page** (`SecurityScanPage.tsx`)
   - Form to initiate device assessment, vulnerability scan, or threat detection
   - Results display with severity indicators
   - Scan history table

3. **Create Security Events page** (`SecurityEventsPage.tsx`)
   - Table/list of security events with filtering and sorting
   - Event detail view
   - Severity-based color coding

4. **Create AI Analysis page** (`AIAnalysisPage.tsx`)
   - Forms to submit data for anomaly detection, NLP analysis, predictive analytics
   - Results visualization
   - Analysis history

5. **Add API service layer** (`frontend/src/services/api.ts`)
   - Axios instance with base URL, auth interceptor (attach JWT)
   - Response interceptor for token refresh on 401
   - Typed API methods for each endpoint

#### Files to Create/Modify
- `frontend/src/services/api.ts` (new)
- `frontend/src/pages/SecurityScanPage.tsx` (new)
- `frontend/src/pages/SecurityEventsPage.tsx` (new)
- `frontend/src/pages/AIAnalysisPage.tsx` (new)
- `frontend/src/components/Dashboard.tsx` (enhance)

---

### 2.6 Real-time Threat Intelligence

**Priority**: Medium

**Objective**: Connect security routes to real analysis and provide real-time event streaming.

#### Tasks

1. **Wire security routes to AI services**
   - `/api/security/threats/detect` should call AnomalyDetectionService + NLPSecurityService
   - `/api/security/vulnerabilities/scan` should persist results to database
   - `/api/security/threats/behavioral-analysis` should use real PredictiveAnalyticsService
   - Remove all hardcoded/simulated responses

2. **Add WebSocket support** for real-time events
   - Install `socket.io` on backend
   - Emit security events as they are detected
   - Frontend subscribes to event stream on Dashboard
   - Show real-time event notifications

3. **Add event persistence**
   - All security events written to `security_events` table
   - AI analysis results stored in `ai_analysis_results` table
   - Audit log entries for all user actions

#### Files to Create/Modify
- `backend/src/routes/security.ts` (major refactor)
- `backend/src/services/realtime/WebSocketService.ts` (new)
- `backend/src/app.ts` (add socket.io)
- `backend/package.json` (add socket.io)
- `frontend/package.json` (add socket.io-client)

---

### 2.7 Compliance Reporting

**Priority**: Medium

**Objective**: Generate compliance reports based on security posture and events.

#### Tasks

1. **Implement compliance service** (`backend/src/services/compliance/ComplianceService.ts`)
   - Evaluate security posture against SOC 2, GDPR, HIPAA frameworks
   - Generate compliance score per framework
   - Identify gaps and recommendations
   - Produce exportable reports (JSON, PDF via a library like pdfkit)

2. **Add compliance routes**
   - `GET /api/compliance/status` — overall compliance status
   - `GET /api/compliance/report/:framework` — detailed report for a specific framework
   - `GET /api/compliance/gaps` — list of compliance gaps with remediation steps

3. **Add compliance dashboard page** on frontend
   - Compliance score cards per framework
   - Gap analysis visualization
   - Report download functionality

#### Files to Create/Modify
- `backend/src/services/compliance/ComplianceService.ts` (new)
- `backend/src/routes/compliance.ts` (new)
- `frontend/src/pages/CompliancePage.tsx` (new)

---

### Phase 2 Delivery Checklist

| # | Deliverable | Depends On |
|---|------------|------------|
| 2.1 | Database schema + migrations + repository layer | — |
| 2.2 | Authentication & authorization (backend) | 2.1 |
| 2.3 | Testing infrastructure + initial test suite | 2.1, 2.2 |
| 2.4 | Frontend auth UI + routing + layout | 2.2 |
| 2.5 | Frontend security dashboard + pages | 2.4, 2.6 |
| 2.6 | Real-time threat intelligence (wiring + WebSocket) | 2.1 |
| 2.7 | Compliance reporting | 2.1, 2.6 |

**Recommended order**: 2.1 → 2.2 → 2.3 → 2.6 → 2.4 → 2.5 → 2.7

---

## Phase 3: Enterprise & Advanced AI

**Goal**: Scale the platform with enterprise-grade features, advanced ML capabilities, and production observability.

---

### 3.1 Advanced AI Model Training Pipeline

**Priority**: High

**Objective**: Build infrastructure to train, evaluate, version, and deploy ML models on real security data.

#### Tasks

1. **Model training pipeline**
   - Create `backend/src/services/ai/ModelTrainingPipeline.ts`
   - Accept labeled security event data as training input
   - Split data into train/validation/test sets
   - Train models with configurable hyperparameters
   - Track training metrics (loss, accuracy, F1, precision, recall)

2. **Model versioning and registry**
   - Store trained models with version identifiers on disk or object storage
   - Maintain a model registry (`ai_models` table) with version, metrics, status (active/retired)
   - Support A/B testing between model versions
   - Rollback to previous model versions

3. **Model evaluation service**
   - Automated evaluation on holdout test data
   - Generate performance reports (confusion matrix, ROC curves data)
   - Detect model drift by comparing current vs. baseline metrics
   - Alert when model performance degrades below thresholds

4. **Scheduled retraining**
   - Use Bull queue to schedule periodic retraining jobs
   - Retrain models on accumulated new data
   - Automatically promote new models if metrics exceed current version

#### Files to Create/Modify
- `backend/src/services/ai/ModelTrainingPipeline.ts` (new)
- `backend/src/services/ai/ModelRegistry.ts` (new)
- `backend/src/services/ai/ModelEvaluationService.ts` (new)
- `backend/src/services/ai/AIModelManager.ts` (extend with versioning)
- `backend/src/routes/ai-security.ts` (add training/evaluation endpoints)
- Database migration for `ai_models` table

---

### 3.2 Advanced Analytics Dashboard

**Priority**: High

**Objective**: Build a rich, interactive analytics frontend with data visualizations.

#### Tasks

1. **Install charting library** (Chart.js or Recharts)

2. **Create analytics pages**
   - **Threat Analytics** — threat trends over time (line chart), threat type distribution (pie/bar), severity heatmap
   - **AI Model Performance** — model accuracy over time, false positive/negative rates, prediction confidence distribution
   - **User Activity** — login patterns, API usage, geographic access map
   - **System Performance** — response times, throughput, error rates

3. **Add data export**
   - Export charts as PNG/SVG
   - Export data as CSV/JSON
   - Scheduled report generation (email or download)

4. **Add date range filtering** across all analytics views

#### Files to Create/Modify
- `frontend/src/pages/AnalyticsPage.tsx` (new)
- `frontend/src/components/charts/` (new directory with chart components)
- `frontend/src/pages/ModelPerformancePage.tsx` (new)
- `backend/src/routes/analytics.ts` (new — aggregate data endpoints)

---

### 3.3 Multi-Tenant Architecture

**Priority**: High

**Objective**: Support multiple organizations on a single platform instance.

#### Tasks

1. **Database schema changes**
   - Add `organizations` table (id, name, plan, settings, created_at)
   - Add `organization_id` foreign key to `users`, `security_events`, `scans`, etc.
   - Implement row-level security or query-scoped filtering by organization

2. **Tenant isolation middleware**
   - Extract `organization_id` from authenticated user
   - Scope all database queries to the user's organization
   - Prevent cross-tenant data access

3. **Organization management**
   - `POST /api/organizations` — create organization (super-admin)
   - `GET /api/organizations/:id` — get organization details
   - `PUT /api/organizations/:id/settings` — update org settings
   - `POST /api/organizations/:id/invite` — invite user to organization
   - Organization-level roles: `org_admin`, `org_analyst`, `org_viewer`

4. **Frontend organization switcher** (for users belonging to multiple orgs)

#### Files to Create/Modify
- Database migration for `organizations` table and FK additions
- `backend/src/middleware/tenant.ts` (new)
- `backend/src/routes/organizations.ts` (new)
- `backend/src/services/organization/OrganizationService.ts` (new)
- `frontend/src/components/OrgSwitcher.tsx` (new)

---

### 3.4 CI/CD Pipeline & Monitoring

**Priority**: High

**Objective**: Automate builds, tests, and deployments; add production observability.

#### Tasks

1. **GitHub Actions CI pipeline** (`.github/workflows/ci.yml`)
   - Lint (ESLint) on all PRs
   - Run backend unit + integration tests
   - Run frontend tests
   - Build Docker images
   - Report test coverage

2. **Deployment pipeline** (`.github/workflows/deploy.yml`)
   - Build and push Docker images to registry
   - Deploy to staging on merge to `develop`
   - Deploy to production on merge to `main` (manual approval gate)

3. **Application monitoring**
   - Add Prometheus metrics endpoint (`/metrics`) with `prom-client`
   - Track: request count, latency histogram, error rate, active connections
   - Track AI-specific metrics: inference latency, model prediction counts, confidence distribution

4. **Grafana dashboards** (JSON configs in `monitoring/`)
   - API performance dashboard
   - Security events dashboard
   - AI model performance dashboard
   - System resources dashboard

5. **Alerting**
   - Alert on error rate spike (>5% of requests)
   - Alert on response time degradation (p95 > 500ms)
   - Alert on AI model confidence drop
   - Alert on service health check failure

#### Files to Create/Modify
- `.github/workflows/ci.yml` (new)
- `.github/workflows/deploy.yml` (new)
- `backend/src/middleware/metrics.ts` (new)
- `backend/package.json` (add prom-client)
- `monitoring/grafana/dashboards/` (new)
- `monitoring/prometheus/prometheus.yml` (new)

---

### 3.5 Advanced Threat Intelligence Integration

**Priority**: Medium

**Objective**: Integrate with external threat intelligence sources and automate incident response.

#### Tasks

1. **Threat intelligence feed service**
   - Create `backend/src/services/threatIntel/ThreatIntelService.ts`
   - Integrate with public threat feeds (MITRE ATT&CK, abuse.ch, AlienVault OTX)
   - Store IOCs (Indicators of Compromise) in database
   - Correlate incoming events against known IOCs

2. **Automated incident response**
   - Create `backend/src/services/incident/IncidentResponseService.ts`
   - Define response playbooks as configurable rules
   - Auto-create incidents when threat confidence exceeds threshold
   - Auto-assign severity and notify relevant roles
   - Track incident lifecycle: detected → investigating → contained → resolved

3. **Incident management routes**
   - `GET /api/incidents` — list incidents with filtering
   - `GET /api/incidents/:id` — incident detail with timeline
   - `PUT /api/incidents/:id/status` — update incident status
   - `POST /api/incidents/:id/notes` — add investigation notes

4. **Incident management UI**
   - Incident list with status filters
   - Incident detail page with timeline view
   - Assignment and escalation controls

#### Files to Create/Modify
- `backend/src/services/threatIntel/ThreatIntelService.ts` (new)
- `backend/src/services/incident/IncidentResponseService.ts` (new)
- `backend/src/routes/incidents.ts` (new)
- `frontend/src/pages/IncidentsPage.tsx` (new)
- `frontend/src/pages/IncidentDetailPage.tsx` (new)
- Database migration for `incidents`, `incident_notes`, `ioc_feeds` tables

---

### 3.6 API Documentation & Developer Portal

**Priority**: Medium

**Objective**: Provide auto-generated, interactive API documentation for developer consumers.

#### Tasks

1. **Add OpenAPI/Swagger**
   - Install `swagger-jsdoc` + `swagger-ui-express`
   - Annotate all routes with JSDoc OpenAPI comments
   - Serve interactive docs at `/api/docs`

2. **API key management** (for external API consumers)
   - `api_keys` table (id, user_id, key_hash, name, permissions, rate_limit, created_at, expires_at)
   - `POST /api/keys` — generate API key
   - `DELETE /api/keys/:id` — revoke API key
   - Middleware to authenticate via API key (alternative to JWT)

3. **Rate limiting per API key** — differentiated limits based on plan tier

#### Files to Create/Modify
- `backend/src/routes/api-docs.ts` (new)
- `backend/src/routes/api-keys.ts` (new)
- `backend/src/middleware/apiKeyAuth.ts` (new)
- `backend/package.json` (add swagger-jsdoc, swagger-ui-express)
- Database migration for `api_keys` table

---

### 3.7 Enterprise Features

**Priority**: Medium

**Objective**: Add features required by enterprise customers.

#### Tasks

1. **SSO integration**
   - Support SAML 2.0 and/or OIDC for enterprise identity providers
   - Map external identity attributes to internal roles

2. **Audit logging UI**
   - Searchable audit log viewer
   - Filter by user, action, date range
   - Export audit logs

3. **Custom alerting rules**
   - Allow organizations to define custom alert rules (e.g., "alert when >10 failed logins in 5 minutes")
   - Rule engine evaluating conditions against incoming events
   - Notification channels: email, webhook, Slack integration

4. **Data retention policies**
   - Configurable per-organization data retention periods
   - Automated data cleanup jobs
   - Data export before deletion

#### Files to Create/Modify
- `backend/src/services/sso/SSOService.ts` (new)
- `backend/src/services/alerting/AlertRuleEngine.ts` (new)
- `backend/src/routes/alert-rules.ts` (new)
- `frontend/src/pages/AuditLogPage.tsx` (new)
- `frontend/src/pages/AlertRulesPage.tsx` (new)

---

### Phase 3 Delivery Checklist

| # | Deliverable | Depends On |
|---|------------|------------|
| 3.1 | AI model training pipeline + versioning | Phase 2 complete |
| 3.2 | Advanced analytics dashboard | Phase 2 complete |
| 3.3 | Multi-tenant architecture | Phase 2 complete |
| 3.4 | CI/CD pipeline + monitoring | Phase 2.3 (tests) |
| 3.5 | Threat intelligence + incident response | Phase 2.1, 2.6 |
| 3.6 | API documentation + developer portal | Phase 2.2 |
| 3.7 | Enterprise features (SSO, audit, alerting) | 3.3 |

**Recommended order**: 3.4 → 3.3 → 3.1 → 3.2 → 3.5 → 3.6 → 3.7

---

## Architecture Diagram (Target State After Phase 3)

```
┌──────────────────────────────────────────────────────┐
│                    Frontend (React)                   │
│  ┌──────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │
│  │ Auth │ │Dashboard │ │Analytics │ │ Incidents  │  │
│  │Pages │ │  + Scans │ │ + Charts │ │ + Alerts   │  │
│  └──┬───┘ └────┬─────┘ └────┬─────┘ └─────┬──────┘  │
│     └──────────┴────────────┴──────────────┘         │
│                    API Service Layer                  │
│              (Axios + Auth Interceptor)               │
└──────────────────────┬───────────────────────────────┘
                       │ HTTP / WebSocket
┌──────────────────────┴───────────────────────────────┐
│                   Backend (Express)                   │
│  ┌─────────────────────────────────────────────────┐ │
│  │              Middleware Pipeline                 │ │
│  │  Auth → Tenant → RateLimit → Metrics → Logger   │ │
│  └─────────────────────────────────────────────────┘ │
│  ┌────────┐ ┌──────────┐ ┌───────────┐ ┌─────────┐  │
│  │  Auth  │ │ Security │ │    AI     │ │Complian.│  │
│  │ Routes │ │  Routes  │ │  Routes   │ │ Routes  │  │
│  └───┬────┘ └────┬─────┘ └─────┬─────┘ └────┬────┘  │
│  ┌───┴────┐ ┌────┴─────┐ ┌─────┴─────┐ ┌────┴────┐  │
│  │  Auth  │ │ Security │ │ AI Model  │ │Complian.│  │
│  │Service │ │ Service  │ │ Manager   │ │Service  │  │
│  └───┬────┘ └────┬─────┘ └─────┬─────┘ └────┬────┘  │
│      │           │             │             │       │
│  ┌───┴───────────┴─────────────┴─────────────┴────┐  │
│  │             Repository Layer                    │  │
│  └─────────────────────┬──────────────────────────┘  │
└────────────────────────┼─────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
   ┌────┴─────┐   ┌──────┴─────┐   ┌─────┴──────┐
   │PostgreSQL│   │   Redis    │   │  Bull Queue │
   │  (Data)  │   │  (Cache)   │   │   (Jobs)    │
   └──────────┘   └────────────┘   └─────────────┘
```

---

## Risk Considerations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Database migration complexity grows | Medium | High | Keep migrations small and reversible; test in staging |
| AI model performance insufficient on real data | Medium | Medium | Maintain statistical fallback; benchmark against simulated baseline |
| Frontend scope creep | High | Medium | Prioritize core flows (auth, scan, events) before analytics |
| Multi-tenant query performance | Medium | High | Add database indexes per organization_id; use connection pooling |
| Test suite maintenance burden | Low | Medium | Focus tests on critical paths; avoid testing framework internals |

---

## Technology Additions Summary

### Phase 2 New Dependencies
**Backend**: knex, bcrypt, jsonwebtoken, socket.io, pdfkit
**Frontend**: react-router-dom, @tanstack/react-query (or context), socket.io-client, tailwindcss
**Dev**: jest, ts-jest, supertest, @testing-library/react

### Phase 3 New Dependencies
**Backend**: prom-client, swagger-jsdoc, swagger-ui-express, passport-saml (or openid-client)
**Frontend**: recharts (or chart.js), react-table
**DevOps**: GitHub Actions, Prometheus, Grafana

---

*This plan should be treated as a living document. Update it as implementation progresses and requirements evolve.*
