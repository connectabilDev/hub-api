# Base image
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat curl
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn config set network-timeout 300000

# Development stage
FROM base AS development
RUN yarn install --frozen-lockfile
COPY . .
EXPOSE 3000 9229
CMD ["yarn", "start:dev"]

# Builder stage
FROM base AS builder
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build

# Production dependencies
FROM base AS production-deps
RUN yarn install --frozen-lockfile --production
RUN yarn cache clean

# Production stage
FROM node:20-alpine AS production
RUN apk add --no-cache libc6-compat curl
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001
WORKDIR /app
COPY --from=production-deps --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --chown=nestjs:nodejs package.json ./
USER nestjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1
CMD ["node", "dist/main"]