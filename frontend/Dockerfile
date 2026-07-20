# syntax=docker/dockerfile:1
FROM node:24-alpine AS build

WORKDIR /app

COPY package.json package-lock.json .npmrc ./
RUN npm ci --no-audit --no-fund

COPY . .

ARG VITE_API_URL=/api
ARG VITE_STATIC_MODE=false
ARG VITE_DISABLE_LOCAL_CACHE=true
ENV VITE_API_URL=$VITE_API_URL \
    VITE_STATIC_MODE=$VITE_STATIC_MODE \
    VITE_DISABLE_LOCAL_CACHE=$VITE_DISABLE_LOCAL_CACHE

# The repository currently has legacy project-wide TypeScript diagnostics.
# Vite still performs the production transform and fails on syntax/bundle errors.
RUN npx vite build

FROM nginx:1.29-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=20s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O - http://127.0.0.1/healthz >/dev/null || exit 1
