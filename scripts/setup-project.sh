#!/bin/bash

set -e  # Exit on error

echo "🚀 Setting up Sports Management SaaS Project..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get project root
PROJECT_ROOT=$(pwd)

echo "📁 Project root: $PROJECT_ROOT"
echo ""

# ============================================================================
# 1. CREATE DIRECTORY STRUCTURE
# ============================================================================

echo "${YELLOW}📂 Creating directory structure...${NC}"

# Root level directories
mkdir -p .github/workflows
mkdir -p database/{schema,migrations,seeds/{dev,production},docs}
mkdir -p docs/{api,architecture,guides}
mkdir -p infrastructure/{docker,kubernetes,terraform}
mkdir -p packages/{types,constants}
mkdir -p scripts

# Backend directories
mkdir -p apps/backend/src/{common,modules,database}
mkdir -p apps/backend/src/common/{config,decorators,filters,guards,interceptors,middleware,pipes,dto,interfaces}
mkdir -p apps/backend/src/modules/{auth,clubs,users,players,teams,trainings,matches,payments,orders,stock,notifications,reports}
mkdir -p apps/backend/test/{unit,integration,e2e}
mkdir -p apps/backend/prisma

# Mobile directories
mkdir -p apps/mobile/lib/{core,features,shared,routes}
mkdir -p apps/mobile/lib/core/{config,constants,network,storage,utils,errors}
mkdir -p apps/mobile/lib/features/{auth,players,teams,trainings,payments,store,profile}
mkdir -p apps/mobile/lib/shared/{widgets,theme}
mkdir -p apps/mobile/assets/{images,icons,fonts}
mkdir -p apps/mobile/test

echo "${GREEN}✅ Directory structure created${NC}"
echo ""

# ============================================================================
# 2. CREATE ROOT CONFIGURATION FILES
# ============================================================================

echo "${YELLOW}📝 Creating root configuration files...${NC}"

# .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/
*.lcov

# Production
build/
dist/
*.tsbuildinfo

# Environment
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# Prisma
apps/backend/prisma/migrations/
*.db
*.db-journal

# Flutter
apps/mobile/.dart_tool/
apps/mobile/.flutter-plugins
apps/mobile/.flutter-plugins-dependencies
apps/mobile/.packages
apps/mobile/build/
apps/mobile/ios/Pods/
apps/mobile/ios/.symlinks/
apps/mobile/android/.gradle/
apps/mobile/android/app/debug/
apps/mobile/android/app/profile/
apps/mobile/android/app/release/

# Temporary
tmp/
temp/
*.tmp
.cache/
EOF

# .env.example
cat > .env.example << 'EOF'
# Database
DATABASE_URL="postgresql://sports_admin:your_password@localhost:5432/sports_management?schema=public"
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sports_management
DB_USER=sports_admin
DB_PASSWORD=your_secure_password_here

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your_refresh_secret_key
JWT_REFRESH_EXPIRES_IN=30d

# API
NODE_ENV=development
API_PORT=3000
API_URL=http://localhost:3000
API_PREFIX=api/v1

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:19006

# File Storage (MinIO/S3)
STORAGE_ENDPOINT=localhost
STORAGE_PORT=9000
STORAGE_USE_SSL=false
STORAGE_ACCESS_KEY=minioadmin
STORAGE_SECRET_KEY=minioadmin123
STORAGE_BUCKET=sports-files
STORAGE_REGION=us-east-1

# Payment Providers
MBWAY_API_KEY=
MBWAY_API_URL=https://api.mbway.pt
MULTIBANCO_ENTITY=12345
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM_NAME=Sports Management
SMTP_FROM_EMAIL=noreply@sportsmanagement.com

# Push Notifications
FCM_SERVER_KEY=
APNS_KEY_ID=
APNS_TEAM_ID=

# Mobile App
MOBILE_APP_URL=sportsmanagement://

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100

# Logging
LOG_LEVEL=debug
EOF

