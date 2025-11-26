"""
LangChain agents and chains for JobSearch AI API.

This module contains LangChain-based AI agents for:
- CV extraction and parsing (CVExtractionChain)
- Job matching and scoring (TODO)
- Query generation for job searches (TODO)
"""

from app.chains.cv_extraction import (
    CVExtractionChain,
    extract_profile_from_cv,
)

__all__ = [
    "CVExtractionChain",
    "extract_profile_from_cv",
]
