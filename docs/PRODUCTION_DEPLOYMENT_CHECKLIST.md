# MITRADESA — PRODUCTION DEPLOYMENT CHECKLIST

## Pre-Deployment Requirements

### 1. Production Infrastructure

| Item | Status | Notes |
|------|--------|-------|
| [ ] Production Server/VPS | REQUIRED | e.g., AWS EC2, DigitalOcean, Vultr |
| [ ] Production Domain | REQUIRED | e.g., mitradesa.desa.id |
| [ ] DNS Configuration | REQUIRED | A record pointing to server IP |
| [ ] SSL Certificate | REQUIRED | Let's Encrypt or commercial CA |
| [ ] Production Database | REQUIRED | Separate from dev/staging |
| [ ] Production Storage | REQUIRED | S3/MinIO or local with backup |

### 2. Environment Configuration

| Item | Status | Notes |
|------|--------|-------|
| [ ] Create `apps/api/.env.production` | REQUIRED | Use template |
| [ ] Create `apps/web/.env.production` | REQUIRED | Use template |
| [ ] Generate production JWT_SECRET | REQUIRED | 64+ char random string |
| [ ] Configure DATABASE_URL | REQUIRED | Production PostgreSQL |
| [ ] Configure ALLOWED_ORIGINS | REQUIRED | Production domain only |
| [ ] Configure API_URL | REQUIRED | Production API URL |
| [ ] Configure WEB_URL | REQUIRED | Production frontend URL |

### 3. Security Configuration

| Item | Status | Notes |
|------|--------|-------|
| [ ] SSL/TLS enabled | REQUIRED | HTTPS only |
| [ ] CORS restricted | REQUIRED | No wildcard origins |
| [ ] Rate limiting active | REQUIRED | Already configured |
| [ ] Security headers | REQUIRED | Already configured |
| [ ] Database SSL | REQUIRED | `?sslmode=require` |
| [ ] Firewall configured | REQUIRED | Block non-443 ports |

### 4. Database

| Item | Status | Notes |
|------|--------|-------|
| [ ] Create production database | REQUIRED | Empty schema |
| [ ] Run `prisma migrate deploy` | REQUIRED | Apply migrations |
| [ ] Create backup | REQUIRED | Before any data |
| [ ] Verify backup restore | RECOMMENDED | Test on isolated DB |
| [ ] Configure connection pool | RECOMMENDED | pgBouncer/pgpool |

### 5. Build

```bash
# Build for production
npm run build

# Verify build artifacts
ls apps/api/dist/
ls apps/web/dist/

# Verify no localhost references in build
grep -r "localhost" apps/*/dist/ || echo "No localhost refs"
grep -r "127.0.0.1" apps/*/dist/ || echo "No 127.0.0.1 refs"
```

| Item | Status | Notes |
|------|--------|-------|
| [ ] API build succeeds | REQUIRED | |
| [ ] Web build succeeds | REQUIRED | |
| [ ] No localhost in build | REQUIRED | |
| [ ] No secrets in build | REQUIRED | |

### 6. Deployment

| Item | Status | Notes |
|------|--------|-------|
| [ ] Deploy API to production | REQUIRED | PM2, Docker, or systemd |
| [ ] Deploy Web to production | REQUIRED | Nginx serving dist/ |
| [ ] Configure Nginx | REQUIRED | Reverse proxy to API |
| [ ] Configure PM2 ecosystem | RECOMMENDED | Process manager |
| [ ] Start services | REQUIRED | |
| [ ] Enable auto-start | RECOMMENDED | systemd service |

### 7. Verification

```bash
# Test production health
curl https://<PRODUCTION_API>/api/health
curl https://<PRODUCTION_WEB>/api/health/ready

# Test production endpoints
curl https://<PRODUCTION_API>/api/health/database
```

| Item | Status | Notes |
|------|--------|-------|
| [ ] API health returns 200 | REQUIRED | |
| [ ] Database connected | REQUIRED | |
| [ ] Web loads correctly | REQUIRED | |
| [ ] Login works | REQUIRED | |
| [ ] Admin pages accessible | REQUIRED | |

### 8. Post-Deployment

| Item | Status | Notes |
|------|--------|-------|
| [ ] Monitor logs | REQUIRED | First 24 hours |
| [ ] Test critical workflows | REQUIRED | Dashboard, CRUD |
| [ ] Verify HTTPS | REQUIRED | No mixed content |
| [ ] Test mobile responsive | RECOMMENDED | |
| [ ] Test keyboard accessibility | RECOMMENDED | |

---

## Deployment Commands

### Option A: PM2 (Recommended for VPS)

```bash
# Install PM2
npm install -g pm2

# Create ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'mitradesa-api',
      script: 'dist/index.js',
      cwd: 'apps/api',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
EOF

# Start
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Option B: Docker

```bash
# Build production image
docker build -t mitradesa-api -f apps/api/Dockerfile .
docker build -t mitradesa-web -f apps/web/Dockerfile .

# Run with environment
docker run -d \
  --name mitradesa-api \
  --env-file apps/api/.env.production \
  -p 3001:3001 \
  mitradesa-api
```

### Option C: Direct (Nginx + Node)

```bash
# Build first
npm run build

# API with environment
NODE_ENV=production node apps/api/dist/index.js &

# Nginx config
server {
    listen 443 ssl;
    server_name mitradesa.desa.id;

    location / {
        root /path/to/apps/web/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3001;
    }
}
```

---

## Rollback Procedure

### If critical issue detected:

1. **Immediate rollback:**
```bash
# Restore previous version
git checkout <previous-tag>
npm run build

# Restart services
pm2 restart mitradesa-api
# or
systemctl restart mitradesa-api
```

2. **Database rollback:**
```bash
# Restore from backup
pg_restore -h <host> -U <user> -d mitradesa_production backup.dump
```

3. **Notify team:**
- Document issue
- Create incident report
- Schedule post-mortem

---

## Emergency Contacts

| Role | Contact | Responsibility |
|------|---------|----------------|
| DevOps Lead | TBD | Infrastructure |
| Backend Lead | TBD | API issues |
| Frontend Lead | TBD | Web issues |
| DBA | TBD | Database |

---

## Sign-Off

| Gate | Result | Date | Sign-off |
|------|--------|------|----------|
| Infrastructure | ⬜ | | |
| Environment | ⬜ | | |
| Security | ⬜ | | |
| Database | ⬜ | | |
| Build | ⬜ | | |
| Deployment | ⬜ | | |
| Verification | ⬜ | | |

**Final Authorization:** _________________________
**Date:** _________________________
