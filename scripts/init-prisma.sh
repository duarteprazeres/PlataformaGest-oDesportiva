#!/bin/bash

echo "🔧 Initializing Prisma..."

cd apps/backend

echo "📝 Generating Prisma Client..."
npx prisma generate

echo "🗄️  Pushing schema to database..."
npx prisma db push

echo "✅ Prisma initialized successfully!"
echo ""
echo "Run 'npm run prisma:studio' to open Prisma Studio"