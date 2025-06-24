import types
import sys
import os
from unittest import mock

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

# Stub langchain.schema messages
langchain = types.ModuleType("langchain")
schema = types.ModuleType("langchain.schema")

class BaseMessage:
    def __init__(self, content):
        self.content = content

class HumanMessage(BaseMessage):
    pass

class SystemMessage(BaseMessage):
    pass

schema.HumanMessage = HumanMessage
schema.SystemMessage = SystemMessage
langchain.schema = schema
sys.modules['langchain'] = langchain
sys.modules['langchain.schema'] = schema

# Stub backend.services.llm_groq before importing call_model
llm_module = types.ModuleType('backend.services.llm_groq')
class DummyLLM:
    def __init__(self, content):
        self._content = content
    def invoke(self, messages):
        return types.SimpleNamespace(content=self._content)

llm_module.llm = DummyLLM('Interviewer: { "text": "hi" }')
sys.modules['backend.services.llm_groq'] = llm_module

from backend.agents.nodes.call_model import call_model


def test_parses_json_after_prefix():
    state = {"messages": []}
    result = call_model(state)
    assert result["text"] == "hi"
