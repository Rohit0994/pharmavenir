# Week 2 — RAG Backend (FastAPI + ChromaDB + Gemini)

**Goal:** Build a Python backend that answers user questions about the PharmAvenir website using Retrieval-Augmented Generation (RAG), and connect a chat widget on the website to it.

**Status at end of Week 2:** Chatbot works end-to-end **locally** on your PC.
Backend = `http://localhost:8000`. Website = `http://localhost:5500`.

---

## 0. Concepts You Learned

| Term | Plain-English meaning |
|---|---|
| **RAG** (Retrieval-Augmented Generation) | Instead of asking the LLM blindly, first *search* your own content for relevant snippets, then hand those snippets + the question to the LLM. The LLM grounds its answer in *your* data. |
| **Embedding** | A numeric vector (here: 384 numbers) that represents the *meaning* of a piece of text. Two texts about similar topics produce similar vectors. |
| **Vector database** | A database that stores embeddings and can quickly find the K vectors closest to a query vector. We use **ChromaDB** (local, free, file-based). |
| **Chunking** | Splitting long text into ~500-token pieces (with overlap) so each piece fits the LLM's context and stays focused on one topic. |
| **System prompt** | The instructions you prepend to every LLM call ("You are PharmAvenir's assistant...answer only from context..."). Controls behavior. |
| **CORS** | Browser security rule: a webpage at origin A may NOT call an API at origin B unless B explicitly allows A. Solved by `CORSMiddleware` in FastAPI. |
| **Virtual environment (venv)** | An isolated per-project Python installation. Keeps each project's package versions independent. |
| **`.env` file** | A plain-text file holding secrets (API keys). Loaded at runtime by `python-dotenv`. **Never** committed to git. |

**The RAG flow in one picture:**

```
User question
      │
      ▼
[1] Embed the question  ──► 384-dim vector
      │
      ▼
[2] ChromaDB search     ──► top 4 most-similar chunks
      │
      ▼
[3] Build prompt: system_instructions + chunks + question
      │
      ▼
[4] Send to Gemini      ──► natural-language answer
      │
      ▼
Return {answer, sources} as JSON
```

---

## 1. Project Layout Created

`C:\Users\RohitSharma\OneDrive - pharmaand GmbH\Rohit\AI Work\rag-backend\`

```
rag-backend/
├── .env                       ← Gemini API key (NEVER commit)
├── .gitignore                 ← Excludes .env, venv, chroma_db, __pycache__
├── extract_content.py         ← Reads HTML → writes content/data.json
├── build_db.py                ← Chunks + embeds + saves to chroma_db/
├── rag_engine.py              ← Search + Gemini answer
├── main.py                    ← FastAPI server (POST /ask)
├── content/
│   └── data.json              ← Generated content source
├── chroma_db/                 ← Generated vector store (binary)
└── venv/                      ← Python virtual environment (local only)
```

---

## 2. One-Time Setup Commands

```powershell
# Create + activate virtual environment
cd "C:\Users\RohitSharma\OneDrive - pharmaand GmbH\Rohit\AI Work\rag-backend"
python -m venv venv
.\venv\Scripts\Activate.ps1     # prompt now starts with (venv)

# Install all packages
pip install fastapi uvicorn google-generativeai chromadb sentence-transformers `
            langchain langchain-community langchain-text-splitters `
            python-dotenv beautifulsoup4
