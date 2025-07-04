# AICyber Platform - Quick Reference Guide

## Quick Start Commands

### Installation
```bash
# Clone repository
git clone https://github.com/your-org/aicyber-platform.git
cd aicyber-platform

# Install dependencies
npm install
cd backend && npm install
cd ../frontend && npm install

# Setup environment
cp backend/env.example backend/.env
# Edit backend/.env with your configuration

# Start services
npm run dev
```

### Development Commands
```bash
# Start all services
npm run dev

# Start backend only
npm run dev:backend

# Start frontend only
npm run dev:frontend

# Build for production
npm run build

# Run tests
npm test
```

### Docker Commands
```bash
# Start with Docker
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild
docker-compose up -d --build
```

## API Quick Reference

### Base URLs
- **Development**: `http://localhost:3001`
- **Production**: `https://api.aicyber.com`

### Authentication
```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'

# Use token
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/security/events
```

### Health Checks
```bash
# Basic health
curl http://localhost:3001/health

# Detailed health
curl http://localhost:3001/health/detailed

# Database health
curl http://localhost:3001/health/database

# Redis health
curl http://localhost:3001/health/redis

# AI service health
curl http://localhost:3001/health/ai
```

### Security Services
```bash
# Security scan
curl -X POST http://localhost:3001/api/security/scan \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"target": "192.168.1.1", "scanType": "vulnerability"}'

# Anomaly detection
curl -X POST http://localhost:3001/api/ai-security/anomaly-detection \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"data": {...}, "threshold": 0.8}'

# NLP analysis
curl -X POST http://localhost:3001/api/ai-security/nlp-analysis \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"text": "Suspicious activity", "analysisType": "threat_detection"}'
```

## Environment Variables

### Essential Variables
```env
# Application
NODE_ENV=development
PORT=3001
API_VERSION=v1
USE_MOCK_DB=true

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=aicyber_platform
DB_USERNAME=your_username
DB_PASSWORD=your_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Security
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# AI Services
OPENAI_API_KEY=your_openai_api_key
AI_MODEL_NAME=gpt-4
```

Set `USE_MOCK_DB=true` to run the backend with the `MockDatabaseService` for
development. Change it to `false` to enable the PostgreSQL connection.

## Common Issues & Solutions

### Port Already in Use
```bash
# Find process
lsof -i :3001

# Kill process
kill -9 <PID>

# Use different port
PORT=3002 npm run dev:backend
```

### Database Connection Failed
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql

# Check credentials in .env
cat backend/.env | grep DB_
```

### Redis Connection Failed
```bash
# Check Redis status
sudo systemctl status redis

# Start Redis
sudo systemctl start redis

# Test connection
redis-cli ping
```

## Monitoring & Logs

### Log Files
```bash
# Error logs
tail -f backend/logs/error.log

# Combined logs
tail -f backend/logs/combined.log

# Docker logs
docker-compose logs -f backend
```

### Health Monitoring
```bash
# Check all services
curl http://localhost:3001/health/detailed | jq

# Monitor queue
curl http://localhost:3001/health/redis | jq

# Check memory usage
curl http://localhost:3001/health/detailed | jq '.system.memory'
```

## Performance Tuning

### Memory Optimization
```bash
# Increase Node.js memory
NODE_OPTIONS="--max-old-space-size=4096" npm run dev:backend

# Monitor memory usage
curl http://localhost:3001/health/detailed | jq '.system.memory'
```

### Database Optimization
```sql
-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Analyze tables
ANALYZE;
```

## Security Checklist

### Pre-Deployment
- [ ] Change default passwords
- [ ] Configure SSL/TLS
- [ ] Set up firewall rules
- [ ] Enable security headers
- [ ] Configure rate limiting

### Post-Deployment
- [ ] Test authentication
- [ ] Verify API security
- [ ] Check log rotation
- [ ] Test backup/restore
- [ ] Monitor performance

## Useful URLs

### Development
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health
- **Queue Dashboard**: http://localhost:3001/admin/queues

### Production
- **API**: https://api.aicyber.com
- **Health Check**: https://api.aicyber.com/health
- **Documentation**: https://docs.aicyber.com

## Support Contacts

- **Email**: support@aicyber.com
- **Phone**: +1-555-AICYBER
- **Documentation**: https://docs.aicyber.com
- **Community**: https://community.aicyber.com

---

*Quick Reference Guide - AICyber Platform v1.0.0* 