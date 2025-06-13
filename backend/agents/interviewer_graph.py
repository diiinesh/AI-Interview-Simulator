"""Strict technical interviewer using ReAct. Important:
* Use `prefix=` so we **keep** the ReAct format section.
* Remove duplicate agent initializations (only one AgentExecutor instance).
"""
from typing import Any
from backend.services.llm_groq import llm
from langgraph.graph import END, MessageGraph, StateGraph, START, MessagesState
from langgraph.prebuilt import create_react_agent
from langchain.chat_models import ChatOpenAI
from langchain.schema import SystemMessage, HumanMessage
from backend.services.tts_eleven import tts
import json
from backend.schemas.interview import InterviewState
from backend.agents.nodes.call_model import call_model
from backend.agents.nodes.tts_node import tts_node
from backend.agents.nodes.analyze_job import analyze_job

builder = StateGraph(InterviewState)
builder.add_node("analyze_job", analyze_job)
builder.add_node("call_model", call_model)
builder.add_node("tts_node", tts_node)

builder.set_entry_point("analyze_job")
builder.add_edge("analyze_job", "call_model")
builder.add_edge("call_model", "tts_node")
builder.add_edge("tts_node", END)

graph = builder.compile()
