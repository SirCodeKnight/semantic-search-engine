from fastapi import FastAPI, Depends, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
from dotenv import load_dotenv
import time
from typing import List, Optional, Dict, Any

# Internal imports
from app.routers import search, documents, embeddings, admin
from app.dependencies import verify_api_key, get_vector_store, get_database
from app.models.settings import Settings
from app.services.init_service import initialize_system

# Load environment variables
load_dotenv()

# Create app instance
app = FastAPI(
    title="Semantic Search Engine API",
    description="API for AI-powered semantic search engine with document processing capabilities",
    version="1.0.0",
)

# Load settings
settings = Settings()

# Configure CORS
origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware for request logging and API key verification
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

@app.middleware("http")
async def api_key_middleware(request: Request, call_next):
    # Skip API key verification for docs and health check
    if request.url.path in ["/docs", "/redoc", "/openapi.json", "/health"]:
        return await call_next(request)
    
    # Get API key from headers
    api_key = request.headers.get("X-API-Key")
    if not api_key:
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"detail": "API key required"}
        )
    
    # Verify API key
    if api_key != os.getenv("API_KEY"):
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"detail": "Invalid API key"}
        )
    
    return await call_next(request)

# Include routers
app.include_router(search.router, tags=["Search"])
app.include_router(documents.router, tags=["Documents"])
app.include_router(embeddings.router, tags=["Embeddings"])
app.include_router(admin.router, tags=["Admin"])

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "version": app.version}

@app.on_event("startup")
async def startup_event():
    """Initialize system on startup"""
    try:
        await initialize_system()
    except Exception as e:
        print(f"Error initializing system: {e}")
        raise

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.host, port=settings.port, reload=settings.debug)