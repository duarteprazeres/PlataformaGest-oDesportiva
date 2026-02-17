# Sports Management Platform

## Infrastructure & DevOps

### Documentation
- [WAL Archiving Configuration](./docs/wal-archiving.md)
- [Disaster Recovery Plan](./docs/disaster-recovery.md)

### Commands
- **Backup**: `npm run db:backup` - Creates a SQL dump in `backups/`.
- **Restore**: `npm run db:restore <file>` - Restores DB from a file.
- **Health Check**: `GET /health`
- **Metrics**: `GET /metrics`

### Environment Variables
| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL Connection String | Yes | - |
| `NODE_ENV` | Environment (development/production) | No | development |
| `API_PORT` | Port to run the API on | No | 3000 |
| `JWT_SECRET` | Secret key for JWT signing | Yes | - |
| `JWT_EXPIRES_IN` | JWT expiration time | No | 1d |
| `SENTRY_DSN` | Sentry DSN for error tracking | No | - |
| `THROTTLE_TTL` | Rate limit window in seconds | No | 60 |
| `THROTTLE_LIMIT` | Requests per window | No | 100 |
