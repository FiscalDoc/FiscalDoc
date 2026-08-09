FROM node:22-alpine AS build
WORKDIR /app

# node:22-alpine não vem com git — precisa dele pra "npm run build" calcular a versão
# automática (prebuild roda scripts/generate-version.js, que chama "git rev-list --count HEAD").
RUN apk add --no-cache git

COPY src/Frontend/package*.json ./
RUN npm ci --legacy-peer-deps

COPY src/Frontend/ .
# .git da raiz do repo, copiado pra dentro de /app — generate-version.js sobe diretórios a
# partir de si mesmo até achar um ".git", então funciona tanto aqui (um nível acima de /app)
# quanto localmente (três níveis acima de src/Frontend/scripts).
COPY .git ./.git
RUN npm run build -- --configuration production

FROM nginx:alpine AS runtime
COPY --from=build /app/dist/web/browser /usr/share/nginx/html
COPY docker/frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
