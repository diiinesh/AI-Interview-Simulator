
import os
import httpx
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get environment variables
ELEVEN_API_KEY = os.getenv("ELEVEN_API_KEY")
ELEVEN_VOICE_ID = os.getenv("ELEVEN_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")  # Default voice

# Simple validation
if not ELEVEN_API_KEY:
    raise ValueError("ELEVEN_API_KEY environment variable is required")

async def tts_txtOnly(text: str) -> bytes:
    voice = ELEVEN_VOICE_ID  # Use env variable directly
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice}/stream"
    payload = {
        "text": text,
        "model_id": "eleven_turbo_v2",
        "voice_settings": {"stability": 0.3, "similarity_boost": 0.8},
    }
    headers = {"xi-api-key": ELEVEN_API_KEY, "Content-Type": "application/json"}  # Use env variable directly
    async with httpx.AsyncClient(timeout=60) as client:
        r = await client.post(url, json=payload, headers=headers)
        r.raise_for_status()
        return r.content
    
async def tts(text: str, emotion: str = "neutral") -> bytes:
    voice = ELEVEN_VOICE_ID
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice}/stream"

    voice_settings_map = {
        "strict": {"stability": 0.2, "similarity_boost": 0.6},
        "neutral": {"stability": 0.5, "similarity_boost": 0.75},
        "friendly": {"stability": 0.7, "similarity_boost": 0.9}
    }

    voice_settings = voice_settings_map.get(emotion.lower(), voice_settings_map["neutral"])

    payload = {
        "text": text,
        "model_id": "eleven_turbo_v2",
        "voice_settings": voice_settings
    }

    headers = {
        "xi-api-key": ELEVEN_API_KEY,
        "Content-Type": "application/json"
    }

    async with httpx.AsyncClient(timeout=60) as client:
        r = await client.post(url, json=payload, headers=headers)
        r.raise_for_status()
        return r.content
    

# Alternative: Pass voice_id as parameter for flexibility
async def tts_flexible(text: str, voice_id: str = "NBqeXKdZHweef6y0B67V") -> bytes:
    voice = voice_id or ELEVEN_VOICE_ID  # Use parameter or default
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice}/stream"
    payload = {
        "text": text,
        "model_id": "eleven_turbo_v2",
        "voice_settings": {"stability": 0.3, "similarity_boost": 0.8},
    }
    headers = {"xi-api-key": ELEVEN_API_KEY, "Content-Type": "application/json"}
    async with httpx.AsyncClient(timeout=60) as client:
        r = await client.post(url, json=payload, headers=headers)
        r.raise_for_status()
        return r.content  # MP3 bytes