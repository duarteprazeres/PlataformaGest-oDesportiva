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
