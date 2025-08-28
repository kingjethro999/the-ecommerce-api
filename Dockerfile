# --- Build Stage ---
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm (faster than npm)
RUN npm install -g pnpm

# Copy lockfile + package.json first (better cache)
COPY package.json pnpm-lock.yaml* ./
COPY prisma ./prisma/

# Install all deps (including dev)
RUN pnpm install

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build TypeScript -> dist
RUN pnpm build


# --- Production Stage ---
FROM node:20-alpine AS runner

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy only necessary files
COPY package.json pnpm-lock.yaml* ./

# Install only production deps
RUN pnpm install --prod

# Copy built files + prisma client
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Expose port (Render overrides with $PORT anyway)
EXPOSE 8000

# Set env
ENV NODE_ENV=production

# Start app
CMD ["pnpm", "start"]