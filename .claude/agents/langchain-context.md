# LangChain Context & Patterns

## LCEL (LangChain Expression Language)

The modern way to compose LangChain components:

```python
from langchain_anthropic import ChatAnthropic
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import PydanticOutputParser

# Build chain with pipe operator
chain = prompt | model | parser

# Invoke
result = await chain.ainvoke({"input": "..."})
```

## Pydantic Output Parser

```python
from pydantic import BaseModel, Field
from langchain_core.output_parsers import PydanticOutputParser

class ExtractedData(BaseModel):
    """Structured output from LLM."""
    field1: str = Field(..., description="Description for LLM")
    field2: int = Field(..., description="Numeric field")
    field3: list[str] = Field(default_factory=list, description="List field")

parser = PydanticOutputParser(pydantic_object=ExtractedData)
format_instructions = parser.get_format_instructions()
```

## Anthropic Integration

```python
from langchain_anthropic import ChatAnthropic
import os

model = ChatAnthropic(
    model="claude-3-5-haiku-20241022",  # Fast and cheap
    temperature=0,                       # Deterministic
    api_key=os.getenv("ANTHROPIC_API_KEY"),
)
```

## Prompt Template Pattern

```python
from langchain_core.prompts import ChatPromptTemplate

prompt = ChatPromptTemplate.from_messages([
    ("system", """You are an expert at X. Your task is to Y.

{format_instructions}

Be thorough and accurate."""),
    ("human", "{input}")
])
```

## Complete Chain Example

```python
from langchain_anthropic import ChatAnthropic
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import PydanticOutputParser
from pydantic import BaseModel
import os

class Result(BaseModel):
    answer: str
    confidence: float

class MyChain:
    def __init__(self):
        self.model = ChatAnthropic(
            model="claude-3-5-haiku-20241022",
            temperature=0,
            api_key=os.getenv("ANTHROPIC_API_KEY"),
        )

        self.parser = PydanticOutputParser(pydantic_object=Result)

        self.prompt = ChatPromptTemplate.from_messages([
            ("system", "You are helpful. {format_instructions}"),
            ("human", "{question}")
        ])

        self.chain = self.prompt | self.model | self.parser

    async def run(self, question: str) -> Result:
        return await self.chain.ainvoke({
            "question": question,
            "format_instructions": self.parser.get_format_instructions()
        })
```

## Error Handling

```python
from langchain_core.exceptions import OutputParserException
import logging

logger = logging.getLogger(__name__)

async def extract_with_retry(chain, input_data, max_retries=2):
    for attempt in range(max_retries + 1):
        try:
            return await chain.ainvoke(input_data)
        except OutputParserException as e:
            logger.warning(f"Parse error (attempt {attempt + 1}): {e}")
            if attempt == max_retries:
                raise
        except Exception as e:
            logger.error(f"Chain error: {e}")
            raise
```

## CV Extraction Chain Structure

```python
class CVExtractionChain:
    def __init__(self):
        self.model = ChatAnthropic(...)
        self.parser = PydanticOutputParser(pydantic_object=Profile)
        self.prompt = ChatPromptTemplate.from_messages([...])
        self.chain = self.prompt | self.model | self.parser

    async def extract(self, cv_text: str) -> Profile:
        """Extract structured profile from CV text."""
        return await self.chain.ainvoke({
            "cv_text": cv_text,
            "format_instructions": self.parser.get_format_instructions()
        })
```

## Job Matching Chain Structure

```python
class JobMatchingChain:
    def __init__(self):
        self.model = ChatAnthropic(...)
        self.parser = PydanticOutputParser(pydantic_object=MatchResult)
        self.prompt = ChatPromptTemplate.from_messages([...])
        self.chain = self.prompt | self.model | self.parser

    async def match(self, profile: Profile, job: Job) -> MatchResult:
        """Calculate semantic match between profile and job."""
        return await self.chain.ainvoke({
            "profile": profile.model_dump_json(),
            "job": job.model_dump_json(),
            "format_instructions": self.parser.get_format_instructions()
        })
```

## Dependencies

```
langchain>=0.1.0
langchain-anthropic>=0.1.1
langchain-core>=0.1.0
pydantic>=2.5.0
anthropic>=0.18.0
```

## Testing Chains

```python
import asyncio
from app.chains import CVExtractionChain

async def test():
    chain = CVExtractionChain()

    cv_text = """
    John Doe
    Software Engineer
    john@example.com

    Experience:
    - Senior Developer at TechCorp (2020-present)

    Education:
    - BS Computer Science, MIT, 2018
    """

    profile = await chain.extract(cv_text)
    print(profile.model_dump_json(indent=2))

if __name__ == "__main__":
    asyncio.run(test())
```

## Environment Setup

```bash
export ANTHROPIC_API_KEY='sk-ant-api03-...'
```

Or in `.env`:
```
ANTHROPIC_API_KEY=sk-ant-api03-...
```
