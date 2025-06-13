from fastapi import APIRouter
from pydantic import BaseModel
from backend.agents.interviewer import ask_interviewer
from backend.services.tts_eleven import tts

router_http = APIRouter()

class ChatIn(BaseModel):
    message: str

class ChatOut(BaseModel):
    reply_text: str
    audio_mp3: str  # hex‑encoded

@router_http.post("/chat", response_model=ChatOut)
async def chat(body: ChatIn):
    reply = await ask_interviewer(body.message)
    audio = await tts(reply)
    return ChatOut(reply_text=reply, audio_mp3=audio.hex())