from langchain.schema import SystemMessage, HumanMessage
from backend.services.llm_groq import llm
import json

def call_model(state: dict) -> dict:
    job_summary = state.get("summary", "a general technical role")
    base_prompt = f"""
    Du bist Mark, ein strenger technischer Interviewer.

    Der Kandidat bewirbt sich auf: {job_summary}

    Verhaltensregeln:
    1. Wenn der Kandidat 'hallo' sagt oder dich begrüßt, antworte kurz und beginne das Interview.
    2. Stelle passende technische Fragen basierend auf seinen Antworten. Wenn er keine Informationen gibt, starte mit: "Beschreiben Sie Ihre relevanteste Erfahrung."
    3. Antworte immer in diesem JSON-Format:
    {{
    "text": "...",
    "emotion": "<optional emotion>",
    "gesture": "<optional gesture>"
    }}
    Setze dem Antworttext "Interviewer:" voran.
    """

    messages = state["messages"]
    if messages and isinstance(messages[-1], HumanMessage) and messages[-1].content == "///INIT_START///":
        messages = messages[:-1] + [HumanMessage(content="Legen wir los.")]

    full_messages = [SystemMessage(content=base_prompt), *messages]

    response = llm.invoke(full_messages)
    content = response.content if isinstance(response.content, str) else str(response.content)

    json_start = content.find("{")
    parsed_text = None
    parsed_emotion = None
    parsed_gesture = None
    if json_start != -1:
        try:
            parsed = json.loads(content[json_start:])
            parsed_text = parsed.get("text")
            parsed_emotion = parsed.get("emotion")
            parsed_gesture = parsed.get("gesture")
        except Exception:
            parsed_text = None

    return {
        **state,
        "messages": [*messages, response],
        "text": parsed_text if parsed_text is not None else content,
        "emotion": parsed_emotion if parsed_emotion is not None else state.get("emotion", "neutral"),
        "gesture": parsed_gesture if parsed_gesture is not None else state.get("gesture")
    }
