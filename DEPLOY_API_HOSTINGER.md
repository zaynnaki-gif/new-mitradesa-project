# MITRADESA API - Deployment to Hostinger

## Prerequisites
- Hostinger Business plan (Node.js support)
- Subdomain: `api.serunimumbul.com`
- Domain: `serunimumbul.com` configured in Hostinger

---

## Step 1: Create Subdomain for API

In Hostinger hPanel:

1. Go to **Website** → Select your hosting
2. Click **Subdomains**
3. Create: `api` → Point to `serunimumbul.com`
4. Wait for DNS propagation (10-60 minutes)

---

## Step 2: Prepare API Files

The API is already built. Files are in `apps/api/dist/`

### Create deployment package:

```bash
cd /d/mitradesa

# Create a zip of the API (excluding node_modules, we'll reinstall on server)
cd apps/api

# Copy .env.production to .env for deployment
cp .env.production .env

# Create deployment package
zip -r api-deploy.zip dist prisma package.json package-lock.json tsconfig.json tsconfig.build.json .env -x "node_modules/*" -x "*.log" -x "test/*"
```

---

## Step 3: Deploy to Hostinger

### Option A: Node.js App Deployment (Recommended)

In Hostinger hPanel:

1. Go to **Website** → Select hosting → **Node.js** tab
2. Click **Deploy Node.js Application**
3. Fill in:
   - **Application root**: `api` (or your subdomain folder)
   - **Application startup file**: `dist/index.js`
   - **Package manager**: npm
   - **Build command**: `npm install`
   - **Run command**: `npm start`

4. Upload `api-deploy.zip` or connect via SSH/FTP

5. **Set Environment Variables** in Hostinger:
   ```
   NODE_ENV=production
   DATABASE_URL=postgresql://postgres.psxppjmldyhwrqqyqegg:Serunimumbul-88@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true
   JWT_SECRET=<GENERATE_SECURE_SECRET>
   API_URL=https://api.serunimumbul.com
   WEB_URL=https://serunimumbul.com
   ALLOWED_ORIGINS=https://serunimumbul.com,https://www.serunimumbul.com
   DESA_ID=1
   DESA_KODE=5101012001
   DESA_NAMA=Desa Seruni Mumbul
   LOG_LEVEL=warn
   ```

### Option B: File Manager + SSH

1. **Create folder** `api` in public_html via File Manager
2. **Upload** contents of `apps/api/dist/` to this folder
3. **Upload** `package.json` and `package-lock.json`
4. **Create** `.env` file with environment variables
5. **Run** via SSH:
   ```bash
   cd api
   npm install
   npm start &
   ```

---

## Step 4: Generate JWT Secret

```bash
# Generate secure JWT secret
openssl rand -base64 64
```

Copy the output to `JWT_SECRET` in environment variables.

---

## Step 5: Verify API Deployment

Test the API:

```bash
# Check if API is running
curl https://api.serunimumbul.com/api/health

# Check database connection
curl https://api.serunimumbul.com/api/health/database
```

Expected response:
```json
{
  "success": true,
  "message": "OK"
}
```

---

## Step 6: Update & Redeploy Frontend

1. **Update** `apps/web/.env.production`:
   ```
   VITE_API_URL=https://api.serunimumbul.com
   VITE_WEB_URL=https://serunimumbul.com
   ```

2. **Rebuild frontend**:
   ```bash
   cd apps/web
   npm run build:prod
   ```

3. **Upload** `apps/web/dist/` to hosting (root or subdomain folder)

---

## Step 7: Final Verification

Open browser:
```
https://serunimumbul.com
```

Check Network tab (F12):
- ✅ No `localhost:3001` errors
- ✅ API calls to `api.serunimumbul.com`
- ✅ Data loads correctly

---

## Troubleshooting

### API Returns 500 Error
- Check logs in Hostinger Node.js dashboard
- Verify DATABASE_URL is correct
- Verify JWT_SECRET is set

### CORS Error
- Verify ALLOWED_ORIGINS includes your domain
- Format: `https://domain.com,https://www.domain.com`

### Connection Refused
- API not started - restart from Node.js dashboard
- Check PORT environment variable (should be 3001)

---

## Quick Reference

| Item | Value |
|------|-------|
| API URL | https://api.serunimumbul.com |
| Frontend URL | https://serunimumbul.com |
| Database | Supabase PostgreSQL |
| Port | 3001 |

---

## Post-Deployment Checklist

- [ ] API subdomain created
- [ ] API deployed and running
- [ ] `/api/health` returns 200
- [ ] Database connected
- [ ] CORS configured
- [ ] Frontend rebuilt with correct API URL
- [ ] Frontend deployed
- [ ] Homepage loads with data
- [ ] No console errors
