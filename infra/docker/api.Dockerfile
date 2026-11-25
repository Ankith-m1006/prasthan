FROM node:22-slim AS deps
WORKDIR /app/services/api
COPY services/api/package*.json ./
RUN npm ci --omit=dev

FROM node:22-slim
WORKDIR /app
COPY . .
COPY --from=deps /app/services/api/node_modules ./services/api/node_modules
ENV NODE_ENV=production SEED_DIR=/app/seed PORT=8787
USER node
EXPOSE 8787
CMD ["npm", "--prefix", "services/api", "start"]
