# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# deps — full install (incl. devDependencies) used only to build
# ---------------------------------------------------------------------------
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---------------------------------------------------------------------------
# build — emits dist/client (browser bundle) and dist/server (SSR handler)
# ---------------------------------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Vite inlines VITE_* into the browser bundle, so the public site URL must be present
# at build time. Database credentials and SESSION_SECRET remain runtime-only.
ARG VITE_SITE_URL
ENV VITE_SITE_URL=$VITE_SITE_URL

RUN npm run build

# ---------------------------------------------------------------------------
# prod-deps — runtime dependencies only; the SSR bundle imports react,
# @tanstack/*, mysql2, bcryptjs, and srvx as externals
# ---------------------------------------------------------------------------
FROM node:22-alpine AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ---------------------------------------------------------------------------
# runtime
# ---------------------------------------------------------------------------
FROM node:22-alpine AS runtime
WORKDIR /app

RUN apk add --no-cache tini

ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json server.mjs ./

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# tini reaps zombies and forwards SIGTERM so the container stops promptly.
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.mjs"]
