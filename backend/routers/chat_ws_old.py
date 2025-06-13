# backend/routers/chat_ws.py
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import logging

log     = logging.getLogger("echo")
router  = APIRouter()

@router.websocket("/ws")        # final path will be /ws
async def echo(ws: WebSocket):
    await ws.accept()
    log.info("client %s connected", ws.client)
    try:
        while True:
            msg = await ws.receive_text()
            log.info("got: %s", msg)
            await ws.send_text(f"ECHO: {msg}")
    except WebSocketDisconnect:
        log.info("bye")
