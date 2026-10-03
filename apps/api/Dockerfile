FROM node:18-alpine AS builder

WORKDIR /app

# Copy root package.json and lockfile if using workspaces (assume npm workspace setup)
# Because of monorepo, it's safer to copy everything for the build
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

# Install all dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma Client
WORKDIR /app/apps/api
RUN npx prisma generate

# Build API
RUN npm run build

# Production image
FROM node:18-alpine AS runner

WORKDIR /app

# Set to production
ENV NODE_ENV=production

# Copy package files
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/

# Install only production dependencies
RUN npm ci --omit=dev

# Copy built artifacts and prisma schema
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
# Also need the generated prisma client which is usually in node_modules/.prisma or inside the module
# Better approach for production in workspaces is to just copy the whole node_modules from builder, 
# or ensure prisma generate is run again. We'll generate it here.
WORKDIR /app/apps/api
RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "run", "start"]
