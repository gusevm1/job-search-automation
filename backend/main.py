"""
FastAPI main application entry point for JobSearch AI API.

This module sets up the FastAPI app with CORS middleware, routers,
and basic configuration for the job search automation backend.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import cv, jobs

# Initialize FastAPI app
app = FastAPI(
    title="JobSearch AI API",
    description="AI-powered job search automation backend using LangChain and Claude",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers with /api prefix
app.include_router(cv.router, prefix="/api/cv", tags=["CV Processing"])
app.include_router(jobs.router, prefix="/api/jobs", tags=["Job Matching"])


@app.get("/")
async def root():
    """
    Root endpoint returning API information.

    Returns:
        dict: API metadata with name, version, and documentation links
    """
    return {
        "name": "JobSearch AI API",
        "version": "1.0.0",
        "description": "AI-powered job search automation backend",
        "docs": "/docs",
        "redoc": "/redoc",
    }


@app.get("/health")
async def health_check():
    """
    Health check endpoint for monitoring.

    Returns:
        dict: Health status
    """
    return {"status": "healthy"}
