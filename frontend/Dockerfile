FROM node:24.4.0-bookworm-slim AS build
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
ARG VITE_MAPBOX_TOKEN=""
ENV VITE_API_BASE_URL=/api VITE_MAPBOX_TOKEN=$VITE_MAPBOX_TOKEN
RUN npm run build

FROM caddy:2.11.9-alpine
COPY --from=build /app/dist /srv
COPY infra/caddy/Caddyfile /etc/caddy/Caddyfile
EXPOSE 80 443
