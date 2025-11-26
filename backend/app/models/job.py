"""
Pydantic models for job listings and matching results.

This module defines the data structures for storing job postings
and AI-generated matching analysis.
"""

from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field, HttpUrl, ConfigDict


class Job(BaseModel):
    """
    Job listing model.

    Attributes:
        id: Unique job ID
        title: Job title
        company: Company name
        location: Job location
        description: Full job description
        requirements: List of job requirements
        salary_range: Salary range (e.g., "100k-150k CHF")
        url: Job posting URL
        posted_date: Date job was posted (ISO format)
        source: Job board source (e.g., "SwissDevJobs")
        employment_type: Employment type (e.g., "full-time", "contract")
        remote_type: Remote work type (e.g., "remote", "hybrid", "on-site")
        tags: List of tags/keywords
    """

    id: str = Field(..., description="Unique job ID")
    title: str = Field(..., description="Job title")
    company: str = Field(..., description="Company name")
    location: str = Field(..., description="Job location")
    description: str = Field(..., description="Full job description")
    requirements: List[str] = Field(default_factory=list, description="Job requirements")
    salary_range: Optional[str] = Field(None, description="Salary range")
    url: str = Field(..., description="Job posting URL")
    posted_date: str = Field(..., description="Date posted (ISO format)")
    source: str = Field(..., description="Job board source")
    employment_type: Optional[str] = Field("full-time", description="Employment type")
    remote_type: Optional[str] = Field(None, description="Remote work type")
    tags: List[str] = Field(default_factory=list, description="Tags/keywords")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id": "job_1234567890",
                "title": "Machine Learning Engineer",
                "company": "Tech Innovations AG",
                "location": "Zurich, Switzerland",
                "description": "We are looking for an experienced ML Engineer to join our AI team...",
                "requirements": [
                    "5+ years of ML/AI experience",
                    "Strong Python and PyTorch skills",
                    "PhD or MSc in Computer Science",
                ],
                "salary_range": "120k-160k CHF",
                "url": "https://jobs.example.com/ml-engineer-123",
                "posted_date": "2025-11-20",
                "source": "SwissDevJobs",
                "employment_type": "full-time",
                "remote_type": "hybrid",
                "tags": ["ML", "AI", "Python", "PyTorch"],
            }
        }
    )


class SkillMatch(BaseModel):
    """
    Individual skill match analysis.

    Attributes:
        skill: Skill name
        matched: Whether the skill matches a user skill
        proficiency_required: Required proficiency level
        user_proficiency: User's proficiency level
        gap: Gap description (if any)
    """

    skill: str = Field(..., description="Skill name")
    matched: bool = Field(..., description="Whether skill matches")
    proficiency_required: Optional[str] = Field(None, description="Required proficiency")
    user_proficiency: Optional[str] = Field(None, description="User's proficiency")
    gap: Optional[str] = Field(None, description="Gap description")


class MatchResult(BaseModel):
    """
    AI-generated job matching result.

    Attributes:
        job_id: ID of the matched job
        score: Overall match score (0-100)
        reasoning: AI-generated reasoning for the score
        strengths: List of matching strengths
        gaps: List of skill/experience gaps
        recommendation: AI recommendation (e.g., "Highly Recommended", "Good Fit")
        skill_matches: Detailed skill-by-skill analysis
        education_match: Education match analysis
        experience_match: Experience level match analysis
    """

    job_id: str = Field(..., description="Job ID")
    score: float = Field(..., ge=0, le=100, description="Match score (0-100)")
    reasoning: str = Field(..., description="AI reasoning for score")
    strengths: List[str] = Field(default_factory=list, description="Matching strengths")
    gaps: List[str] = Field(default_factory=list, description="Skill/experience gaps")
    recommendation: str = Field(..., description="AI recommendation")
    skill_matches: List[SkillMatch] = Field(
        default_factory=list, description="Detailed skill matches"
    )
    education_match: Optional[str] = Field(None, description="Education match analysis")
    experience_match: Optional[str] = Field(None, description="Experience match analysis")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "job_id": "job_1234567890",
                "score": 87.5,
                "reasoning": "Strong match based on ML expertise and ETH education. PyTorch skills align perfectly with requirements.",
                "strengths": [
                    "ETH Zurich MSc matches education requirements",
                    "Expert-level PyTorch experience",
                    "5+ years Python experience exceeds requirements",
                ],
                "gaps": [
                    "No AWS deployment experience mentioned",
                    "Preferred: 2+ years in production ML systems",
                ],
                "recommendation": "Highly Recommended",
                "skill_matches": [
                    {
                        "skill": "Python",
                        "matched": True,
                        "proficiency_required": "advanced",
                        "user_proficiency": "expert",
                        "gap": None,
                    },
                    {
                        "skill": "AWS",
                        "matched": False,
                        "proficiency_required": "intermediate",
                        "user_proficiency": None,
                        "gap": "No AWS experience in profile",
                    },
                ],
                "education_match": "Perfect match: ETH Zurich MSc in Computer Science",
                "experience_match": "Meets requirements: 5+ years of ML/AI experience",
            }
        }
    )


class JobMatchRequest(BaseModel):
    """
    Request model for job matching endpoint.

    Attributes:
        profile_id: User profile ID
        job_ids: List of job IDs to match against (optional, all jobs if empty)
        min_score: Minimum match score filter (optional)
    """

    profile_id: str = Field(..., description="User profile ID")
    job_ids: Optional[List[str]] = Field(None, description="Job IDs to match")
    min_score: Optional[float] = Field(0, ge=0, le=100, description="Minimum score filter")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "profile_id": "user_1234567890",
                "job_ids": ["job_001", "job_002", "job_003"],
                "min_score": 70.0,
            }
        }
    )


class JobMatchResponse(BaseModel):
    """
    Response model for job matching endpoint.

    Attributes:
        matches: List of match results sorted by score
        total_jobs: Total number of jobs analyzed
        matched_jobs: Number of jobs matching min_score threshold
    """

    matches: List[MatchResult] = Field(..., description="Match results")
    total_jobs: int = Field(..., description="Total jobs analyzed")
    matched_jobs: int = Field(..., description="Jobs matching threshold")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "matches": [],
                "total_jobs": 10,
                "matched_jobs": 7,
            }
        }
    )
