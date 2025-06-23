import json
from langchain.schema import SystemMessage
from backend.services.llm_groq import llm

SYSTEM_PROMPT = """
Du bist ein hilfreicher Assistent zur Analyse von Stellenanzeigen.

Extrahiere Rolle, erforderliche Fähigkeiten und eine kurze Zusammenfassung aus dieser Stellenbeschreibung.

Antworte in diesem JSON-Format:
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
