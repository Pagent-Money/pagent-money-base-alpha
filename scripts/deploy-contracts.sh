#!/bin/bash

echo "🚀 Deploying Pagent Smart Contracts to Base Sepolia"
echo ""

# Check if we're in the right directory
if [ ! -f "contracts/foundry.toml" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

cd contracts

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ contracts/.env file not found!"
    echo "Please copy env.example to .env and add your private key and API key"
    exit 1
fi

# Source the environment variables
source .env

# Check if required variables are set
if [ -z "$PRIVATE_KEY" ] || [ "$PRIVATE_KEY" = "your_private_key_here" ]; then
    echo "❌ PRIVATE_KEY not set in contracts/.env"
    echo ""
    echo "📝 To deploy contracts, you need to:"
    echo "1. Export your private key from MetaMask (without 0x prefix)"
    echo "2. Add it to contracts/.env as PRIVATE_KEY=your_key_here"
    echo "3. Make sure you have Base Sepolia ETH for gas"
    echo ""
    echo "💡 Get Base Sepolia ETH from:"
    echo "   - https://www.alchemy.com/faucets/base-sepolia"
    echo "   - https://faucet.coinbase.com"
    exit 1
fi

if [ -z "$ETHERSCAN_API_KEY" ] || [ "$ETHERSCAN_API_KEY" = "your_etherscan_api_key_here" ]; then
    echo "❌ ETHERSCAN_API_KEY not set in contracts/.env"
    echo ""
    echo "📝 To verify contracts, you need to:"
    echo "1. Get an API key from https://etherscan.io/apis"
    echo "2. Add it to contracts/.env as ETHERSCAN_API_KEY=your_key_here"
    echo ""
    echo "⚠️  You can deploy without verification, but verification is recommended"
    read -p "Deploy without verification? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
    VERIFY_FLAG=""
else
    VERIFY_FLAG="--verify --etherscan-api-key $ETHERSCAN_API_KEY"
fi

echo "🔨 Building contracts..."
forge build

if [ $? -ne 0 ]; then
    echo "❌ Contract build failed"
    exit 1
fi

echo "✅ Contracts built successfully"
echo ""

echo "🚀 Deploying to Base Sepolia..."
echo "   Network: Base Sepolia (Chain ID: 84532)"
echo "   RPC: $BASE_SEPOLIA_RPC_URL"
echo "   Deployer: $(cast wallet address --private-key $PRIVATE_KEY)"
echo ""

# Deploy with or without verification
if [ -n "$VERIFY_FLAG" ]; then
    echo "📋 Deploying with contract verification..."
    forge script script/Deploy.s.sol:DeployScript \
        --rpc-url $BASE_SEPOLIA_RPC_URL \
        --private-key $PRIVATE_KEY \
        --broadcast \
        $VERIFY_FLAG
else
    echo "⚠️  Deploying without contract verification..."
    forge script script/Deploy.s.sol:DeployScript \
        --rpc-url $BASE_SEPOLIA_RPC_URL \
        --private-key $PRIVATE_KEY \
        --broadcast
fi

DEPLOY_RESULT=$?

if [ $DEPLOY_RESULT -eq 0 ]; then
    echo ""
    echo "🎉 Deployment completed successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Check deployment on https://sepolia.basescan.org"
    echo "2. Update contract addresses in your .env.local"
    echo "3. Test the contracts with your application"
    echo ""
else
    echo ""
    echo "❌ Deployment failed!"
    echo ""
    echo "🔧 Common issues:"
    echo "- Insufficient Base Sepolia ETH for gas"
    echo "- Invalid private key format"
    echo "- Network connectivity issues"
    echo ""
fi

cd ..
exit $DEPLOY_RESULT
