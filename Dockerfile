# syntax = docker/dockerfile:1

ARG NODE_VERSION=20
FROM node:${NODE_VERSION}-slim AS base
LABEL fly_launch_runtime="Node.js"
WORKDIR /app

# ── Build stage ──────────────────────────────────────────────────────────────
FROM base AS build

# Native build tools (needed for bcrypt)
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential python3 && \
    rm -rf /var/lib/apt/lists/*

# Install client deps (isolated — no parent node_modules to confuse npm)
COPY client/package*.json ./client/
RUN cd client && npm ci

# Install express deps (production only)
COPY express/package*.json ./express/
RUN cd express && npm ci --omit=dev

# Copy source and build React
COPY . .
RUN cd client && npm run build

# ── Final image ───────────────────────────────────────────────────────────────
FROM base

ENV NODE_ENV="production"

# Copy only what the server needs at runtime
COPY --from=build /app/client/build ./client/build
COPY --from=build /app/express ./express

EXPOSE 3001
CMD ["node", "express/server.js"]
