# JobSearch AI API - Backend

FastAPI backend for the JobSearch Automation project. Provides AI-powered CV parsing and job matching using LangChain and Claude AI.

## Features

- **CV Parsing**: Extract structured profile data from PDF resumes using Claude AI
- **Job Matching**: AI-powered job matching and scoring against user profiles
- **RESTful API**: Clean API design with automatic OpenAPI documentation
- **Async/Await**: Built with async Python for high performance
- **Type Safety**: Full type hints and Pydantic validation

## Tech Stack

- **FastAPI** - Modern async web framework
- **LangChain** - AI agent framework
- **Anthropic Claude** - LLM for CV parsing and job analysis
- **SQLAlchemy** - Async ORM with SQLite
- **Pydantic** - Data validation and serialization
- **Uvicorn** - ASGI server

## Setup

### 1. Create Virtual Environment

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
```

### 4. Run Server

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- API: http://localhost:8000
- Swagger Docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API Endpoints

### CV Processing

- `POST /api/cv/parse` - Parse PDF CV and extract profile
- `GET /api/cv/demo` - Get demo profile
- `GET /api/cv/{profile_id}` - Get profile by ID

### Job Matching

- `POST /api/jobs/match` - Match jobs against profile
- `GET /api/jobs/demo` - Get demo job listings
- `GET /api/jobs/{job_id}` - Get job by ID
- `GET /api/jobs/` - List jobs with filters

## Project Structure

```
backend/
├── main.py                 # FastAPI app entry point
├── requirements.txt        # Python dependencies
├── .env.example           # Environment template
├── app/
│   ├── __init__.py
│   ├── models/            # Pydantic models
│   │   ├── profile.py     # Profile/CV models
│   │   └── job.py         # Job models
│   ├── chains/            # LangChain agents (to be implemented)
│   ├── routers/           # API endpoints
│   │   ├── cv.py          # CV processing routes
│   │   └── jobs.py        # Job matching routes
│   └── db/                # Database
│       └── database.py    # SQLite setup
└── data/                  # SQLite database storage
```

## Development

### Testing with Swagger UI

1. Start the server
2. Open http://localhost:8000/docs
3. Try the demo endpoints:
   - `GET /api/cv/demo` - Returns Maxim Gusev's profile
   - `GET /api/jobs/demo` - Returns sample job listings

### Adding New Endpoints

1. Define Pydantic models in `app/models/`
2. Create route handlers in `app/routers/`
3. Include router in `main.py`

### Database

Currently uses SQLite for simplicity. The database will be created automatically at `data/jobsearch.db`.

To initialize/reset the database, delete `data/jobsearch.db` and restart the server.

## TODO

- [ ] Implement LangChain CV extraction agent
- [ ] Implement LangChain job matching agent
- [ ] Add database models and persistence
- [ ] Add authentication/authorization
- [ ] Add rate limiting
- [ ] Add logging and monitoring
- [ ] Add tests (pytest)

## Environment Variables

- `ANTHROPIC_API_KEY` - Required for Claude AI
- `DATABASE_URL` - SQLite connection string (default: `sqlite+aiosqlite:///./data/jobsearch.db`)
- `API_HOST` - Server host (default: 0.0.0.0)
- `API_PORT` - Server port (default: 8000)
- `CORS_ORIGINS` - Allowed CORS origins (default: http://localhost:3000)

## License

MIT
