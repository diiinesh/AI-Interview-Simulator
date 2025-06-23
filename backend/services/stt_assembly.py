import os
import asyncio
import httpx
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

ASSEMBLY_API_KEY = os.getenv("ASSEMBLY_API_KEY")

if not ASSEMBLY_API_KEY:
    raise ValueError("ASSEMBLY_API_KEY environment variable is required")

async def stt(audio: bytes, language_code: str = "en") -> str:
    """Transcribe audio bytes using AssemblyAI."""
    headers = {"authorization": ASSEMBLY_API_KEY}
    async with httpx.AsyncClient(timeout=60) as client:
        # Upload audio file
        upload_resp = await client.post(
            "https://api.assemblyai.com/v2/upload",
            headers=headers,
            data=audio,
        )
        upload_resp.raise_for_status()
        upload_url = upload_resp.json()["upload_url"]

        # Request transcription
        transcript_resp = await client.post(
            "https://api.assemblyai.com/v2/transcript",
            headers={**headers, "content-type": "application/json"},
            json={"audio_url": upload_url, "language_code": language_code},
        )
        transcript_resp.raise_for_status()
        transcript_id = transcript_resp.json()["id"]

        status = "queued"
        while status not in {"completed", "error"}:
            await asyncio.sleep(3)
            poll_resp = await client.get(
                f"https://api.assemblyai.com/v2/transcript/{transcript_id}",
                headers=headers,
            )
            poll_resp.raise_for_status()
            data = poll_resp.json()
            status = data["status"]

        if status == "completed":
            return data.get("text", "")
        raise RuntimeError(f"Transcription failed: {data.get('error')}")
