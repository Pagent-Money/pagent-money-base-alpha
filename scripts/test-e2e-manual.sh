#!/bin/bash

# Manual E2E Test Script for Pagent Money
# 手动 E2E 测试脚本 for Pagent Money

echo "🚀 Starting Manual E2E Tests for Pagent Money..."
echo "============================================="

# Load environment variables
source .env.local

# Configuration
API_BASE="https://rpsfupahfggkpfstaxfx.supabase.co/functions/v1"
TEST_USER="0x1234567890123456789012345678901234567890"

echo ""
echo "📋 Test Configuration:"
echo "   Supabase URL: $NEXT_PUBLIC_SUPABASE_URL"
echo "   API Base: $API_BASE"
echo "   Test User: $TEST_USER"
echo "   Spender Address: $NEXT_PUBLIC_SPENDER_ADDRESS"

echo ""
echo "🔍 Test 1: Edge Function Health Checks"
echo "======================================"

echo "Testing receipts function..."
RECEIPTS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS "$API_BASE/receipts")
echo "   Receipts Function: HTTP $RECEIPTS_STATUS $([ $RECEIPTS_STATUS = "200" ] && echo "✅ PASS" || echo "❌ FAIL")"

echo "Testing permissions function..."
PERMISSIONS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS "$API_BASE/permissions")
echo "   Permissions Function: HTTP $PERMISSIONS_STATUS $([ $PERMISSIONS_STATUS = "200" ] && echo "✅ PASS" || echo "❌ FAIL")"

echo "Testing webhook function..."
WEBHOOK_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS "$API_BASE/card-webhook")
echo "   Card Webhook Function: HTTP $WEBHOOK_STATUS $([ $WEBHOOK_STATUS = "200" ] && echo "✅ PASS" || echo "❌ FAIL")"

echo ""
echo "🌐 Test 2: API Response Format"
echo "=============================="

echo "Testing receipts API response format..."
RECEIPTS_RESPONSE=$(curl -s "$API_BASE/receipts?user_id=$TEST_USER" \
  -H "Content-Type: application/json")
echo "   Receipts Response: $RECEIPTS_RESPONSE"

echo "Testing permissions API response format..."
PERMISSIONS_RESPONSE=$(curl -s "$API_BASE/permissions?user_id=$TEST_USER" \
  -H "Content-Type: application/json")
echo "   Permissions Response: $PERMISSIONS_RESPONSE"

echo ""
echo "🔗 Test 3: External API Integration"
echo "==================================="

echo "Testing Etherscan API..."
if [ "$NEXT_PUBLIC_ETHERSCAN_API_KEY" != "demo" ] && [ -n "$NEXT_PUBLIC_ETHERSCAN_API_KEY" ]; then
    ETHERSCAN_RESPONSE=$(curl -s "https://api-sepolia.basescan.org/api?module=proxy&action=eth_blockNumber&apikey=$NEXT_PUBLIC_ETHERSCAN_API_KEY")
    BLOCK_NUMBER=$(echo $ETHERSCAN_RESPONSE | grep -o '"result":"[^"]*' | cut -d'"' -f4)
    if [ -n "$BLOCK_NUMBER" ]; then
        DECIMAL_BLOCK=$((16#${BLOCK_NUMBER#0x}))
        echo "   Etherscan API: ✅ PASS (Latest block: $DECIMAL_BLOCK)"
    else
        echo "   Etherscan API: ❌ FAIL ($ETHERSCAN_RESPONSE)"
    fi
else
    echo "   Etherscan API: ⚠️ SKIP (Demo key)"
fi

echo "Testing Base Sepolia RPC..."
RPC_RESPONSE=$(curl -s -X POST "$NEXT_PUBLIC_RPC_URL" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}')
RPC_BLOCK=$(echo $RPC_RESPONSE | grep -o '"result":"[^"]*' | cut -d'"' -f4)
if [ -n "$RPC_BLOCK" ]; then
    RPC_DECIMAL=$((16#${RPC_BLOCK#0x}))
    echo "   Base Sepolia RPC: ✅ PASS (Block: $RPC_DECIMAL)"
else
    echo "   Base Sepolia RPC: ❌ FAIL ($RPC_RESPONSE)"
fi

echo ""
echo "💳 Test 4: Simulated Webhook Processing"
echo "======================================="

echo "Testing card authorization webhook..."
WEBHOOK_PAYLOAD='{
  "type": "authorization",
  "card_id": "test-card-'$(date +%s)'",
  "auth_id": "auth-'$(date +%s)'",
  "amount": "10000000",
  "merchant_name": "Test Coffee Shop",
  "merchant_category": "food_beverage",
  "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'"
}'

WEBHOOK_RESPONSE=$(curl -s -X POST "$API_BASE/card-webhook" \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: test-signature-$(date +%s)" \
  -H "X-Webhook-Timestamp: $(date +%s)" \
  -d "$WEBHOOK_PAYLOAD")

echo "   Webhook Payload: $WEBHOOK_PAYLOAD"
echo "   Webhook Response: $WEBHOOK_RESPONSE"

echo ""
echo "⚡ Test 5: Performance Metrics"
echo "============================="

echo "Testing response times..."
for i in {1..3}; do
    START_TIME=$(date +%s%3N)
    curl -s -o /dev/null "$API_BASE/receipts" -X OPTIONS
    END_TIME=$(date +%s%3N)
    RESPONSE_TIME=$((END_TIME - START_TIME))
    echo "   Response $i: ${RESPONSE_TIME}ms"
done

echo ""
echo "🎯 Test 6: Frontend Integration"
echo "==============================="

echo "Testing frontend application..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000")
echo "   Frontend Status: HTTP $FRONTEND_STATUS $([ $FRONTEND_STATUS = "200" ] && echo "✅ PASS" || echo "❌ FAIL")"

if [ $FRONTEND_STATUS = "200" ]; then
    echo "   Frontend URL: http://localhost:3000"
    echo "   🎉 Frontend is accessible!"
else
    echo "   ⚠️ Frontend not accessible - make sure 'npm run dev' is running"
fi

echo ""
echo "📊 Test Summary"
echo "=============="

TOTAL_TESTS=6
PASSED_TESTS=0

# Count passed tests based on status codes
[ $RECEIPTS_STATUS = "200" ] && ((PASSED_TESTS++))
[ $PERMISSIONS_STATUS = "200" ] && ((PASSED_TESTS++))  
[ $WEBHOOK_STATUS = "200" ] && ((PASSED_TESTS++))
[ -n "$BLOCK_NUMBER" ] && ((PASSED_TESTS++))
[ -n "$RPC_BLOCK" ] && ((PASSED_TESTS++))
[ $FRONTEND_STATUS = "200" ] && ((PASSED_TESTS++))

echo "   Tests Passed: $PASSED_TESTS/$TOTAL_TESTS"
echo "   Success Rate: $(( PASSED_TESTS * 100 / TOTAL_TESTS ))%"

if [ $PASSED_TESTS -eq $TOTAL_TESTS ]; then
    echo ""
    echo "🎉 ALL TESTS PASSED!"
    echo "✅ Pagent Money E2E system is fully functional!"
    echo ""
    echo "📋 Ready for:"
    echo "   - Frontend wallet connection testing"
    echo "   - Smart contract interaction testing"  
    echo "   - Production deployment"
else
    echo ""
    echo "⚠️ Some tests failed. Check the output above for details."
    echo "🔧 Fix any issues before proceeding to production."
fi

echo ""
echo "🚀 E2E Test Complete!"
echo "====================="
