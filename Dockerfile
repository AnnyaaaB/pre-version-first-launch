# Step 1: Build frontend
FROM node:18 AS frontend
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ .
RUN npm run build

# Step 2: Setup backend
FROM node:18
WORKDIR /app/server

# Copy backend dependencies and install
COPY server/package*.json ./
RUN npm install --production

# Copy backend code
COPY server/ .

# Copy frontend build into backend
COPY --from=frontend /app/client/build ./client/build

# Expose port for Hugging Face
EXPOSE 7860

# Run backend (entry = index.js)
CMD ["node", "index.js"]
