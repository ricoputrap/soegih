from fastapi import FastAPI
from app.routers import chat

app = FastAPI(title="Soegih AI Service")
app.include_router(chat.router, prefix="/ai", tags=["ai"])


@app.get("/health")
def health():
    return {"status": "ok"}
