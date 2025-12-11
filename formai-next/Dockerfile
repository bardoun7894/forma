# Use Node 20 Alpine as base
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
ENV NEXT_TELEMETRY_DISABLED=1

# Firebase public config (these are client-side public keys, safe to include)
ENV NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDXbXlamk0bHz1muBhyYtl2aTZ38J3cjKk
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=my-app-3c17b.firebaseapp.com
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID=my-app-3c17b
ENV NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=my-app-3c17b.firebasestorage.app
ENV NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1052595244864
ENV NEXT_PUBLIC_FIREBASE_APP_ID=1:1052595244864:web:fba53c6a01a250b59bf4a5
ENV NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-RDB7N607LY
ENV NEXT_PUBLIC_OPENAI_API_KEY=REMOVED
ENV NEXT_PUBLIC_KIE_API_KEY=699c9fad8f427759045e4c61139f1338

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/i18n ./i18n

# Set correct permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]