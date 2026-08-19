# MITRADESA

Manajemen Informasi dan Administrasi Desa

An integrated platform for village information management, administration, public services, participatory planning, and transparency.

## Project Status

**Phase 1: Project Foundation** - In Progress

## Architecture

See [docs/architecture/ARCHITECTURE-BASELINE.md](./docs/architecture/ARCHITECTURE-BASELINE.md) for the complete architecture specification.

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Express.js + TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL 15+
- **Auth**: JWT
- **Testing**: Jest + Playwright

## Project Structure

```
mitradesa/
├── apps/
│   ├── api/          # Express.js backend
│   └── web/           # React frontend
├── packages/
│   └── shared/       # Shared types and utilities
├── prisma/           # Database schema
├── docs/             # Documentation
└── tests/            # E2E tests
```

## Getting Started

See [docs/development/01-LOCAL-DEVELOPMENT.md](./docs/development/01-LOCAL-DEVELOPMENT.md) for detailed setup instructions.

## Development

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Setup database
npm run prisma:generate
npm run prisma:migrate

# Run development
npm run dev:api    # Backend
npm run dev:web    # Frontend

# Build
npm run build

# Test
npm run test
npm run test:e2e
```

## Documentation

- [Architecture Baseline](./docs/architecture/ARCHITECTURE-BASELINE.md)
- [Implementation Contract](./docs/architecture/phase-0.5/12-IMPLEMENTATION-CONTRACT.md)
- [Development Guide](./docs/development/)

## License

Private - All rights reserved
