#!/bin/bash

# Cybersecurity Platform Setup Script
echo "🚀 Setting up Cybersecurity Platform..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

print_success "Node.js version: $(node -v)"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_warning "Docker is not installed. Some features may not work."
else
    print_success "Docker is available"
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_warning "Docker Compose is not installed. Some features may not work."
else
    print_success "Docker Compose is available"
fi

# Create necessary directories
print_status "Creating project directories..."
mkdir -p backend/logs
mkdir -p backend/uploads
mkdir -p frontend
mkdir -p docs
mkdir -p tests
mkdir -p monitoring
mkdir -p nginx/ssl

# Copy environment file
if [ ! -f backend/.env ]; then
    print_status "Creating environment configuration..."
    cp backend/env.example backend/.env
    print_warning "Please edit backend/.env with your configuration"
else
    print_success "Environment file already exists"
fi

# Install root dependencies
print_status "Installing root dependencies..."
npm install

# Install backend dependencies
print_status "Installing backend dependencies..."
cd backend
npm install
cd ..

# Create basic frontend structure
print_status "Setting up frontend structure..."
if [ ! -d frontend/src ]; then
    mkdir -p frontend/src
    mkdir -p frontend/public
    print_success "Frontend directories created"
fi

# Create logs directory
print_status "Setting up logging..."
mkdir -p logs
touch logs/combined.log
touch logs/error.log

# Set up Git hooks
print_status "Setting up Git hooks..."
if [ -d .git ]; then
    npx husky install
    npx husky add .husky/pre-commit "npm run lint"
    npx husky add .husky/pre-push "npm run test"
    print_success "Git hooks configured"
fi

# Create initial database schema
print_status "Setting up database schema..."
cd backend
if [ -f "prisma/schema.prisma" ]; then
    npx prisma generate
    print_success "Prisma client generated"
else
    print_warning "Prisma schema not found. Please create it manually."
fi
cd ..

# Security check
print_status "Running security audit..."
npm audit --audit-level=moderate || print_warning "Security vulnerabilities found. Please review and fix."

# Create startup script
cat > start.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting Cybersecurity Platform..."

# Check if Docker is available
if command -v docker-compose &> /dev/null; then
    echo "Starting with Docker Compose..."
    docker-compose up -d
else
    echo "Starting locally..."
    npm run dev
fi

echo "✅ Platform started successfully!"
echo "📊 Backend API: http://localhost:3000"
echo "🌐 Frontend: http://localhost:3001"
echo "📈 Monitoring: http://localhost:3002"
echo "🔍 Security Scanner: http://localhost:8080"
EOF

chmod +x start.sh

# Create stop script
cat > stop.sh << 'EOF'
#!/bin/bash
echo "🛑 Stopping Cybersecurity Platform..."

if command -v docker-compose &> /dev/null; then
    docker-compose down
else
    echo "Stopping local processes..."
    pkill -f "node.*backend"
    pkill -f "node.*frontend"
fi

echo "✅ Platform stopped successfully!"
EOF

chmod +x stop.sh

print_success "🎉 Cybersecurity Platform setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Edit backend/.env with your configuration"
echo "2. Run './start.sh' to start the platform"
echo "3. Run './stop.sh' to stop the platform"
echo "4. Visit http://localhost:3000/health for API status"
echo ""
echo "📚 Documentation:"
echo "- Project overview: README.md"
echo "- API documentation: docs/api.md"
echo "- Security guidelines: docs/security.md"
echo ""
print_warning "⚠️  Remember to change default passwords and secrets in production!" 