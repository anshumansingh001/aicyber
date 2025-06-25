# 🚀 Quick Start Guide

Get your Cybersecurity Platform up and running in minutes!

## Prerequisites

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Docker & Docker Compose** (optional but recommended) - [Download here](https://www.docker.com/)

## 🎯 One-Command Setup

```bash
# Clone and setup everything automatically
chmod +x setup.sh
./setup.sh
```

## 📋 Manual Setup (if needed)

### 1. Install Dependencies
```bash
# Root dependencies
npm install

# Backend dependencies
cd backend && npm install && cd ..
```

### 2. Configure Environment
```bash
# Copy environment template
cp backend/env.example backend/.env

# Edit with your settings
nano backend/.env
```

### 3. Start the Platform

#### Option A: With Docker (Recommended)
```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps
```

#### Option B: Local Development
```bash
# Start backend
cd backend && npm run dev

# Start frontend (in another terminal)
cd frontend && npm run dev
```

## 🌐 Access Your Platform

Once running, access these services:

| Service | URL | Description |
|---------|-----|-------------|
| **Backend API** | http://localhost:3001 | Main API server |
| **Frontend** | http://localhost:3001 | User interface |
| **Health Check** | http://localhost:3001/health | API status |
| **API Docs** | http://localhost:3001/api/docs | API documentation |
| **Monitoring** | http://localhost:3002 | Grafana dashboard |
| **Security Scanner** | http://localhost:8080 | Trivy vulnerability scanner |

## 🔧 Quick Configuration

### Essential Environment Variables
```bash
# In backend/.env
NODE_ENV=development
PORT=3001
JWT_SECRET=your-super-secret-key
DATABASE_URL=postgresql://postgres:password@localhost:5432/cybersecurity_platform
REDIS_URL=redis://localhost:6379
```

### Database Setup
```bash
# If using Docker (automatic)
docker-compose up postgres

# If using local PostgreSQL
createdb cybersecurity_platform
```

## 🧪 Test Your Installation

### 1. Health Check
```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456,
  "environment": "development"
}
```

### 2. Security Status
```bash
curl http://localhost:3001/health/security
```

### 3. API Documentation
```bash
curl http://localhost:3001/api/docs
```

## 🛠️ Development Commands

```bash
# Start development servers
npm run dev

# Run tests
npm run test

# Lint code
npm run lint

# Security audit
npm run security

# Build for production
npm run build
```

## 🔒 Security Features Available

- ✅ **Rate Limiting** - Prevents abuse
- ✅ **CORS Protection** - Cross-origin security
- ✅ **Helmet Security** - HTTP headers protection
- ✅ **XSS Protection** - Cross-site scripting prevention
- ✅ **Input Validation** - Data sanitization
- ✅ **JWT Authentication** - Secure token-based auth
- ✅ **Encryption** - AES-256 data encryption
- ✅ **Audit Logging** - Complete activity tracking

## 🚨 Troubleshooting

### Common Issues

**Port already in use:**
```bash
# Find and kill process
lsof -ti:3001 | xargs kill -9
```

**Database connection failed:**
```bash
# Check if PostgreSQL is running
docker-compose ps postgres
# or
sudo systemctl status postgresql
```

**Permission denied:**
```bash
# Fix file permissions
chmod +x setup.sh start.sh stop.sh
```

### Logs
```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

## 📞 Support

- **Documentation**: Check the `docs/` folder
- **Issues**: Create an issue in the repository
- **Security**: Report security issues privately

## 🎉 Next Steps

1. **Explore the API** - Visit http://localhost:3001/api/docs
2. **Customize Security** - Edit `backend/src/middleware/securityHeaders.ts`
3. **Add Features** - Check the project documentation
4. **Deploy** - Follow the deployment guide in `docs/deployment.md`

## 4. Test Endpoints

### Health
```sh
curl http://localhost:3001/health
```

### Device Assessment
```sh
curl -X POST http://localhost:3001/api/security/device/assess -H "Content-Type: application/json" -d '{"deviceId":"device_001","deviceType":"laptop","osVersion":"Windows 11","installedSoftware":["Chrome","VS Code"]}'
```

### Threat Detection
```sh
curl -X POST http://localhost:3001/api/security/threats/detect -H "Content-Type: application/json" -d '{"input":"test threat"}'
```

### Vulnerability Scan
```sh
curl -X POST http://localhost:3001/api/security/vulnerabilities/scan -H "Content-Type: application/json" -d '{"target":"web-server-01","scanType":"full"}'
```

### Security Posture
```sh
curl http://localhost:3001/api/security/posture/assess
```

### Monitoring Status
```sh
curl http://localhost:3001/api/security/monitoring/status
```

### Compliance Check
```sh
curl http://localhost:3001/api/security/compliance/check
```

### Bull Board Dashboard
Open [http://localhost:3001/admin/queues](http://localhost:3001/admin/queues) in your browser.

### Advanced Threat Analytics

#### Threat Intelligence
```sh
curl "http://localhost:3001/api/security/threats/intelligence?ioc=192.168.1.100&threatType=malware"
```

#### Behavioral Analysis
```sh
curl -X POST http://localhost:3001/api/security/threats/behavioral-analysis -H "Content-Type: application/json" -d '{"userId":"user1","deviceId":"dev1","activities":[],"timeframe":"24h"}'
```

#### ML-based Detection
```sh
curl -X POST http://localhost:3001/api/security/threats/ml-detection -H "Content-Type: application/json" -d '{"networkTraffic":[],"systemLogs":[],"userBehavior":[]}'
```

#### Threat Correlation
```sh
curl -X POST http://localhost:3001/api/security/threats/correlate -H "Content-Type: application/json" -d '{"events":[],"timeframe":"24h","severity":"HIGH"}'
```

#### Threat Hunting
```sh
curl -X POST http://localhost:3001/api/security/threats/hunt -H "Content-Type: application/json" -d '{"hypothesis":"Suspicious PowerShell execution","scope":"All endpoints","timeframe":"24h"}'
```

#### Threat Intelligence Feed
```sh
curl "http://localhost:3001/api/security/threats/feed?feedType=malware&limit=5"
```

#### Threat Score Calculation
```sh
curl -X POST http://localhost:3001/api/security/threats/score -H "Content-Type: application/json" -d '{"indicators":[],"context":{},"weights":{}}'
```

---

**Happy coding! 🔐✨** 