```

### What each package does

| Package | Purpose |
|---|---|
| `fastapi` | Web framework (defines `/ask` endpoint) |
| `uvicorn` | The actual web server that runs FastAPI |
| `google-generativeai` | Official Gemini API client |
| `chromadb` | Local vector database |
| `sentence-transformers` | Free HuggingFace embedding model `all-MiniLM-L6-v2` (runs on CPU) |
| `langchain-text-splitters` | `RecursiveCharacterTextSplitter` for chunking |
| `python-dotenv` | Loads `.env` into `os.environ` |
| `beautifulsoup4` | HTML → plain text extraction |

> **Gotcha #1:** In LangChain v0.2+, `from langchain.text_splitter import ...` was removed.  
> Correct import: `from langchain_text_splitters import RecursiveCharacterTextSplitter`.

---

## 3. The `.env` File

Path: `rag-backend\.env`

```
GEMINI_API_KEY=AIzaSy...your-actual-key...
```

Rules:
- No quotes around the value.
- No spaces around `=`.
- File is already in `.gitignore`.

Get the key from <https://aistudio.google.com> → "Get API Key".

---

## 4. The Five Python Files (purpose only)

| File | When you run it | What it produces |
|---|---|---|
| `extract_content.py` | Whenever website HTML changes | `content/data.json` with one entry per page (`page`, `url`, `title`, `content`) |
| `build_db.py` | After every `data.json` change | `chroma_db/` folder with embedded chunks |
| `rag_engine.py` | For CLI testing OR imported by `main.py` | Function `ask(question) -> {answer, sources}` |
| `main.py` | Always running while users chat | HTTP server on port 8000 with `POST /ask` |

### Three-step run order

```powershell
python extract_content.py     # 1. HTML  -> data.json
python build_db.py            # 2. data.json -> chroma_db/
uvicorn main:app --reload     # 3. Start API server (Ctrl+C to stop)
```

---

## 5. The Gemini Model Choice

```python
GEMINI_MODEL = "gemini-flash-latest"   # always points to current free Flash model
```

> **Gotcha #2:** Hard-coding `gemini-1.5-flash` breaks when Google retires that ID.  
> Use the `-latest` alias OR list available models programmatically:
> ```python
> for m in genai.list_models():
>     if "generateContent" in m.supported_generation_methods:
>         print(m.name)
> ```

---

## 6. The Chatbot Widget (Front-End)

File: `PharmaAvenir\js\chatbot.js`

- Pure vanilla JavaScript (no frameworks).
- Injects floating green 💬 bubble + popup chat window on every page.
- Posts `{question}` to `BACKEND_URL + "/ask"`.
- Renders answer + clickable source links.

Activated on every page by adding **one line** before `</body>`:

```html
<script src="js/chatbot.js"></script>
```

PowerShell one-liner to add it to all pages at once (idempotent):

```powershell
$dir = "C:\Users\RohitSharma\OneDrive - pharmaand GmbH\Rohit\AI Work\PharmaAvenir"
$tag = '<script src="js/chatbot.js"></script>'
Get-ChildItem "$dir\*.html" | ForEach-Object {
  $c = Get-Content $_.FullName -Raw
  if ($c -notmatch 'js/chatbot\.js') {
    $new = $c -replace '</body>', "$tag`r`n</body>"
    Set-Content -Path $_.FullName -Value $new -NoNewline
  }
}
```

The `BACKEND_URL` constant at the top of `chatbot.js`:
- **Local testing:** `"http://localhost:8000"`
- **After Render deploy (Week 3):** `"https://pharmavenir-backend.onrender.com"` (your URL will differ)

---

## 7. Local Testing Procedure

You need **TWO** terminals running simultaneously.

### Terminal 1 — Backend
```powershell
cd "C:\Users\RohitSharma\OneDrive - pharmaand GmbH\Rohit\AI Work\rag-backend"
.\venv\Scripts\Activate.ps1
uvicorn main:app --reload
```
Wait for: `INFO: Application startup complete.`

### Terminal 2 — Website (must be served via HTTP, not file://)
```powershell
cd "C:\Users\RohitSharma\OneDrive - pharmaand GmbH\Rohit\AI Work\PharmaAvenir"
python -m http.server 5500
```
Then open <http://localhost:5500/index.html> in your browser.

Click the green 💬 bubble and ask a question. ✅

> **Gotcha #3 — "Failed to fetch":**
> If you double-click `index.html` (opens as `file:///...`), the browser blocks API calls due to CORS. Always serve the site through `python -m http.server` during local testing.

---

## 8. Quick API Tests

| What | URL | Expected |
|---|---|---|
| Health | <http://localhost:8000/> | `{"status":"ok",...}` |
| Swagger UI | <http://localhost:8000/docs> | Interactive form for `/ask` |
| Direct call | POST `http://localhost:8000/ask` body `{"question":"..."}` | `{"answer":"...","sources":[...]}` |

---

## 9. Iterating on Content

When you change website HTML or want to refresh the chatbot's knowledge:

```powershell
cd "C:\Users\RohitSharma\OneDrive - pharmaand GmbH\Rohit\AI Work\rag-backend"
.\venv\Scripts\Activate.ps1
python extract_content.py     # re-extract from PharmAvenir/*.html
python build_db.py            # re-embed everything (wipes old chroma_db)
# uvicorn auto-reloads with --reload, no need to restart
```

---

## 10. Bugs Hit During Week 2 — and Their Fixes

| Symptom | Root cause | Fix |
|---|---|---|
| `ModuleNotFoundError: No module named 'langchain.text_splitter'` | LangChain v0.2 split into sub-packages | `pip install langchain-text-splitters`; change import to `from langchain_text_splitters import RecursiveCharacterTextSplitter` |
| `404 models/gemini-1.5-flash is not found` | Google deprecated that exact model ID | Use `"gemini-flash-latest"` |
| `Failed to fetch` (browser console: CORS error) | Page opened as `file:///...` | Serve the site via `python -m http.server 5500` and open via `http://localhost:5500` |
| `404 /favicon.ico` in uvicorn logs | Browser auto-requests favicon; we don't serve one | **Ignore** — harmless |
| `(venv)` not in prompt | Activation script wasn't run | `.\venv\Scripts\Activate.ps1` (not just `venv\Scripts\activate`) |

---

## 11. Week 2 Done ✅ — Next Up: Week 3

**Week 3 — Deploy backend to Render.com (free tier):**
1. `pip freeze > requirements.txt`
2. Push `rag-backend/` to a new GitHub repo (without `.env`!)
3. Render → New Web Service → connect repo
4. Build command: `pip install -r requirements.txt && python build_db.py`
5. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Add `GEMINI_API_KEY` in Render's Environment Variables panel
7. Get public URL like `https://pharmavenir-backend.onrender.com`
8. Update `BACKEND_URL` in `js/chatbot.js`
9. Push website changes → GitHub Pages auto-deploys → chatbot works live for the world 🌍

> **Heads-up about Render free tier:** the service sleeps after 15 minutes of inactivity.  
> The first request after sleep takes ~30–60 seconds to wake up — the chatbot will appear to hang. Subsequent requests are fast.
