from fastapi import APIRouter, WebSocket
import logging, traceback
import base64

from backend.agents.interviewer_graph import graph
from backend.services.tts_eleven import tts
from backend.services.stt_assembly import stt
from backend.utils.job_loader import load_job_from_url, load_job_from_pdf
from langchain.memory import ConversationBufferMemory
from langchain.schema import HumanMessage, AIMessage
from backend.executors.interviewer_runtime import ask_interviewer

logger = logging.getLogger("chat_ws")
router = APIRouter()

@router.websocket("/ws")
async def chat_socket(ws: WebSocket):
    await ws.accept()
    memory = ConversationBufferMemory(return_messages=True)
    job_context: str | None = None

    while True:
        try:
            payload = await ws.receive_json()
            msg_type = payload.get("type")

            if msg_type == "job_context_pdf":
                base64_content = payload.get("content")
                if not base64_content:
                    await ws.send_json({"type": "error", "data": "Missing PDF content"})
                    continue
                try:
                    # Load job posting from PDF
                    job_context = await load_job_from_pdf(base64_content)
                    logger.info("Loaded job from PDF")
                    await ws.send_json({"type": "ack", "data": "Job PDF received."})

                    # ---- Trigger first interviewer message right away ----
                    memory.chat_memory.add_user_message("///INIT_START///")
                    history = memory.load_memory_variables({})["history"]
                    result = await ask_interviewer(history, job_context=job_context)

                    reply_text = result["text"]
                    memory.chat_memory.add_ai_message(reply_text)

                    await ws.send_json({"type": "text", "data": reply_text})

                    if result.get("audio"):
                        await ws.send_bytes(result["audio"])

                    if result.get("error"):
                        await ws.send_json({"type": "error", "data": result["error"]})

                except Exception as e:
                    logger.exception("Failed to load job or send initial message")
                    await ws.send_json({"type": "error", "data": f"Failed to read PDF: {e}"})
                continue

            elif msg_type == "user_message":
                user_text: str = payload.get("text", "")
                want_tts: bool = payload.get("tts", False)

                memory.chat_memory.add_user_message(user_text)
                history = memory.load_memory_variables({})["history"]

                result = await ask_interviewer(history, job_context=job_context)

                reply_text = result["text"]
                memory.chat_memory.add_ai_message(reply_text)

                await ws.send_json({"type": "text", "data": reply_text})

                if want_tts and result.get("audio"):
                    await ws.send_bytes(result["audio"])

                if result.get("error"):
                    await ws.send_json({"type": "error", "data": result["error"]})

            elif msg_type == "user_audio":
                b64_audio: str = payload.get("audio", "")
                want_tts: bool = payload.get("tts", False)

                try:
                    audio_bytes = base64.b64decode(b64_audio)
                except Exception:
                    await ws.send_json({"type": "error", "data": "Invalid audio encoding"})
                    continue

                try:
                    user_text = await stt(audio_bytes)
                except Exception as e:
                    await ws.send_json({"type": "error", "data": f"STT failed: {e}"})
                    continue

                memory.chat_memory.add_user_message(user_text)
                history = memory.load_memory_variables({})["history"]

                result = await ask_interviewer(history, job_context=job_context)

                reply_text = result["text"]
                memory.chat_memory.add_ai_message(reply_text)

                await ws.send_json({"type": "text", "data": reply_text})

                if want_tts and result.get("audio"):
                    await ws.send_bytes(result["audio"])

                if result.get("error"):
                    await ws.send_json({"type": "error", "data": result["error"]})

            else:
                await ws.send_json({"type": "error", "data": f"Unknown message type: {msg_type}"})

        except Exception as e:
            logger.exception("chat_socket error")
            await ws.send_json({"type": "error", "data": str(e)})
