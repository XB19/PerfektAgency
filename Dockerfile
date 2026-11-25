# ---------- 1. Build du site React ----------
FROM node:22-alpine AS client
WORKDIR /app/client
COPY client/package.json client/package-lock.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# ---------- 2. Image de production (API + site) ----------
FROM node:22-alpine
ENV NODE_ENV=production \
    PORT=4000 \
    PG_DUMP=pg_dump \
    BACKUP_DIR=/app/server/backups
# pg_dump pour les sauvegardes automatiques
RUN apk add --no-cache postgresql17-client tini
WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev
COPY server/ ./
COPY --from=client /app/client/dist /app/client/dist
RUN mkdir -p uploads backups && chown -R node:node /app/server
USER node
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4000/api/health || exit 1
# Crée/met à jour la base (schéma + données initiales si vide), puis démarre le serveur
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["sh", "-c", "node src/db/setup.js && node src/index.js"]
