from starlette.websockets import WebSocket

async def websocket_text_stream(ws: WebSocket):
    while True:
        txt = await ws.receive_text()
        yield txt