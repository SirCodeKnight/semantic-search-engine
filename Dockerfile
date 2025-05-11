# Use multi-stage builds for optimized images

# Backend build stage
FROM python:3.11-slim as backend-build

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Frontend build stage
FROM node:16-alpine as frontend-build

WORKDIR /app

# Install frontend dependencies
COPY frontend/package*.json ./
RUN npm ci

# Build frontend
COPY frontend/ ./
RUN npm run build

# Final stage
FROM python:3.11-slim

WORKDIR /app

# Copy Python dependencies from backend build
COPY --from=backend-build /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=backend-build /usr/local/bin /usr/local/bin

# Copy built frontend
COPY --from=frontend-build /app/build /app/frontend/build

# Copy backend code
COPY backend /app/backend

# Create data directory
RUN mkdir -p /app/backend/data/uploads

# Set environment variables
ENV PYTHONPATH=/app
ENV PORT=8000
ENV HOST=0.0.0.0
ENV STATIC_FILES_DIR=/app/frontend/build

# Expose port
EXPOSE 8000

# Create non-root user
RUN useradd -m appuser
RUN chown -R appuser:appuser /app
USER appuser

# Start command
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]