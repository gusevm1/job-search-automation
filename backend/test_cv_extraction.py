"""
Test script for CV extraction chain.

This script demonstrates how to use the CVExtractionChain to extract
structured profile data from CV text.

Usage:
    python test_cv_extraction.py

Make sure to set ANTHROPIC_API_KEY environment variable before running.
"""

import asyncio
import json
import os
from pathlib import Path

from app.chains import CVExtractionChain, extract_profile_from_cv
from app.models import Profile


# Sample CV text for testing
SAMPLE_CV_TEXT = """
MAXIM GUSEV
Email: maxim.gusev@example.com
Phone: +41 79 123 4567
Location: Zurich, Switzerland
LinkedIn: linkedin.com/in/maxim-gusev
GitHub: github.com/maximgusev

PROFESSIONAL SUMMARY
Machine Learning Engineer with 3+ years of experience in developing and deploying
deep learning models. Specialized in NLP and computer vision applications. Strong
background in PyTorch, TensorFlow, and modern ML frameworks.

EDUCATION

ETH Zurich - Swiss Federal Institute of Technology
Master of Science in Computer Science
Sep 2021 - Sep 2023
GPA: 5.54/6.0
Relevant Coursework: Deep Learning, Natural Language Processing, Computer Vision,
Advanced Machine Learning, Probabilistic AI
Honors: Dean's List, ETH Excellence Scholarship

University of Geneva
Bachelor of Science in Computer Science
Sep 2017 - Jun 2021
GPA: 5.2/6.0

WORK EXPERIENCE

Senior ML Engineer | Google Research | Zurich, Switzerland
Jan 2024 - Present (Full-time, Hybrid)
- Leading development of large language model fine-tuning infrastructure
- Implemented distributed training pipeline reducing training time by 40%
- Developed novel attention mechanisms for efficient transformer models
- Mentoring team of 3 junior ML engineers
- Technologies: Python, PyTorch, TensorFlow, JAX, CUDA, Kubernetes, GCP
Achievements:
- Published 2 papers at NeurIPS 2024 on efficient transformers
- Reduced model inference latency by 60% through quantization

ML Research Intern | DeepMind | London, UK
Jun 2023 - Dec 2023 (Internship, Remote)
- Researched self-supervised learning methods for computer vision
- Implemented and benchmarked state-of-the-art SSL algorithms
- Contributed to open-source research codebase with 500+ GitHub stars
- Technologies: Python, PyTorch, NumPy, Weights & Biases, Docker
Achievements:
- Achieved 95% accuracy on ImageNet with 50% less labeled data
- Co-authored research paper submitted to ICLR 2024

Junior Data Scientist | Swiss Re | Zurich, Switzerland
Jul 2021 - May 2023 (Full-time, On-site)
- Built predictive models for insurance risk assessment
- Deployed ML models to production serving 10M+ requests/day
- Improved model accuracy by 15% through feature engineering
- Technologies: Python, Scikit-learn, XGBoost, SQL, AWS, Docker
Achievements:
- Reduced false positive rate by 25% saving $2M annually

TECHNICAL SKILLS

Languages: Python (Expert, 6 years), C++ (Advanced, 4 years), SQL (Advanced, 4 years),
JavaScript (Intermediate, 2 years)

ML/AI Frameworks: PyTorch (Expert, 4 years), TensorFlow (Advanced, 3 years),
Transformers (Expert, 3 years), scikit-learn (Advanced, 5 years), JAX (Intermediate, 1 year)

Cloud & DevOps: AWS (Advanced, 3 years), GCP (Advanced, 2 years), Kubernetes (Intermediate, 2 years),
Docker (Advanced, 4 years), MLflow (Intermediate, 2 years)

Databases: PostgreSQL (Advanced), MongoDB (Intermediate), Redis (Intermediate)

Tools: Git, Linux, Jupyter, VS Code, Vim

CERTIFICATIONS

AWS Certified Machine Learning - Specialty
Amazon Web Services
Issued: Jan 2023
Credential ID: AWS-ML-12345

Deep Learning Specialization
Coursera (deeplearning.ai)
Issued: Mar 2021

PROJECTS

TransformerX - Open Source Transformer Library
- Built efficient transformer implementation with 10K+ GitHub stars
- Implemented novel architectures (Flash Attention, ALiBi)
- Used by 50+ research papers
Technologies: Python, PyTorch, CUDA, C++
GitHub: github.com/maximgusev/transformerx

SwissJobSearch - AI Job Matching Platform
- Full-stack web application for intelligent job matching
- CV parsing with Claude AI, job scraping with Firecrawl
- Tech stack: Next.js, TypeScript, FastAPI, LangChain, PostgreSQL
GitHub: github.com/maximgusev/swissjobsearch

LANGUAGES

English - Native
German - Professional Working Proficiency
French - Limited Working Proficiency
Russian - Native
"""


