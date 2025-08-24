# Docker Setup Guide

## Overview

This project includes a complete Docker setup with all necessary services for development and production environments.

## Services

### Core Services

- **API**: NestJS application (port 3000)
- **PostgreSQL**: Primary database (port 5432)
- **Redis**: Cache and session storage (port 6379)

### Development Tools (optional - use `--profile tools`)

- **PgAdmin**: PostgreSQL management UI (port 5050)
- **Redis Commander**: Redis management UI (port 8081)
- **MailHog**: Email testing tool (ports 1025/8025)

### Production (optional - use `--profile production`)

- **Nginx**: Reverse proxy and load balancer (ports 80/443)

## Quick Start

### Using Make (Recommended)

```bash
# Initial setup
make install

# Start development environment
make up

# Start with all tools
make up-tools

# View logs
make logs

# Access API shell
make shell

# Run tests
make test

# Stop services
make down
```

### Using Docker Compose Directly

```bash
# Start services
docker-compose up -d

# Start with tools
docker-compose --profile tools up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Run migrations
docker-compose exec api yarn migrate
```

## Environment Configuration

### Development

1. Copy `.env.docker` to `.env`:

   ```bash
   cp .env.docker .env
   ```

2. Update values as needed in `.env`

### Production

1. Use secure passwords and secrets
2. Use docker-compose.prod.yml:
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```

## Database Management

### Migrations

```bash
# Run migrations
make migrate

# Rollback last migration
make migrate-down
```

### Backup & Restore

```bash
# Create backup
make backup-db

# Restore from backup
make restore-db FILE=backup_20240101_120000.sql.gz
```

### Access Database

```bash
# PostgreSQL CLI
make shell-db

# PgAdmin UI
# Navigate to http://localhost:5050
# Login: admin@connectabil.com / admin123
```

## Development Workflow

### 1. Start Services

```bash
make up-tools
```

### 2. Watch Logs

```bash
make logs-api
```

### 3. Run Tests

```bash
# Unit tests
make test

# Watch mode
make test-watch

# Coverage
make test-cov
```

### 4. Access Container

```bash
# API shell
make shell

# Database shell
make shell-db

# Redis CLI
make redis-cli
```

## Service URLs

| Service         | URL                   | Credentials                      |
| --------------- | --------------------- | -------------------------------- |
| API             | http://localhost:3000 | -                                |
| PgAdmin         | http://localhost:5050 | admin@connectabil.com / admin123 |
| Redis Commander | http://localhost:8081 | admin / admin123                 |
| MailHog         | http://localhost:8025 | -                                |

## Troubleshooting

### Port Conflicts

If you have port conflicts, update the ports in `.env`:

```env
PORT=3001
DB_PORT=5433
REDIS_PORT=6380
```

### Permission Issues

```bash
# Fix permissions
sudo chown -R $(whoami):$(whoami) .
```

### Clean Docker System

```bash
# Remove unused containers, networks, images
make clean

# Complete cleanup (including volumes)
make down-volumes
```

### Rebuild Services

```bash
# Rebuild without cache
make build

# Rebuild specific service
docker-compose build --no-cache api
```

## Production Deployment

### Build Production Image

```bash
make build-prod
```

### Deploy with Docker Swarm

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml -c docker-compose.prod.yml connectabil
```

### Health Checks

All services include health checks:

- API: `GET /health`
- PostgreSQL: `pg_isready`
- Redis: `redis-cli ping`

## Security Notes

### Development

- Default passwords are for development only
- Services are exposed on all interfaces (0.0.0.0)
- Debug port (9229) is exposed

### Production

- Change all default passwords
- Use secrets management (Docker Secrets or external vault)
- Restrict exposed ports
- Enable SSL/TLS
- Use firewall rules
- Implement rate limiting
- Regular security updates

## Volumes

### Persistent Data

- `postgres_data`: PostgreSQL data
- `redis_data`: Redis persistence
- `pgadmin_data`: PgAdmin configuration
- `node_modules`: Node dependencies (development)

### Backup Strategy

```bash
# Backup all volumes
docker run --rm -v postgres_data:/data -v $(pwd)/backups:/backup alpine tar czf /backup/postgres_data.tar.gz /data

# Restore volume
docker run --rm -v postgres_data:/data -v $(pwd)/backups:/backup alpine tar xzf /backup/postgres_data.tar.gz -C /
```

## Monitoring

### Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api

# Last 100 lines
docker-compose logs --tail=100 api
```

### Resource Usage

```bash
# Container stats
docker stats

# Service status
make status
```

## Additional Commands

See all available commands:

```bash
make help
```
