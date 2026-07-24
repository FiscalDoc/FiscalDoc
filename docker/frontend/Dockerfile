FROM node:22-alpine AS build
WORKDIR /app

COPY src/Frontend/package*.json ./
RUN npm ci --legacy-peer-deps

COPY src/Frontend/ .
RUN npm run build -- --configuration production

FROM nginx:alpine AS runtime
COPY --from=build /app/dist/web/browser /usr/share/nginx/html
COPY docker/frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
