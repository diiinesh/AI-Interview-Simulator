from langchain.schema import SystemMessage, HumanMessage
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
    {{
    "text": "..."
    }}
    Prefix the reply text with "Interviewer:".
    """

    messages = state["messages"]
    if messages and isinstance(messages[-1], HumanMessage) and messages[-1].content == "///INIT_START///":
        messages = messages[:-1] + [HumanMessage(content="Let's begin.")]

    full_messages = [SystemMessage(content=base_prompt), *messages]

    response = llm.invoke(full_messages)
    content = response.content if isinstance(response.content, str) else str(response.content)

    try:
        parsed = json.loads(content)
        return {
            **state,
            "messages": [*messages, response],
            "text": parsed["text"]
        }
    except:
        return {
            **state,
            "messages": [*messages, response],
            "text": response.content
        }