# Root package.json (workspace)
cat > package.json << 'EOF'
{
  "name": "sports-management-saas",
  "version": "1.0.0",
  "description": "Multi-tenant SaaS platform for football club management",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "backend:dev": "cd apps/backend && npm run start:dev",
    "backend:build": "cd apps/backend && npm run build",
    "backend:start": "cd apps/backend && npm run start:prod",
    "backend:test": "cd apps/backend && npm run test",
    "backend:test:e2e": "cd apps/backend && npm run test:e2e",
    "mobile:run:android": "cd apps/mobile && flutter run",
    "mobile:run:ios": "cd apps/mobile && flutter run -d ios",
    "mobile:build:android": "cd apps/mobile && flutter build apk",
    "mobile:build:ios": "cd apps/mobile && flutter build ios",
    "mobile:test": "cd apps/mobile && flutter test",
    "prisma:generate": "cd apps/backend && npx prisma generate",
    "prisma:studio": "cd apps/backend && npx prisma studio",
    "prisma:migrate": "cd apps/backend && npx prisma migrate dev",
    "prisma:migrate:prod": "cd apps/backend && npx prisma migrate deploy",
    "prisma:seed": "cd apps/backend && npx prisma db seed",
    "prisma:reset": "cd apps/backend && npx prisma migrate reset",
    "db:setup": "docker-compose up -d postgres redis && sleep 5 && npm run prisma:migrate",
    "db:seed": "npm run prisma:seed",
    "db:reset": "sh scripts/db-reset.sh",
    "docker:up": "docker-compose up -d",
    "docker:down": "docker-compose down",
    "docker:logs": "docker-compose logs -f",
    "docker:clean": "docker-compose down -v",
    "install:all": "npm install && cd apps/backend && npm install",
    "lint": "npm run lint --workspaces --if-present",
    "format": "prettier --write \"**/*.{ts,tsx,json,md}\"",
    "format:check": "prettier --check \"**/*.{ts,tsx,json,md}\"",
    "test": "npm run test --workspaces --if-present",
    "clean": "rm -rf node_modules apps/*/node_modules packages/*/node_modules"
  },
  "devDependencies": {
    "prettier": "^3.1.0",
    "husky": "^8.0.0",
    "lint-staged": "^15.2.0"
  },
  "engines": {
    "node": ">=20.0.0",
    "npm": ">=10.0.0"
  }
}
EOF

# README.md
cat > README.md << 'EOF'
# 🏆 Sports Management SaaS

Multi-tenant platform for football club management.

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- Flutter 3.16+ (for mobile app)
- PostgreSQL 16+ (or use Docker)

### Installation

1. **Clone and setup**
```bash
git clone <your-repo-url>
cd PlataformaGest-oDesportiva
sh scripts/setup-project.sh
```

2. **Setup environment**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start infrastructure**
```bash
npm run docker:up
```

4. **Setup database**
```bash
npm run db:setup
npm run db:seed
```

5. **Start backend**
```bash
npm run backend:dev
```

6. **Start mobile app**
```bash
npm run mobile:run:android
# or
npm run mobile:run:ios
```

## 📁 Project Structure
```
sports-management-saas/
├── apps/
│   ├── backend/         # NestJS API
│   └── mobile/          # Flutter App
├── database/
│   └── schema/          # SQL schemas
├── packages/            # Shared code
└── scripts/             # Automation scripts
```

## 🗄️ Database

- PostgreSQL 16 with multi-tenant architecture
- Prisma ORM for type-safe database access
- Run `npm run prisma:studio` to explore data

## 📚 Documentation

- API Documentation: http://localhost:3000/api/docs
- Database Schema: [database/docs/](database/docs/)

## 🧪 Testing
```bash
npm run test              # All tests
npm run backend:test      # Backend tests
npm run mobile:test       # Mobile tests
```

## 📦 Useful Commands
```bash
npm run prisma:studio     # Open Prisma Studio
npm run docker:logs       # View Docker logs
npm run db:reset          # Reset database
```

## 📄 License

MIT
EOF

echo "${GREEN}✅ Root configuration files created${NC}"
echo ""

# ============================================================================
# 3. CREATE BACKEND STRUCTURE
# ============================================================================

echo "${YELLOW}🔧 Setting up Backend (NestJS)...${NC}"

cd apps/backend

