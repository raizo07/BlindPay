# Build stage
FROM node:18-slim AS builder

# Install build tools for better-sqlite3
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies including native ones
RUN npm install

# Final stage
FROM node:18-slim

WORKDIR /app

# Copy only the necessary files from builder
COPY --from=builder /app/node_modules ./node_modules
COPY . .

# Expose port and start
EXPOSE 3000

CMD ["npm", "start"]
