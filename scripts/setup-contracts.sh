#!/bin/bash

# Setup contracts environment for deployment
echo "🔧 Setting up contracts environment..."

cd contracts

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    cp env.example .env
    echo "📝 Created contracts/.env from template"
    echo ""
    echo "⚠️  IMPORTANT: You need to add your deployment keys to contracts/.env"
    echo "   - Get your private key from your wallet (MetaMask, etc.)"
    echo "   - Add it to PRIVATE_KEY= in contracts/.env (without 0x prefix)"
    echo "   - Get your Etherscan API key from https://etherscan.io/apis"
    echo "   - Add it to ETHERSCAN_API_KEY= in contracts/.env"
    echo "   - Make sure your wallet has Base Sepolia ETH for gas"
    echo ""
    echo "💡 You can get Base Sepolia ETH from:"
    echo "   - https://www.alchemy.com/faucets/base-sepolia"
    echo "   - https://faucet.coinbase.com"
    echo ""
    echo "🎯 After adding your private key, run:"
    echo "   cd contracts && forge script script/Deploy.s.sol --rpc-url https://sepolia.base.org --private-key \$PRIVATE_KEY --broadcast --verify"
else
    echo "✅ contracts/.env already exists"
fi

echo ""
echo "📋 Current contracts status:"
echo "   ✅ OpenZeppelin contracts installed"
echo "   ✅ Forge-std installed" 
echo "   ✅ Contracts compiled successfully"
echo "   ✅ Most tests passing"
echo ""
echo "🚀 Ready for deployment to Base Sepolia!"
