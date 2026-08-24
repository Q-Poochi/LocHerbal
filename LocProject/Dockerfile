# ============================================================
# LocHerbal Backend — Dockerfile (Railway)
# Node 22 LTS, NestJS + Prisma
# ============================================================

# ---------- Stage 1: dependencies + build ----------
FROM node:22-alpine AS builder

WORKDIR /app

# Cài openssl cho prisma generate (native) nếu cần
RUN apk add --no-cache openssl

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
COPY schema.prisma ./
COPY migrations ./migrations
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src

# Generate Prisma client trước build (cần DATABASE_URL để generate — dùng giá trị giả
# vì client generate không cần kết nối thật).
ENV DATABASE_URL="postgresql://ci:ci@localhost:5432/ci"
RUN npx prisma generate

ARG BUILD_DATE=2026-08-24T06:00:00Z
RUN npm run build

# ---------- Stage 2: production ----------
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache openssl

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/migrations ./migrations
COPY --from=builder /app/schema.prisma ./schema.prisma
COPY --from=builder /app/package.json ./

# Upload persistence — Railway volume mount tại /app/uploads (khai báo qua requiredMountPath trong railway.json;
# volume "backend-volume" đã attach sẵn). Thư mục con /products được tạo tự động khi app khởi động (xem src/main.ts).
RUN mkdir -p /app/uploads/products

EXPOSE 4000

# Migrations chạy ở start command: npx prisma migrate deploy && node dist/main
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
