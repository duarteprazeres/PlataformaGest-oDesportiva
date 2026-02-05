#!/bin/bash

echo "🚀 Setting up Sports Management SaaS..."

# Check prerequisites
echo "📋 Checking prerequisites..."
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed."; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required but not installed."; exit 1; }
command -v flutter >/dev/null 2>&1 || { echo "❌ Flutter is required but not installed."; exit 1; }

echo "✅ Prerequisites OK"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Setup environment
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please edit .env with your configuration"
fi

# Start Docker services
echo "🐳 Starting Docker services..."
docker-compose up -d postgres redis

# Wait for PostgreSQL
echo "⏳ Waiting for PostgreSQL..."
until docker-compose exec postgres pg_isready -U sports_admin; do
    sleep 2
done

# Run migrations
echo "📊 Running database schema..."
docker-compose exec postgres psql -U sports_admin -d sports_management -f /docker-entrypoint-initdb.d/99-full-schema.sql

echo "✅ Setup complete! Run 'npm run backend:dev' to start the backend."