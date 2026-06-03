import chromadb
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("all-MiniLM-L6-v2")

client = chromadb.PersistentClient(path="chroma_db")
collection = client.get_or_create_collection(name="documents")


def store_chunks(chunks, filename):
    ids = []
    embeddings = []
    metadatas = []

    for i, chunk in enumerate(chunks):
        clean_chunk = chunk.strip()

        if clean_chunk:
            ids.append(f"{filename}_{i}")
            embeddings.append(model.encode(clean_chunk).tolist())
            metadatas.append({
                "filename": filename,
                "chunk_index": i
            })

    collection.upsert(
        ids=ids,
        embeddings=embeddings,
        documents=[chunk.strip() for chunk in chunks if chunk.strip()],
        metadatas=metadatas
    )

    return len(ids)


def search_chunks(query, top_k=3):
    query_embedding = model.encode(query).tolist()

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
        include=["documents", "metadatas", "distances"]
    )

    documents = results.get("documents", [])
    metadatas = results.get("metadatas", [])
    distances = results.get("distances", [])

    if not documents or not documents[0]:
        return []

    sources = []

    for i, doc in enumerate(documents[0]):
        metadata = metadatas[0][i] if metadatas and metadatas[0] else {}
        distance = distances[0][i] if distances and distances[0] else 0

        sources.append({
            "source_number": i + 1,
            "text": doc,
            "filename": metadata.get("filename", "Unknown"),
            "chunk_index": metadata.get("chunk_index", "Unknown"),
            "distance": float(distance)
        })

    return sources