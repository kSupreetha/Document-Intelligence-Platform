# Document Intelligence Platform

A RAG-based (Retrieval-Augmented Generation) document assistant. Upload PDFs, ask questions in plain English, and get answers grounded in your documents with cited sources.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, Tailwind CSS 4 |
| Backend | FastAPI, Uvicorn |
| Embeddings | Sentence Transformers (`all-MiniLM-L6-v2`) |
| Vector Store | ChromaDB |
| LLM | Groq (`llama-3.1-8b-instant`) |
| PDF Parsing | pypdf |

## Project Structure

```
document-intelligence-platform/
├── backend/
│   ├── services/
│   │   ├── pdf_reader.py       # PDF text extraction
│   │   ├── chunker.py          # Text chunking
│   │   ├── embedding_service.py # ChromaDB storage + similarity search
│   │   └── groq_service.py     # LLM answer generation
│   ├── main.py                 # FastAPI app + routes
│   ├── requirements.txt
│   └── .env                    # API keys (not committed)
└── frontend/
    ├── app/
    │   ├── page.tsx            # Main UI
    │   └── layout.tsx
    └── package.json
```

## Setup

### Prerequisites

- Python 3.10+
- Node.js 18+
- A [Groq API key](https://console.groq.com)

### Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Create .env file
echo GROQ_API_KEY=your_groq_api_key_here > .env

# Start the server
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:3000` (or `3001` if port 3000 is in use).

## Usage

1. Open the app in your browser
2. Upload one or more PDF files using the **Upload Document** panel
3. Select a specific document from the **Documents** list, or leave **All Documents** selected to query across everything
4. Type a question in the chat input and press **Enter** or click **Ask**
5. The AI answers using only the content of your documents, with expandable source citations

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/upload-pdf/` | Upload and index a PDF |
| `GET` | `/ask/?query=...` | Ask a question (optional: `&filename=...` to scope to one doc) |

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | Yes | API key from [console.groq.com](https://console.groq.com) |
