from fastapi import APIRouter, WebSocket
import logging, traceback

from backend.agents.interviewer_graph import graph
from backend.services.tts_eleven import tts
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

            if msg_type == "job_context":
                # Store the job ad text or URL content
                job_context = payload.get("data", "")
                logger.info(f"Received job context: {job_context[:80]}...")
                await ws.send_json({"type": "ack", "data": "Job context received."})
                continue  # Wait for next input

            elif msg_type == "user_message":
                user_text: str = payload.get("text", "")
                want_tts: bool = payload.get("tts", False)

                # 1. Update memory
                memory.chat_memory.add_user_message(user_text)
                history = memory.load_memory_variables({})["history"]

                # 2. Call LangGraph with full state
                result = await ask_interviewer(history, job_context=job_context)

                reply_text = result["text"]
                memory.chat_memory.add_ai_message(reply_text)

                # 3. Send text
                await ws.send_json({"type": "text", "data": reply_text})

                # 4. Optionally send audio
                if want_tts and result.get("audio"):
                    await ws.send_bytes(result["audio"])

                # 5. Optional error
                if result.get("error"):
                    await ws.send_json({"type": "error", "data": result["error"]})

            else:
                await ws.send_json({"type": "error", "data": f"Unknown message type: {msg_type}"})

        except Exception as e:
            logger.exception("chat_socket error")
            await ws.send_json({"type": "error", "data": str(e)})