"use client";

import { useState, useRef, useEffect } from "react";

type Source = {
  source_number: number;
  text: string;
  filename: string;
  chunk_index: number;
};

type Message = {
  role: "user" | "ai";
  text: string;
  sources?: Source[];
  error?: boolean;
};

type UploadedDoc = {
  name: string;
};

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [question, setQuestion] = useState("");
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const uploadPdf = async () => {
    if (!file) {
      setUploadError("Please select a PDF first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    setUploadError("");
    setUploadMessage("");

    try {
      const res = await fetch("http://127.0.0.1:8000/upload-pdf/", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Server error ${res.status}`);
      }

      const data = await res.json();
      setUploadMessage(data.message);
      setUploadedDocs((prev) => {
        if (prev.some((d) => d.name === file.name)) return prev;
        return [...prev, { name: file.name }];
      });
      setFile(null);
    } catch (err) {
      setUploadError(
        err instanceof Error
          ? err.message
          : "Upload failed. Is the backend running?"
      );
    } finally {
      setLoading(false);
    }
  };

  const askQuestion = async (customQuestion?: string) => {
    const userQuestion = customQuestion || question;
    if (!userQuestion.trim()) return;

    setMessages((prev) => [...prev, { role: "user", text: userQuestion }]);
    setHistory((prev) =>
      prev.includes(userQuestion) ? prev : [userQuestion, ...prev]
    );
    setQuestion("");
    setLoading(true);

    try {
      let url = `http://127.0.0.1:8000/ask/?query=${encodeURIComponent(userQuestion)}`;
      if (selectedDoc) {
        url += `&filename=${encodeURIComponent(selectedDoc)}`;
      }

      const res = await fetch(url);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Server error ${res.status}`);
      }

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: data.answer, sources: data.sources || [] },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text:
            err instanceof Error
              ? err.message
              : "Something went wrong. Please try again.",
          error: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const removeDoc = (name: string) => {
    setUploadedDocs((prev) => prev.filter((d) => d.name !== name));
    if (selectedDoc === name) setSelectedDoc(null);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white px-6 py-8">
      <section className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <p className="text-indigo-300 font-medium mb-2">
            RAG-Based AI Document Assistant
          </p>
          <h1 className="text-4xl md:text-5xl font-bold">
            AI-Powered Document Intelligence Platform
          </h1>
          <p className="text-slate-300 mt-3">
            Upload PDFs, ask questions, view answer sources, and track chat
            history.
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="bg-white/10 border border-white/20 rounded-2xl p-6 shadow-xl h-fit space-y-6">
            {/* Upload */}
            <div>
              <h2 className="text-2xl font-semibold mb-4">Upload Document</h2>

              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => {
                  setFile(e.target.files?.[0] || null);
                  setUploadError("");
                  setUploadMessage("");
                }}
                className="w-full bg-white text-slate-900 rounded-lg p-3 mb-4"
              />

              <button
                onClick={uploadPdf}
                disabled={loading || !file}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 transition px-6 py-3 rounded-lg font-semibold"
              >
                {loading ? "Processing..." : "Upload PDF"}
              </button>

              {file && (
                <div className="mt-4 bg-slate-950/50 border border-white/10 p-3 rounded-lg">
                  <p className="text-sm text-slate-300">Selected File</p>
                  <p className="font-medium break-words">{file.name}</p>
                </div>
              )}

              {uploadMessage && (
                <div className="mt-4 bg-green-500/20 text-green-300 border border-green-500/30 p-3 rounded-lg text-sm">
                  {uploadMessage}
                </div>
              )}

              {uploadError && (
                <div className="mt-4 bg-red-500/20 text-red-300 border border-red-500/30 p-3 rounded-lg text-sm">
                  {uploadError}
                </div>
              )}
            </div>

            {/* Document Library */}
            {uploadedDocs.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Documents</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedDoc(null)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition border ${
                      selectedDoc === null
                        ? "bg-indigo-600/40 border-indigo-500/50 text-white"
                        : "bg-slate-950/40 border-white/10 text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    All Documents ({uploadedDocs.length})
                  </button>

                  {uploadedDocs.map((doc) => (
                    <div
                      key={doc.name}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition ${
                        selectedDoc === doc.name
                          ? "bg-indigo-600/40 border-indigo-500/50"
                          : "bg-slate-950/40 border-white/10"
                      }`}
                    >
                      <button
                        onClick={() => setSelectedDoc(doc.name)}
                        className="flex-1 text-left text-sm truncate"
                        title={doc.name}
                      >
                        {doc.name}
                      </button>
                      <button
                        onClick={() => removeDoc(doc.name)}
                        className="text-slate-400 hover:text-red-400 transition text-xs shrink-0"
                        title="Remove"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Chat History */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Chat History</h3>
              {history.length === 0 ? (
                <p className="text-slate-400 text-sm">No questions yet.</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {history.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => askQuestion(item)}
                      className="w-full text-left bg-slate-950/50 hover:bg-slate-800 border border-white/10 p-3 rounded-lg text-sm transition"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Chat Panel */}
          <div className="lg:col-span-3 bg-white/10 border border-white/20 rounded-2xl shadow-xl overflow-hidden">
            <div className="border-b border-white/20 p-5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Document Chat</h2>
                <p className="text-slate-300 text-sm mt-1">
                  {selectedDoc
                    ? `Querying: ${selectedDoc}`
                    : uploadedDocs.length > 0
                    ? `Querying all ${uploadedDocs.length} document(s)`
                    : "Upload a PDF to get started."}
                </p>
              </div>

              {messages.length > 0 && (
                <button
                  onClick={() => setMessages([])}
                  className="text-sm text-slate-400 hover:text-white border border-white/10 px-3 py-1.5 rounded-lg transition"
                >
                  Clear chat
                </button>
              )}
            </div>

            <div className="h-[480px] overflow-y-auto p-5 space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-slate-400 mt-32">
                  Upload a PDF and start asking questions.
                </div>
              )}

              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-5 py-3 leading-relaxed ${
                      msg.role === "user"
                        ? "bg-indigo-600 text-white rounded-br-none"
                        : msg.error
                        ? "bg-red-500/20 text-red-300 border border-red-500/30 rounded-bl-none"
                        : "bg-slate-950/80 text-slate-100 border border-white/10 rounded-bl-none"
                    }`}
                  >
                    <p className="text-sm font-semibold mb-1">
                      {msg.role === "user" ? "You" : msg.error ? "Error" : "AI"}
                    </p>

                    <p>{msg.text}</p>

                    {msg.role === "ai" && !msg.error && msg.sources && msg.sources.length > 0 && (
                      <div className="mt-4 border-t border-white/10 pt-3">
                        <p className="text-sm font-semibold text-indigo-300 mb-2">
                          Sources Used
                        </p>
                        <div className="space-y-2">
                          {msg.sources.map((source) => (
                            <details
                              key={source.source_number}
                              className="bg-white/5 border border-white/10 rounded-lg p-3"
                            >
                              <summary className="cursor-pointer text-sm text-slate-200">
                                Source {source.source_number} —{" "}
                                {source.filename} | Chunk {source.chunk_index}
                              </summary>
                              <p className="text-sm text-slate-300 mt-3 whitespace-pre-wrap">
                                {source.text}
                              </p>
                            </details>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-slate-950/80 border border-white/10 rounded-2xl rounded-bl-none px-5 py-3 text-slate-300">
                    AI is thinking...
                  </div>
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>

            <div className="border-t border-white/20 p-5 flex gap-3">
              <input
                type="text"
                placeholder={
                  uploadedDocs.length === 0
                    ? "Upload a document first..."
                    : "Ask something about the document..."
                }
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !loading) askQuestion();
                }}
                disabled={uploadedDocs.length === 0 || loading}
                className="flex-1 bg-white text-slate-900 rounded-lg p-3 outline-none disabled:opacity-50"
              />

              <button
                onClick={() => askQuestion()}
                disabled={loading || uploadedDocs.length === 0}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 transition px-6 py-3 rounded-lg font-semibold"
              >
                Ask
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
