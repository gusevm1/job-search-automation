"""
Pydantic models for JobSearch AI API.

This module exports all data models used throughout the application.
"""

from .profile import (
    # Main models
    Profile,
    PersonalInfo,
    Location,
    WorkExperience,
    Education,
    Skills,
    TechnicalSkill,
    SoftSkill,
    LanguageSkill,
    Certification,
    Project,
    Achievement,

    # Enums
    DegreeType,
    SkillCategory,
    SkillProficiency,
    EmploymentType,
    RemoteType,
    CompanySize,
    LanguageProficiency,
)

from .job import (
    Job,
    MatchResult,
    SkillMatch,
    JobMatchRequest,
    JobMatchResponse,
)

__all__ = [
    # Profile models
    "Profile",
    "PersonalInfo",
    "Location",
    "WorkExperience",
    "Education",
    "Skills",
    "TechnicalSkill",
    "SoftSkill",
    "LanguageSkill",
    "Certification",
    "Project",
    "Achievement",

    # Enums
    "DegreeType",
    "SkillCategory",
    "SkillProficiency",
    "EmploymentType",
    "RemoteType",
    "CompanySize",
    "LanguageProficiency",

    # Job models
    "Job",
    "MatchResult",
    "SkillMatch",
    "JobMatchRequest",
    "JobMatchResponse",
]
