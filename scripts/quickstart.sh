#!/bin/bash

# Pagent Money Quick Start Script
# Sets up the project for local development

set -e

echo "🏁 Pagent Money Quick Start"
echo "=========================="

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Step 1: Check dependencies
log_info "Step 1: Checking dependencies..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install npm."
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version $NODE_VERSION found. Please upgrade to Node.js 18+."
    exit 1
fi

log_success "Node.js $(node --version) and npm $(npm --version) found"

# Step 2: Install dependencies
log_info "Step 2: Installing dependencies..."
npm install
log_success "Dependencies installed"

# Step 3: Set up environment
log_info "Step 3: Setting up environment..."
if [ ! -f ".env.local" ]; then
    cp env.example .env.local
    log_warning "Created .env.local from template"
    echo ""
    echo "📝 IMPORTANT: Please edit .env.local with your actual values:"
    echo "   - Supabase URL and keys (create project at https://supabase.com)"
    echo "   - Coinbase API key (get from https://portal.cdp.coinbase.com/)"
    echo ""
    echo "For testing, you can use these placeholder values:"
    echo "NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321"
    echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=test-key"
    echo "NEXT_PUBLIC_COINBASE_API_KEY=test-key"
    echo ""
    read -p "Press Enter after updating .env.local to continue..."
else
    log_success "Environment file already exists"
fi

# Step 4: Type check
log_info "Step 4: Running type check..."
npm run type-check
log_success "Type check passed"

# Step 5: Build test
log_info "Step 5: Testing build..."
npm run build
log_success "Build successful"

# Step 6: Start development server
log_info "Step 6: Starting development server..."
echo ""
echo "🎉 Setup complete! Starting Pagent Money..."
echo ""
echo "📱 The app will open at: http://localhost:3000"
echo "🔧 Features available in development mode:"
echo "   ✅ Wallet connection simulation"
echo "   ✅ Spend permission management"
echo "   ✅ Transaction demo"
echo "   ✅ Credit dashboard"
echo ""
echo "🚀 Next steps for full functionality:"
echo "   1. Set up Supabase project and update .env.local"
echo "   2. Deploy smart contracts to Base Sepolia"
echo "   3. Configure card vendor integration"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm run dev
