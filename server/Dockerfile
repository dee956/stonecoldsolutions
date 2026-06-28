# Build the invoice API without needing a committed lockfile.
FROM node:20-slim
WORKDIR /app

# Install production dependencies (no lockfile required).
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund

# Copy the application code.
COPY . .

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

CMD ["node", "index.js"]
