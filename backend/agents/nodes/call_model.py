from langchain.schema import SystemMessage
from backend.services.llm_groq import llm
import json

def call_model(state: dict) -> dict:
    job_summary = state.get("summary", "a general technical role")
    base_prompt = f"""
    You are Mark, a strict technical interviewer.

    The candidate is applying for: {job_summary}

    Behavior rules:
    1. If the candidate says 'hello' or greets you, reply with a short acknowledgment and begin the interview.
    2. Ask relevant technical questions based on what they say. If they give no information, start with: "Describe your most relevant experience."
    3. Always reply in this JSON format:
    {
    "text": "...",
    "emotion": "strict | neutral | friendly",
    "gesture": "frown | nod | neutral"
    }
    Prefix the reply text with "Interviewer:".
    """

    messages = [
        SystemMessage(content=base_prompt),
        *state["messages"]
    ]

    response = llm.invoke(messages)
    content = response.content if isinstance(response.content, str) else str(response.content)

    try:
        parsed = json.loads(content)
        return {
            **state,
            "messages": [*state["messages"], response],
            "text": parsed["text"],
            "emotion": parsed.get("emotion", "neutral"),
            "gesture": parsed.get("gesture", "neutral"),
        }
    except:
        return {
            **state,
            "messages": [*state["messages"], response],
            "text": response.content,
            "emotion": "neutral",
            "gesture": "neutral"
        }
