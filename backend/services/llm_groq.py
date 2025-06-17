# backend/services/llm_groq.py

import os
from dotenv import load_dotenv

# Load .env before anything else
load_dotenv(dotenv_path=".env", override=True)

from pathlib import Path
from langchain_groq import ChatGroq
from pydantic import SecretStr

api_key = os.getenv("GROQ_API_KEY")
if not api_key:
    raise ValueError("GROQ_API_KEY not found in environment!")

llm = ChatGroq(
    api_key=SecretStr(api_key),
    model="llama-3.1-8b-instant",
    temperature=0.3,
    max_retries=2
)
