#!/bin/bash

echo "🧹 Clearing Next.js cache and restarting development server..."

# Kill any existing Next.js processes
pkill -f "next dev" || true
pkill -f "next start" || true

# Clear Next.js cache
rm -rf .next
rm -rf node_modules/.cache

echo "✅ Cache cleared!"

# Wait a moment
sleep 2

echo "🚀 Starting development server..."
npm run dev
