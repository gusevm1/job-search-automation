"""
Job matching API endpoints.

This module handles job scraping, matching, and recommendation.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.models.job import (
    Job,
    MatchResult,
    JobMatchRequest,
    JobMatchResponse,
)
import json

router = APIRouter()


@router.post("/match", response_model=JobMatchResponse)
async def match_jobs(request: JobMatchRequest) -> JobMatchResponse:
    """
    Match jobs against a user profile.

    This endpoint will use LangChain + Claude to:
    1. Analyze user profile
    2. Score each job against profile
    3. Identify strengths and gaps
    4. Provide recommendations

    Args:
        request: Match request with profile_id and optional job filters

    Returns:
        JobMatchResponse: List of matched jobs with scores

    Raises:
        HTTPException: If profile not found or matching fails
    """
    # TODO: Implement job matching with LangChain + Claude
    # For now, return mock data

    mock_match = MatchResult(
        job_id="job_mock_123",
        score=87.5,
        reasoning="Strong match based on ML expertise and ETH education. PyTorch skills align perfectly with requirements.",
        strengths=[
            "ETH Zurich MSc matches education requirements",
            "Expert-level PyTorch experience",
            "5+ years Python experience exceeds requirements"
        ],
        gaps=[
            "No AWS deployment experience mentioned",
            "Preferred: 2+ years in production ML systems"
        ],
        recommendation="Highly Recommended",
        skill_matches=[],
        education_match="Perfect match: ETH Zurich MSc in Computer Science",
        experience_match="Meets requirements: 5+ years of ML/AI experience"
    )

    return JobMatchResponse(
        matches=[mock_match],
        total_jobs=1,
        matched_jobs=1
    )


@router.get("/demo", response_model=List[Job])
async def get_demo_jobs(
    limit: int = Query(10, ge=1, le=100, description="Number of jobs to return")
) -> List[Job]:
    """
    Get demo job listings for testing.

    Args:
        limit: Maximum number of jobs to return

    Returns:
        List[Job]: Demo job listings
    """
    demo_jobs = [
        {
            "id": "job_demo_1",
            "title": "Machine Learning Engineer",
            "company": "Tech Innovations AG",
            "location": "Zurich, Switzerland",
            "description": "We are looking for an experienced ML Engineer to join our AI team. You will work on cutting-edge NLP and computer vision projects.",
            "requirements": [
                "MSc or PhD in Computer Science or related field",
                "5+ years of ML/AI experience",
                "Expert Python and PyTorch skills",
                "Experience with Transformers and NLP"
            ],
            "salary_range": "120k-160k CHF",
            "url": "https://jobs.example.com/ml-engineer-1",
            "posted_date": "2025-11-20",
            "source": "SwissDevJobs",
            "employment_type": "full-time",
            "remote_type": "hybrid",
            "tags": ["ML", "AI", "Python", "PyTorch", "NLP"]
        },
        {
            "id": "job_demo_2",
            "title": "AI Research Scientist",
            "company": "Research Labs Zurich",
            "location": "Zurich, Switzerland",
            "description": "Join our research team working on foundational AI models. PhD preferred.",
            "requirements": [
                "PhD in Computer Science, AI, or related field",
                "Strong publication record",
                "Expertise in deep learning and transformers",
                "Python, PyTorch, TensorFlow"
            ],
            "salary_range": "140k-180k CHF",
            "url": "https://jobs.example.com/ai-researcher-2",
            "posted_date": "2025-11-19",
            "source": "SwissDevJobs",
            "employment_type": "full-time",
            "remote_type": "on-site",
            "tags": ["AI", "Research", "PhD", "Deep Learning"]
        },
        {
            "id": "job_demo_3",
            "title": "Senior Python Developer",
            "company": "FinTech Solutions",
            "location": "Geneva, Switzerland",
            "description": "Build scalable backend systems for financial applications.",
            "requirements": [
                "5+ years Python development",
                "Experience with FastAPI/Django",
                "SQL and NoSQL databases",
                "Cloud deployment (AWS/Azure)"
            ],
            "salary_range": "100k-130k CHF",
            "url": "https://jobs.example.com/python-dev-3",
            "posted_date": "2025-11-18",
            "source": "Jobs.ch",
            "employment_type": "full-time",
            "remote_type": "remote",
            "tags": ["Python", "Backend", "FinTech", "FastAPI"]
        }
    ]

    return [Job(**job_data) for job_data in demo_jobs[:limit]]


@router.get("/{job_id}", response_model=Job)
async def get_job(job_id: str) -> Job:
    """
    Get a job by ID.

    Args:
        job_id: Job ID

    Returns:
        Job: Job details

    Raises:
        HTTPException: If job not found
    """
    # TODO: Implement database lookup
    raise HTTPException(status_code=404, detail="Job not found")


@router.get("/", response_model=List[Job])
async def list_jobs(
    skip: int = Query(0, ge=0, description="Number of jobs to skip"),
    limit: int = Query(20, ge=1, le=100, description="Number of jobs to return"),
    location: Optional[str] = Query(None, description="Filter by location"),
    remote_type: Optional[str] = Query(None, description="Filter by remote type")
) -> List[Job]:
    """
    List all jobs with pagination and filters.

    Args:
        skip: Pagination offset
        limit: Maximum jobs to return
        location: Filter by location
        remote_type: Filter by remote type

    Returns:
        List[Job]: Job listings
    """
    # TODO: Implement database query with filters
    return []
