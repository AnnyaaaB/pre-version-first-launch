# Use official Node.js image
FROM node:18 AS build

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build React app
RUN npm run build

# Use a lightweight web server
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html

# Expose port
EXPOSE 7860

# Run Nginx
CMD ["nginx", "-g", "daemon off;"]
