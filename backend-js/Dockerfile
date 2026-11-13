FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
ENV DATABASE_MODE=d1
ENV PORT=8080
ENV TRUST_PROXY=1
ENV NODE_OPTIONS=--experimental-sqlite
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev
COPY migrations ./migrations
COPY src ./src
EXPOSE 8080
CMD ["node", "src/index.js"]
