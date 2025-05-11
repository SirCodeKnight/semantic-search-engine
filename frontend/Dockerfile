FROM node:16-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Set environment variables
ENV PORT=3000
ENV REACT_APP_API_URL=http://localhost:8000

# Expose port
EXPOSE 3000

# Start development server
CMD ["npm", "start"]