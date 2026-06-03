from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import os

from services.pdf_reader import extract_text_from_pdf
from services.chunker import chunk_text
from services.embedding_service import store_chunks, search_chunks
from services.groq_service import generate_answer

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@app.get("/")
def home():
    return {"message": "Backend running successfully"}


@app.post("/upload-pdf/")
async def upload_pdf(file: UploadFile = File(...)):
    file_path = os.path.join(UPLOAD_DIR, file.filename)

    with open(file_path, "wb") as f:
        f.write(await file.read())

    text = extract_text_from_pdf(file_path)
    chunks = chunk_text(text)

    stored_count = store_chunks(chunks, file.filename)

    return {
        "filename": file.filename,
        "total_chunks": len(chunks),
        "stored_chunks": stored_count,
        "message": "PDF uploaded, chunked, and stored successfully"
    }


@app.get("/ask/")
def ask_question(query: str):
    sources = search_chunks(query)

    context_chunks = [source["text"] for source in sources]

    answer = generate_answer(
        question=query,
        context_chunks=context_chunks
    )

    return {
        "query": query,
        "answer": answer,
        "sources": sources
    }