# Backend package.json
cat > package.json << 'EOF'
{
  "name": "sports-management-backend",
  "version": "1.0.0",
  "description": "Sports Management SaaS - Backend API",
  "author": "",
  "private": true,
  "license": "MIT",
  "scripts": {
    "build": "nest build",
    "format": "prettier --write \"src/**/*.ts\" \"test/**/*.ts\"",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "start:prod": "node dist/main",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand",
    "test:e2e": "jest --config ./test/jest-e2e.json",
    "prisma:generate": "prisma generate",
    "prisma:studio": "prisma studio",
    "prisma:migrate": "prisma migrate dev",
    "prisma:seed": "ts-node prisma/seed.ts"
  },
  "dependencies": {
    "@nestjs/common": "^10.3.0",
    "@nestjs/core": "^10.3.0",
    "@nestjs/platform-express": "^10.3.0",
    "@nestjs/config": "^3.1.1",
    "@nestjs/jwt": "^10.2.0",
    "@nestjs/passport": "^10.0.3",
    "@nestjs/swagger": "^7.1.17",
    "@nestjs/throttler": "^5.1.1",
    "@prisma/client": "^5.8.0",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "passport-local": "^1.0.0",
    "bcrypt": "^5.1.1",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1",
    "reflect-metadata": "^0.2.1",
    "rxjs": "^7.8.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.2.1",
    "@nestjs/schematics": "^10.0.3",
    "@nestjs/testing": "^10.3.0",
    "@types/express": "^4.17.21",
    "@types/jest": "^29.5.11",
    "@types/node": "^20.10.6",
    "@types/passport-jwt": "^4.0.0",
    "@types/passport-local": "^1.0.38",
    "@types/bcrypt": "^5.0.2",
    "@typescript-eslint/eslint-plugin": "^6.17.0",
    "@typescript-eslint/parser": "^6.17.0",
    "eslint": "^8.56.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-prettier": "^5.1.2",
    "jest": "^29.7.0",
    "prettier": "^3.1.1",
    "prisma": "^5.8.0",
    "source-map-support": "^0.5.21",
    "ts-jest": "^29.1.1",
    "ts-loader": "^9.5.1",
    "ts-node": "^10.9.2",
    "tsconfig-paths": "^4.2.0",
    "typescript": "^5.3.3"
  },
  "jest": {
    "moduleFileExtensions": [
      "js",
      "json",
      "ts"
    ],
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": {
      "^.+\\.(t|j)s$": "ts-jest"
    },
    "collectCoverageFrom": [
      "**/*.(t|j)s"
    ],
    "coverageDirectory": "../coverage",
    "testEnvironment": "node"
  },
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
EOF

# tsconfig.json
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": false,
    "noImplicitAny": false,
    "strictBindCallApply": false,
    "forceConsistentCasingInFileNames": false,
    "noFallthroughCasesInSwitch": false,
    "paths": {
      "@/*": ["src/*"],
      "@common/*": ["src/common/*"],
      "@modules/*": ["src/modules/*"],
      "@database/*": ["src/database/*"]
    }
  }
}
EOF

# nest-cli.json
cat > nest-cli.json << 'EOF'
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true
  }
}
EOF

# .env
cat > .env << 'EOF'
DATABASE_URL="postgresql://sports_admin:dev_password@localhost:5432/sports_management?schema=public"

NODE_ENV=development
API_PORT=3000
JWT_SECRET=dev_secret_change_in_production
JWT_EXPIRES_IN=7d
EOF

# .eslintrc.js
cat > .eslintrc.js << 'EOF'
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
  },
};
EOF

# .prettierrc
cat > .prettierrc << 'EOF'
{
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "semi": true
}
EOF

# Dockerfile
cat > Dockerfile << 'EOF'
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

RUN npm run build
RUN npx prisma generate

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
EOF

# .dockerignore
cat > .dockerignore << 'EOF'
node_modules
dist
.env
.git
.gitignore
README.md
npm-debug.log
EOF

echo "${GREEN}✅ Backend structure created${NC}"

# ============================================================================
# 4. INSTALL BACKEND DEPENDENCIES
# ============================================================================

echo ""
echo "${YELLOW}📦 Installing backend dependencies...${NC}"
echo "This may take a few minutes..."
echo ""

npm install

echo "${GREEN}✅ Backend dependencies installed${NC}"

cd "$PROJECT_ROOT"

echo ""
echo "${GREEN}🎉 Project setup complete!${NC}"
echo ""
echo "${YELLOW}Next steps:${NC}"
echo "1. Copy SQL schema to database/schema/99-full-schema.sql"
echo "2. Copy Prisma schema (I'll provide next)"
echo "3. Run: ${GREEN}npm run docker:up${NC} (start database)"
echo "4. Run: ${GREEN}npm run prisma:generate${NC}"
echo "5. Run: ${GREEN}npm run prisma:migrate${NC}"
echo "6. Run: ${GREEN}npm run backend:dev${NC}"
echo ""