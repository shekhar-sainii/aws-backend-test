# Use a lightweight Node.js Alpine base image
FROM node:20-alpine

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Set working directory
WORKDIR /app

# Copy package files first to leverage Docker layer caching
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy the rest of the application files
COPY . .

# Set container permissions to the non-root 'node' user for security
RUN chown -R node:node /app
USER node

# Expose the default API port
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
