from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, catalog, shop
from app.db import Base, engine


Base.metadata.create_all(bind=engine)

app = FastAPI(title="ToyStore API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth.router, prefix="/api")
app.include_router(catalog.router, prefix="/api")
app.include_router(shop.router, prefix="/api")


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "toystore-api"}
