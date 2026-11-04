FROM node:24.22.2-bookworm-slim@sha256:c86ecead9e55a5210ac1727de38a4ca840bf03dcaf34dc9749addbf383b1920c AS build
WORKDIR /app
ENV TMPDIR=/app/.scratch-runtime/tmp
RUN mkdir -p /app/.scratch-runtime/tmp
COPY frontend/package.json frontend/package-lock.json ./frontend/
COPY vendor/turbine-explorer/package.json vendor/turbine-explorer/package-lock.json ./vendor/turbine-explorer/
RUN npm ci --prefix frontend && npm ci --prefix vendor/turbine-explorer
COPY frontend ./frontend
COPY vendor/turbine-explorer ./vendor/turbine-explorer
COPY shared ./shared
COPY evidence/FE-INTEGRATE/bridge-fixture.json ./evidence/FE-INTEGRATE/bridge-fixture.json
RUN npm run build --prefix frontend

FROM nginx:1.28.0-alpine@sha256:30f1c0d78e0ad60901648be663a710bdadf19e4c10ac6782c235200619158284
ENV API_UPSTREAM=http://api:8000 \
    NGINX_ENVSUBST_FILTER=^API_UPSTREAM$
COPY frontend/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/frontend/dist /usr/share/nginx/html
RUN chmod -R a+rX /usr/share/nginx/html
EXPOSE 8080
