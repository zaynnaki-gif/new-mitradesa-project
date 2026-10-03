FROM node:18-alpine AS builder

WORKDIR /app

# Copy package info
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build Web app
WORKDIR /app/apps/web
RUN npm run build

# Production image
FROM nginx:alpine

# Copy built static files to Nginx public folder
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Add custom Nginx config for React Router (SPA fallback)
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
