from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routers.chat_ws import router as ws_router

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)
app.include_router(ws_router)
# app.include_router(router_http)