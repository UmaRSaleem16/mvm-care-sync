# ── Stage 1: dev (used by docker-compose.dev.yml) ──────────────────────────
FROM node:24-alpine AS dev
WORKDIR /app
COPY package*.json ./
RUN npm ci
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# ── Stage 2: build ──────────────────────────────────────────────────────────
FROM node:24-alpine AS builder
ARG VITE_API_URL=""
ARG VITE_APP_NAME=MVMCareSync
ARG VITE_APP_VERSION=0.1.0
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN VITE_API_URL=$VITE_API_URL \
    VITE_APP_NAME=$VITE_APP_NAME \
    VITE_APP_VERSION=$VITE_APP_VERSION \
    npm run build

# ── Stage 3: production (nginx) ─────────────────────────────────────────────
FROM nginx:1.27-alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