async def test_async_extraction():
    """Test async CV extraction."""
    print("=" * 80)
    print("Testing ASYNC CV Extraction")
    print("=" * 80)

    # Initialize chain
    chain = CVExtractionChain()

    # Extract profile
    print("\nExtracting profile from CV...")
    profile = await chain.extract(SAMPLE_CV_TEXT)

    # Display results
    print("\n" + "=" * 80)
    print("EXTRACTION RESULTS")
    print("=" * 80)

    print(f"\nName: {profile.personal_info.first_name} {profile.personal_info.last_name}")
    print(f"Email: {profile.personal_info.email}")
    print(f"Phone: {profile.personal_info.phone}")
    print(f"Location: {profile.personal_info.location.city}, {profile.personal_info.location.country}")
    print(f"LinkedIn: {profile.personal_info.linkedin}")
    print(f"GitHub: {profile.personal_info.github}")

    print(f"\nWork Experience: {len(profile.work_experience)} entries")
    for exp in profile.work_experience:
        print(f"  - {exp.title} at {exp.company} ({exp.start_date} - {exp.end_date or 'Present'})")

    print(f"\nEducation: {len(profile.education)} entries")
    for edu in profile.education:
        print(f"  - {edu.degree.value} in {edu.field} from {edu.institution}")
        if edu.gpa:
            print(f"    GPA: {edu.gpa}")

    print(f"\nTechnical Skills: {len(profile.skills.technical)} skills")
    for skill in profile.skills.technical[:5]:  # Show first 5
        print(f"  - {skill.name} ({skill.category.value}, {skill.proficiency.value})")

    print(f"\nSoft Skills: {len(profile.skills.soft)} skills")
    for skill in profile.skills.soft[:5]:  # Show first 5
        print(f"  - {skill.name}")

    print(f"\nLanguages: {len(profile.skills.languages)} languages")
    for lang in profile.skills.languages:
        print(f"  - {lang.language} ({lang.proficiency.value})")

    if profile.certifications:
        print(f"\nCertifications: {len(profile.certifications)} certifications")
        for cert in profile.certifications:
            print(f"  - {cert.name} from {cert.issuer}")

    if profile.projects:
        print(f"\nProjects: {len(profile.projects)} projects")
        for proj in profile.projects:
            print(f"  - {proj.name}")

    # Save to file
    output_dir = Path("data/profiles")
    output_dir.mkdir(parents=True, exist_ok=True)
    output_file = output_dir / "test_profile.json"

    with open(output_file, "w") as f:
        json.dump(profile.model_dump(by_alias=True), f, indent=2)

    print(f"\n✓ Profile saved to: {output_file}")

    return profile


def test_sync_extraction():
    """Test synchronous CV extraction."""
    print("\n\n" + "=" * 80)
    print("Testing SYNC CV Extraction")
    print("=" * 80)

    print("\nExtracting profile from CV...")
    profile = extract_profile_from_cv(SAMPLE_CV_TEXT)

    print(f"✓ Successfully extracted profile for {profile.personal_info.first_name} {profile.personal_info.last_name}")

    return profile


def test_with_confidence():
    """Test extraction with confidence score."""
    print("\n\n" + "=" * 80)
    print("Testing CV Extraction with Confidence Score")
    print("=" * 80)

    chain = CVExtractionChain()

    print("\nExtracting profile with confidence scoring...")
    profile, confidence = chain.extract_with_confidence(SAMPLE_CV_TEXT)

    print(f"\n✓ Extraction completed")
    print(f"  Name: {profile.personal_info.first_name} {profile.personal_info.last_name}")
    print(f"  Confidence Score: {confidence:.2%}")

    # Breakdown
    print(f"\n  Confidence Breakdown:")
    print(f"    - Personal Info: {'✓' if profile.personal_info.email else '✗'} Email")
    print(f"    - Personal Info: {'✓' if profile.personal_info.phone else '✗'} Phone")
    print(f"    - Personal Info: {'✓' if profile.personal_info.location.city else '✗'} Location")
    print(f"    - Work Experience: {len(profile.work_experience)} entries")
    print(f"    - Education: {len(profile.education)} entries")
    print(f"    - Technical Skills: {len(profile.skills.technical)} skills")

    return profile, confidence


def main():
    """Run all tests."""
    # Check for API key
    if not os.getenv("ANTHROPIC_API_KEY"):
        print("ERROR: ANTHROPIC_API_KEY environment variable not set!")
        print("Please set it before running this script:")
        print("  export ANTHROPIC_API_KEY='your-api-key-here'")
        return

    try:
        # Test async extraction
        profile = asyncio.run(test_async_extraction())

        # Test sync extraction
        profile_sync = test_sync_extraction()

        # Test with confidence
        profile_conf, confidence = test_with_confidence()

        print("\n\n" + "=" * 80)
        print("ALL TESTS PASSED!")
        print("=" * 80)
        print(f"\nExtracted {len(profile.work_experience)} work experiences")
        print(f"Extracted {len(profile.education)} education entries")
        print(f"Extracted {len(profile.skills.technical)} technical skills")
        print(f"Confidence: {confidence:.2%}")

    except Exception as e:
        print(f"\n\nERROR: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
