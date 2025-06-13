import json
from langchain.schema import SystemMessage
from backend.services.llm_groq import llm

SYSTEM_PROMPT = """
You're a helpful assistant for analyzing job vacancies.

Extract role, required skills, and a short summary from this job post.

Respond in this JSON format:
{
  "job_role": "...",
  "required_skills": ["...", "..."],
  "summary": "..."
}
"""

def analyze_job(state: dict) -> dict:
    job_input = state.get("job_input", "")

    messages = [
        SystemMessage(content=SYSTEM_PROMPT),
        SystemMessage(content=job_input)
    ]
    response = llm.invoke(messages)
    content = response.content if isinstance(response.content, str) else str(response.content)

    try:
        data = json.loads(content)
        return {**state, **data}
    except Exception:
        return {**state, "job_role": "unknown", "required_skills": [], "summary": job_input}