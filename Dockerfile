# -------------------------------------------------------------
# Stage 1: Build
# -------------------------------------------------------------
FROM node:24-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma/
COPY prisma7.config.ts ./
RUN npx prisma generate

COPY tsconfig*.json build.mjs ./
COPY src ./src/

RUN npm run build

# -------------------------------------------------------------
# Stage 2: Production Runtime
# -------------------------------------------------------------
FROM node:24-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat dumb-init

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma7.config.ts ./
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig*.json ./
COPY docker/entrypoint.sh /app/docker/entrypoint.sh

# Remove CRLF if generated on Windows and grant execute permissions
RUN sed -i 's/\r$//' /app/docker/entrypoint.sh && chmod +x /app/docker/entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["dumb-init", "--", "/app/docker/entrypoint.sh"]
CMD ["node", "dist/main.js"]
