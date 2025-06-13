from typing import TypedDict, Optional
from langchain.schema import BaseMessage

class InterviewState(TypedDict):
    messages: list[BaseMessage]
    text: str
    emotion: str
    gesture: str
    audio: Optional[bytes]
    error: Optional[str]
