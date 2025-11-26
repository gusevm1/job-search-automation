"""
Pydantic models for user profile data.

These models mirror the TypeScript schemas in src/types/user-profile.ts
and are used for CV extraction and profile management.
"""

from datetime import datetime
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field, EmailStr, HttpUrl, field_validator


# ============================================
# Enums
# ============================================

class DegreeType(str, Enum):
    HIGH_SCHOOL = "high-school"
    ASSOCIATE = "associate"
    BACHELOR = "bachelor"
    MASTER = "master"
    DOCTORATE = "doctorate"
    PROFESSIONAL = "professional"
    CERTIFICATE = "certificate"
    BOOTCAMP = "bootcamp"


class SkillCategory(str, Enum):
    LANGUAGE = "language"
    FRAMEWORK = "framework"
    DATABASE = "database"
    CLOUD = "cloud"
    DEVOPS = "devops"
    TOOL = "tool"
    OTHER = "other"


class SkillProficiency(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"


class EmploymentType(str, Enum):
    FULL_TIME = "full-time"
    PART_TIME = "part-time"
    CONTRACT = "contract"
    FREELANCE = "freelance"
    INTERNSHIP = "internship"


class RemoteType(str, Enum):
    REMOTE = "remote"
    HYBRID = "hybrid"
    ON_SITE = "on-site"


class CompanySize(str, Enum):
    STARTUP = "startup"
    SMALL = "small"
    MEDIUM = "medium"
    LARGE = "large"
    ENTERPRISE = "enterprise"


class LanguageProficiency(str, Enum):
    ELEMENTARY = "elementary"
    LIMITED_WORKING = "limited-working"
    PROFESSIONAL_WORKING = "professional-working"
    FULL_PROFESSIONAL = "full-professional"
    NATIVE = "native"


# ============================================
# Location
# ============================================

class Location(BaseModel):
    """Location information."""
    city: Optional[str] = None
    state: Optional[str] = None
    country: str
    postal_code: Optional[str] = Field(None, alias="postalCode")
    willing_to_relocate: bool = Field(False, alias="willingToRelocate")
    relocation_preferences: Optional[List[str]] = Field(None, alias="relocationPreferences")

    class Config:
        populate_by_name = True


# ============================================
# Personal Information
# ============================================

class PersonalInfo(BaseModel):
    """Personal information extracted from CV."""
    first_name: str = Field(..., alias="firstName", min_length=1)
    last_name: str = Field(..., alias="lastName", min_length=1)
    email: EmailStr
    phone: Optional[str] = None
    location: Location
    linkedin: Optional[str] = Field(None, alias="linkedIn")
    github: Optional[str] = None
    portfolio: Optional[str] = None
    summary: Optional[str] = None

    class Config:
        populate_by_name = True


# ============================================
# Work Experience
# ============================================

class Achievement(BaseModel):
    """Individual achievement with optional metric."""
    description: str
    metric: Optional[str] = None


class WorkExperience(BaseModel):
    """Work experience entry."""
    id: str
    title: str
    company: str
    company_size: Optional[CompanySize] = Field(None, alias="companySize")
    industry: Optional[str] = None
    location: Optional[str] = None
    remote: Optional[RemoteType] = None
    start_date: str = Field(..., alias="startDate")  # ISO date string
    end_date: Optional[str] = Field(None, alias="endDate")  # null = current
    is_current: bool = Field(False, alias="isCurrent")
    responsibilities: List[str] = Field(default_factory=list)
    achievements: List[Achievement] = Field(default_factory=list)
    skills_used: List[str] = Field(default_factory=list, alias="skillsUsed")
    employment_type: EmploymentType = Field(EmploymentType.FULL_TIME, alias="employmentType")

    class Config:
        populate_by_name = True


# ============================================
# Education
# ============================================

class Education(BaseModel):
    """Education entry."""
    id: str
    institution: str
    degree: DegreeType
    field: str
    start_date: Optional[str] = Field(None, alias="startDate")
    graduation_date: Optional[str] = Field(None, alias="graduationDate")
    gpa: Optional[float] = Field(None, ge=0, le=10)  # Supports various grading systems
    honors: Optional[str] = None
    relevant_coursework: Optional[List[str]] = Field(None, alias="relevantCoursework")
    activities: Optional[List[str]] = None

    class Config:
        populate_by_name = True


# ============================================
# Skills
# ============================================

class TechnicalSkill(BaseModel):
    """Technical skill with proficiency level."""
    name: str
    category: SkillCategory
    proficiency: SkillProficiency
    years_of_experience: Optional[float] = Field(None, alias="yearsOfExperience")
    last_used: Optional[str] = Field(None, alias="lastUsed")

    class Config:
        populate_by_name = True


class SoftSkill(BaseModel):
    """Soft skill."""
    name: str
    proficiency: Optional[SkillProficiency] = None


class LanguageSkill(BaseModel):
    """Language proficiency."""
    language: str
    proficiency: LanguageProficiency
    certifications: Optional[List[str]] = None


class Skills(BaseModel):
    """All skills (technical, soft, languages)."""
    technical: List[TechnicalSkill] = Field(default_factory=list)
    soft: List[SoftSkill] = Field(default_factory=list)
    languages: List[LanguageSkill] = Field(default_factory=list)


# ============================================
# Certifications
# ============================================

class Certification(BaseModel):
    """Professional certification."""
    id: str
    name: str
    issuer: str
    issue_date: str = Field(..., alias="issueDate")
    expiration_date: Optional[str] = Field(None, alias="expirationDate")
    credential_id: Optional[str] = Field(None, alias="credentialId")
    credential_url: Optional[str] = Field(None, alias="credentialUrl")

    class Config:
        populate_by_name = True


# ============================================
# Projects
# ============================================

class Project(BaseModel):
    """Personal or professional project."""
    id: str
    name: str
    description: str
    url: Optional[str] = None
    repo_url: Optional[str] = Field(None, alias="repoUrl")
    start_date: Optional[str] = Field(None, alias="startDate")
    end_date: Optional[str] = Field(None, alias="endDate")
    technologies: List[str] = Field(default_factory=list)
    highlights: List[str] = Field(default_factory=list)

    class Config:
        populate_by_name = True


# ============================================
# Complete Profile (for extraction)
# ============================================

class Profile(BaseModel):
    """
    Complete profile data extracted from CV.

    This is the main model used for CV extraction. It contains only the
    information that can be extracted from a CV, not user preferences.
    """
    personal_info: PersonalInfo = Field(..., alias="personalInfo")
    work_experience: List[WorkExperience] = Field(default_factory=list, alias="workExperience")
    education: List[Education] = Field(default_factory=list)
    skills: Skills = Field(default_factory=Skills)
    certifications: Optional[List[Certification]] = None
    projects: Optional[List[Project]] = None

    class Config:
        populate_by_name = True

    @field_validator('work_experience', 'education')
    @classmethod
    def sort_by_date(cls, v):
        """Sort experiences and education by date (most recent first)."""
        if not v:
            return v
        # Sort by start_date or graduation_date in descending order
        try:
            if hasattr(v[0], 'start_date'):
                return sorted(v, key=lambda x: x.start_date or '', reverse=True)
            elif hasattr(v[0], 'graduation_date'):
                return sorted(v, key=lambda x: x.graduation_date or '', reverse=True)
        except Exception:
            pass
        return v
