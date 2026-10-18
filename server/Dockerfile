# ---- Stage 1: install production dependencies only ----
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
# --legacy-peer-deps: multer-storage-cloudinary wants cloudinary v1, the project uses v2
RUN npm ci --omit=dev --legacy-peer-deps && npm cache clean --force

# ---- Stage 2: small runtime image ----
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src

# Run as the unprivileged "node" user that ships with the image
USER node
EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://localhost:5000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "src/index.js"]