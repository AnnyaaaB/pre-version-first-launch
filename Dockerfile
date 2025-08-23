# Use Node.js base image
FROM node:18

# Set working directory
WORKDIR /app

# Copy server package files and install deps
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm install --production

# Copy the rest of the code
COPY . /app

# Expose the port
EXPOSE 7860

# Start the server
CMD ["node", "index.js"]
