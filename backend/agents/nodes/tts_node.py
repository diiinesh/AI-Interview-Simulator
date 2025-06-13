from typing import Any
from backend.services.tts_eleven import tts

async def tts_node(state: dict[str, Any]) -> dict[str, Any]:
    text = state.get("text", "")
    emotion = state.get("emotion", "neutral")

    if not text:
        return {**state, "audio": None, "error": "No text to synthesize."}

    try:
        audio = await tts(text, emotion=emotion)
        return {**state, "audio": audio}
    except Exception as e:
        return {**state, "audio": None, "error": f"TTS failed: {e}"}