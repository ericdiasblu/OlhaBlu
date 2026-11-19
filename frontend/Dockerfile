FROM node:24.4.0-bookworm-slim AS build
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json frontend/.npmrc ./
COPY frontend/scripts/check-npm-sources.mjs ./scripts/
RUN node scripts/check-npm-sources.mjs \
    && npm ci --registry=https://registry.npmjs.org/ --no-audit --no-fund
COPY frontend/ ./
ARG VITE_MAPBOX_TOKEN=""
ENV VITE_API_BASE_URL=/api VITE_MAPBOX_TOKEN=$VITE_MAPBOX_TOKEN
RUN npm run build

FROM caddy:2.11.9-alpine AS runtime
COPY --from=build /app/dist /srv
COPY infra/caddy/Caddyfile /etc/caddy/Caddyfile
EXPOSE 80 443
