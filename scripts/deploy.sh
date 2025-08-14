#!/bin/bash

# Pagent Money Deployment Script
# Usage: ./scripts/deploy.sh [environment]
# Environments: dev, staging, prod

set -e

ENVIRONMENT=${1:-dev}
PROJECT_ROOT=$(pwd)

echo "🚀 Starting Pagent Money deployment for environment: $ENVIRONMENT"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_requirements() {
    log_info "Checking requirements..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is required but not installed."
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        log_error "npm is required but not installed."
        exit 1
    fi
    
    # Check if .env exists
    if [ ! -f ".env.local" ] && [ ! -f ".env" ]; then
        log_warning "No environment file found. Please create .env.local from env.example"
        cp env.example .env.local
        log_info "Created .env.local from template. Please edit with your values."
        exit 1
    fi
    
    log_success "Requirements check passed"
}

install_dependencies() {
    log_info "Installing dependencies..."
    npm install
    log_success "Dependencies installed"
}

build_frontend() {
    log_info "Building frontend..."
    npm run build
    log_success "Frontend build completed"
}

deploy_contracts() {
    log_info "Deploying smart contracts..."
    
    cd contracts
    
    # Check if Foundry is installed
    if ! command -v forge &> /dev/null; then
        log_error "Foundry is required for contract deployment. Install from: https://book.getfoundry.sh/"
        exit 1
    fi
    
    # Check if .env exists in contracts directory
    if [ ! -f ".env" ]; then
        log_warning "No contracts/.env file found. Creating from template..."
        cp env.example .env
        log_info "Please edit contracts/.env with your deployment keys and run again."
        exit 1
    fi
    
    # Load environment variables
    source .env
    
    if [ -z "$PRIVATE_KEY" ]; then
        log_error "PRIVATE_KEY not set in contracts/.env"
        exit 1
    fi
    
    # Compile contracts
    log_info "Compiling contracts..."
    forge build
    
    # Run tests
    log_info "Running contract tests..."
    forge test
    
    # Deploy based on environment
    case $ENVIRONMENT in
        "dev")
            if [ -z "$BASE_SEPOLIA_RPC_URL" ]; then
                log_error "BASE_SEPOLIA_RPC_URL not set for dev deployment"
                exit 1
            fi
            log_info "Deploying to Base Sepolia (testnet)..."
            forge script script/Deploy.s.sol --rpc-url $BASE_SEPOLIA_RPC_URL --private-key $PRIVATE_KEY --broadcast
            ;;
        "staging"|"prod")
            if [ -z "$BASE_MAINNET_RPC_URL" ]; then
                log_error "BASE_MAINNET_RPC_URL not set for $ENVIRONMENT deployment"
                exit 1
            fi
            log_info "Deploying to Base Mainnet..."
            forge script script/Deploy.s.sol --rpc-url $BASE_MAINNET_RPC_URL --private-key $PRIVATE_KEY --broadcast --verify
            ;;
    esac
    
    cd $PROJECT_ROOT
    log_success "Smart contracts deployed"
}

deploy_supabase() {
    log_info "Deploying Supabase functions..."
    
    # Check if Supabase CLI is installed
    if ! command -v supabase &> /dev/null; then
        log_warning "Supabase CLI not found. Installing..."
        npm install -g supabase
    fi
    
    # Check if user is logged in
    if ! supabase projects list &> /dev/null; then
        log_info "Please login to Supabase:"
        supabase login
    fi
    
    # Deploy functions
    log_info "Deploying Edge Functions..."
    supabase functions deploy card-webhook
    supabase functions deploy permissions
    supabase functions deploy receipts
    
    log_success "Supabase functions deployed"
}

deploy_frontend() {
    log_info "Deploying frontend..."
    
    case $ENVIRONMENT in
        "dev")
            log_info "Starting development server..."
            npm run dev &
            DEV_PID=$!
            log_success "Development server started (PID: $DEV_PID)"
            log_info "Visit http://localhost:3000 to view the application"
            ;;
        "staging"|"prod")
            # Check if Vercel CLI is installed
            if ! command -v vercel &> /dev/null; then
                log_warning "Vercel CLI not found. Installing..."
                npm install -g vercel
            fi
            
            # Deploy to Vercel
            if [ "$ENVIRONMENT" = "prod" ]; then
                vercel --prod
            else
                vercel
            fi
            log_success "Frontend deployed to Vercel"
            ;;
    esac
}

run_tests() {
    log_info "Running tests..."
    
    # Frontend tests
    npm run type-check
    npm run lint
    
    # Contract tests (already run in deploy_contracts)
    log_success "All tests passed"
}

cleanup() {
    log_info "Cleaning up..."
    # Kill development server if running
    if [ ! -z "$DEV_PID" ]; then
        kill $DEV_PID 2>/dev/null || true
    fi
}

main() {
    # Set up cleanup trap
    trap cleanup EXIT
    
    log_info "Deploying Pagent Money to $ENVIRONMENT environment"
    
    check_requirements
    install_dependencies
    run_tests
    build_frontend
    
    if [ "$ENVIRONMENT" != "frontend-only" ]; then
        deploy_contracts
        deploy_supabase
    fi
    
    deploy_frontend
    
    log_success "🎉 Deployment completed successfully!"
    log_info "Next steps:"
    echo "  1. Test the complete flow (wallet connection, permissions, transactions)"
    echo "  2. Monitor logs for any issues"
    echo "  3. Update environment variables with deployed contract addresses"
    
    if [ "$ENVIRONMENT" = "dev" ]; then
        echo "  4. Development server is running at http://localhost:3000"
        echo "  5. Press Ctrl+C to stop the server"
        wait $DEV_PID
    fi
}

# Run main function
main
