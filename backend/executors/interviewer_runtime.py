from typing import Any
from langchain.schema import HumanMessage
from langchain_core.messages.base import BaseMessage
from backend.agents.interviewer_graph import graph

async def ask_interviewer(
    history: list[BaseMessage],
    job_context: str | None = None
) -> dict[str, Any]:
    result = await graph.ainvoke({
        "messages": history,
        "job_input": job_context
    })
    return {
        "text": result["text"],
        "emotion": result.get("emotion"),
        "gesture": result.get("gesture"),
        "audio": result.get("audio"),
        "error": result.get("error"),
        "messages": result.get("messages", [])
    }
