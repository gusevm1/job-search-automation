"""
LangChain-based CV extraction pipeline using Claude AI.

This module provides a chain for extracting structured profile data from CV text
using the Anthropic Claude API and LangChain Expression Language (LCEL).
"""

import os
import logging
from typing import Optional
from uuid import uuid4

from langchain_anthropic import ChatAnthropic
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.exceptions import OutputParserException

from app.models.profile import Profile


# Configure logging
logger = logging.getLogger(__name__)


class CVExtractionChain:
    """
    LangChain chain for extracting structured profile data from CV text.

    This chain uses Claude AI to parse CV text and extract structured information
    including personal details, work experience, education, skills, certifications,
    and projects. It uses Pydantic models for structured output validation.

    Example:
        >>> chain = CVExtractionChain()
        >>> profile = await chain.extract(cv_text)
        >>> print(profile.personal_info.first_name)
    """

    def __init__(
        self,
        model_name: str = "claude-3-5-haiku-20241022",
        temperature: float = 0.0,
        api_key: Optional[str] = None,
        max_retries: int = 2
    ):
        """
        Initialize the CV extraction chain.

        Args:
            model_name: Claude model to use (default: claude-3-5-haiku-20241022)
            temperature: Sampling temperature (0 for deterministic output)
            api_key: Anthropic API key (defaults to ANTHROPIC_API_KEY env var)
            max_retries: Maximum retry attempts for malformed outputs
        """
        self.model_name = model_name
        self.temperature = temperature
        self.max_retries = max_retries

        # Initialize Claude model
        self.llm = ChatAnthropic(
            model=model_name,
            temperature=temperature,
            api_key=api_key or os.getenv("ANTHROPIC_API_KEY"),
            max_retries=2,
        )

        # Initialize output parser
        self.parser = PydanticOutputParser(pydantic_object=Profile)

        # Build prompt template
        self.prompt = self._create_prompt_template()

        # Compose chain using LCEL
        self.chain = self.prompt | self.llm | self.parser

        logger.info(f"Initialized CVExtractionChain with model: {model_name}")

    def _create_prompt_template(self) -> ChatPromptTemplate:
        """
        Create the prompt template for CV extraction.

        Returns:
            ChatPromptTemplate configured for CV extraction
        """
        system_prompt = """You are an expert CV/resume parser with deep expertise in extracting structured information from various CV formats.

Your task is to carefully analyze the provided CV text and extract ALL available information into a structured JSON format.

INSTRUCTIONS:
1. Extract ALL information present in the CV - be thorough and comprehensive
2. Use the exact field names and structure specified in the format instructions
3. For dates, use ISO 8601 format (YYYY-MM-DD) when possible. If only year/month is available, use YYYY-MM or YYYY
4. Generate unique IDs for list items (use format: "exp_1", "edu_1", "cert_1", "proj_1", etc.)
5. Infer missing information intelligently when possible:
   - Company size from company name (e.g., Google = "enterprise", startup name = "startup")
   - Skill categories from skill names (e.g., Python = "language", AWS = "cloud")
   - Proficiency levels from context (years of experience, job titles, etc.)
6. For skills:
   - Categorize each technical skill appropriately (language/framework/database/cloud/devops/tool/other)
   - Estimate proficiency based on years of experience or job context
   - Extract skills from job descriptions even if not in a separate skills section
7. For work experience:
   - Extract responsibilities as bullet points
   - Identify achievements with quantifiable metrics when possible
   - List technologies/skills used in each role
8. Handle edge cases gracefully:
   - If email/phone not found, use placeholder values
   - If location incomplete, fill what's available and mark country as "Unknown" if not found
   - Current roles: set end_date to null and is_current to true
9. For multi-language CVs, prefer English content but extract from other languages if needed
10. Be conservative with personal information - only extract what's explicitly stated

IMPORTANT FORMATTING RULES:
- ALL field names must use snake_case (e.g., "first_name", not "firstName")
- Dates must be strings in ISO format (YYYY-MM-DD)
- Boolean fields must be true/false (lowercase)
- Empty lists should be [] not null
- Optional fields can be null if not found

{format_instructions}

Extract the information carefully and comprehensively."""

        user_prompt = """Please extract all information from the following CV text:

{cv_text}

Return the extracted profile data in the specified JSON format."""

        return ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("human", user_prompt)
        ]).partial(format_instructions=self.parser.get_format_instructions())

    async def extract(self, cv_text: str) -> Profile:
        """
        Extract profile data from CV text asynchronously.

        Args:
            cv_text: The CV text to parse (plain text or markdown)

        Returns:
            Profile object with extracted data

        Raises:
            ValueError: If CV text is empty or extraction fails after retries
            OutputParserException: If output cannot be parsed to Profile model
        """
        if not cv_text or not cv_text.strip():
            raise ValueError("CV text cannot be empty")

        logger.info("Starting async CV extraction")
        logger.debug(f"CV text length: {len(cv_text)} characters")

        for attempt in range(self.max_retries):
            try:
                # Run the chain
                result = await self.chain.ainvoke({
                    "cv_text": cv_text
                })

                # Validate and return
                if not isinstance(result, Profile):
                    raise ValueError(f"Expected Profile object, got {type(result)}")

                logger.info("CV extraction successful")
                logger.debug(f"Extracted profile for: {result.personal_info.first_name} {result.personal_info.last_name}")

                return result

            except OutputParserException as e:
                logger.warning(f"Output parsing failed (attempt {attempt + 1}/{self.max_retries}): {e}")
                if attempt == self.max_retries - 1:
                    raise ValueError(f"Failed to parse CV after {self.max_retries} attempts: {e}")

            except Exception as e:
                logger.error(f"CV extraction failed (attempt {attempt + 1}/{self.max_retries}): {e}")
                if attempt == self.max_retries - 1:
                    raise ValueError(f"CV extraction failed after {self.max_retries} attempts: {e}")

    def extract_sync(self, cv_text: str) -> Profile:
        """
        Extract profile data from CV text synchronously.

        This is a convenience method for simpler use cases that don't require async.

        Args:
            cv_text: The CV text to parse (plain text or markdown)

        Returns:
            Profile object with extracted data

        Raises:
            ValueError: If CV text is empty or extraction fails after retries
            OutputParserException: If output cannot be parsed to Profile model
        """
        if not cv_text or not cv_text.strip():
            raise ValueError("CV text cannot be empty")

        logger.info("Starting sync CV extraction")
        logger.debug(f"CV text length: {len(cv_text)} characters")

        for attempt in range(self.max_retries):
            try:
                # Run the chain synchronously
                result = self.chain.invoke({
                    "cv_text": cv_text
                })

                # Validate and return
                if not isinstance(result, Profile):
                    raise ValueError(f"Expected Profile object, got {type(result)}")

                logger.info("CV extraction successful")
                logger.debug(f"Extracted profile for: {result.personal_info.first_name} {result.personal_info.last_name}")

                return result

            except OutputParserException as e:
                logger.warning(f"Output parsing failed (attempt {attempt + 1}/{self.max_retries}): {e}")
                if attempt == self.max_retries - 1:
                    raise ValueError(f"Failed to parse CV after {self.max_retries} attempts: {e}")

            except Exception as e:
                logger.error(f"CV extraction failed (attempt {attempt + 1}/{self.max_retries}): {e}")
                if attempt == self.max_retries - 1:
                    raise ValueError(f"CV extraction failed after {self.max_retries} attempts: {e}")

    def extract_with_confidence(self, cv_text: str) -> tuple[Profile, float]:
        """
        Extract profile with confidence score (synchronous).

        This method returns both the extracted profile and a confidence score
        based on the completeness of extracted data.

        Args:
            cv_text: The CV text to parse

        Returns:
            Tuple of (Profile, confidence_score) where confidence is 0.0-1.0

        Note:
            Confidence is calculated based on:
            - Presence of key fields (email, phone, location)
            - Number of work experiences
            - Number of skills
            - Completeness of each experience/education entry
        """
        profile = self.extract_sync(cv_text)

        # Calculate confidence score
        confidence = self._calculate_confidence(profile)

        logger.info(f"Extraction confidence: {confidence:.2%}")
        return profile, confidence

    def _calculate_confidence(self, profile: Profile) -> float:
        """
        Calculate confidence score for extracted profile.

        Args:
            profile: Extracted profile

        Returns:
            Confidence score between 0.0 and 1.0
        """
        score = 0.0
        max_score = 0.0

        # Personal info (30 points)
        max_score += 30
        if profile.personal_info.email:
            score += 10
        if profile.personal_info.phone:
            score += 5
        if profile.personal_info.location.city:
            score += 5
        if profile.personal_info.linkedin or profile.personal_info.github:
            score += 5
        if profile.personal_info.summary:
            score += 5

        # Work experience (30 points)
        max_score += 30
        if profile.work_experience:
            score += 15
            # Bonus for detailed experiences
            if len(profile.work_experience) >= 2:
                score += 5
            if any(len(exp.responsibilities) >= 3 for exp in profile.work_experience):
                score += 5
            if any(exp.achievements for exp in profile.work_experience):
                score += 5

        # Education (20 points)
        max_score += 20
        if profile.education:
            score += 10
            if len(profile.education) >= 1:
                score += 5
            if any(edu.gpa for edu in profile.education):
                score += 5

        # Skills (20 points)
        max_score += 20
        if profile.skills.technical:
            score += 10
            if len(profile.skills.technical) >= 5:
                score += 5
            if len(profile.skills.technical) >= 10:
                score += 5

        return min(score / max_score, 1.0) if max_score > 0 else 0.0


# Convenience function for quick extraction
def extract_profile_from_cv(cv_text: str, **kwargs) -> Profile:
    """
    Convenience function for quick profile extraction.

    Args:
        cv_text: CV text to parse
        **kwargs: Additional arguments passed to CVExtractionChain

    Returns:
        Extracted Profile object

    Example:
        >>> profile = extract_profile_from_cv(cv_text)
        >>> print(profile.personal_info.email)
    """
    chain = CVExtractionChain(**kwargs)
    return chain.extract_sync(cv_text)
