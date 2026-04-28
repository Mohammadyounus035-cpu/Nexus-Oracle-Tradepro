#!/bin/bash
# setup-ingestion.sh
# Quick setup script for Databento ingestion

set -e

echo "🔱 Setting up Databento Ingestion..."

# Check if Node/npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install Node.js"
    exit 1
fi

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "📝 Please edit .env and add your DATABENTO_API_KEY"
    exit 1
fi

# Check if API key is configured
if ! grep -q "DATABENTO_API_KEY=" .env; then
    echo "❌ DATABENTO_API_KEY not set in .env"
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo "✅ Creating data directory..."
mkdir -p data

echo ""
echo "🚀 Setup complete! You can now run:"
echo ""
echo "   npm run ingest           # Run single ingestion"
echo "   npm run ingest:watch     # Auto-restart on changes"
echo ""
echo "Test run (dry):"
echo "   npx ts-node ingest.ts"
echo ""
echo "View ingested data:"
echo "   ls -la data/"
echo "   jq . data/SPY_*.json"
echo ""
