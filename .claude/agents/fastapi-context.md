# FastAPI Context & Patterns

## Project Structure
```
backend/
├── main.py              # App entry, CORS, routers
├── requirements.txt     # Python dependencies
├── .env.example         # Environment template
├── app/
│   ├── __init__.py
│   ├── models/          # Pydantic schemas
│   ├── routers/         # API endpoints
│   ├── chains/          # LangChain integrations (owned by LangChain agent)
│   └── db/              # Database operations
└── data/                # SQLite database, demo data
```

## Key Patterns

### Router Pattern
```python
from fastapi import APIRouter, HTTPException, Depends
from app.models import Profile, Job

router = APIRouter()

@router.post("/endpoint", response_model=ResponseModel)
async def endpoint(request: RequestModel):
    """Docstring with description."""
    try:
        # Implementation
        return ResponseModel(...)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

### Pydantic Model Pattern
```python
from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum

class MyEnum(str, Enum):
    option_a = "option_a"
    option_b = "option_b"

class MyModel(BaseModel):
    required_field: str = Field(..., description="Required field")
    optional_field: Optional[str] = Field(None, description="Optional")

    model_config = {
        "json_schema_extra": {
            "example": {
                "required_field": "value",
                "optional_field": "optional_value"
            }
        }
    }
```

### Async Database Pattern
```python
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db

@router.get("/items")
async def get_items(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Item))
    return result.scalars().all()
```

### File Upload Pattern
```python
from fastapi import UploadFile, File
import PyPDF2
import io

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(400, "Only PDF files supported")

    content = await file.read()
    pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
    text = "\n".join(page.extract_text() for page in pdf_reader.pages)
    return {"text": text}
```

## CORS Configuration
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Environment Variables
```
ANTHROPIC_API_KEY=sk-ant-...    # For LangChain/Claude
DATABASE_URL=sqlite+aiosqlite:///./data/jobs.db
```

## Running the Server
```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

## API Documentation
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- OpenAPI JSON: http://localhost:8000/openapi.json

## Dependencies (requirements.txt)
- fastapi - Web framework
- uvicorn - ASGI server
- pydantic - Data validation
- sqlalchemy - ORM
- aiosqlite - Async SQLite
- python-multipart - File uploads
- python-dotenv - Environment variables
- PyPDF2 - PDF parsing

## Error Handling
```python
from fastapi import HTTPException

# Client errors (4xx)
raise HTTPException(status_code=400, detail="Invalid input")
raise HTTPException(status_code=404, detail="Not found")

# Server errors (5xx)
raise HTTPException(status_code=500, detail="Internal error")
```

## Testing Endpoints
```bash
# Health check
curl http://localhost:8000/health

# Get demo profile
curl http://localhost:8000/api/cv/demo

# Get demo jobs
curl http://localhost:8000/api/jobs/demo

# Parse CV (with file)
curl -X POST -F "file=@cv.pdf" http://localhost:8000/api/cv/parse
```
