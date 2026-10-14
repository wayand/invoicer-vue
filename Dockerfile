# syntax=docker/dockerfile:1

# ---- Build the static assets ----
FROM node:22-slim AS build

WORKDIR /app

# Manifests first, so the install layer is cached until they change
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- Serve them with nginx, as a non-root user (uid 101, port 8080) ----
FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080
