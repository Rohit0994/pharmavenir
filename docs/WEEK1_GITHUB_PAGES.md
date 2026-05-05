# Week 1 — PharmAvenir Website + GitHub Pages Deployment

**Goal:** Build a static company website and host it for free on GitHub Pages so the world can visit it at a public URL.

**Final live URL:** https://rohit0994.github.io/pharmavenir/  
**GitHub repo:** https://github.com/Rohit0994/pharmavenir

---

## 0. Concepts You Learned

| Term | Meaning |
|---|---|
| **Repository (repo)** | A project folder tracked by git. |
| **Commit** | A snapshot of your files at a moment in time, with a message. |
| **Branch** | A parallel version of your code; `main` is the default. |
| **Push** | Upload your local commits to GitHub. |
| **Remote** | A server-hosted copy of the repo (GitHub). `origin` is the standard nickname. |
| **GitHub Pages** | Free static website hosting from any public GitHub repo. |
| **.gitignore** | A file listing which files/folders git should NEVER track (secrets, junk, build output). |

**Mental model of git workflow:**

```
Local folder  →  git add  →  Staging area  →  git commit  →  Local history  →  git push  →  GitHub (remote)
```

---

## 1. Tools Installed

| Tool | Purpose | Source |
|---|---|---|
| **VS Code** | Code editor | https://code.visualstudio.com |
| **Git** | Version control | https://git-scm.com (or `winget install --id Git.Git -e --source winget`) |

Verify:
```powershell
git --version
```

---

## 2. Accounts Created

| Account | Purpose |
|---|---|
| **GitHub** | Host code + free website hosting via Pages |
| Google AI Studio | (Week 2) Free Gemini API key |
| Render.com | (Week 3) Free Python backend hosting |

---

## 3. Website Folder Structure

Location: `C:\Users\RohitSharma\OneDrive - pharmaand GmbH\Rohit\AI Work\PharmaAvenir`

```
PharmaAvenir/
├── index.html              ← Home (hero, why-choose-us, therapeutic areas, testimonials)
├── about.html              ← Story, mission, vision, values, leadership, CSR
├── products.html           ← 12 categories, 60+ products, top-10 table, QA standards
├── services.html           ← 9 services + 6-step B2B process
├── faqs.html               ← 25 FAQs
├── contact.html            ← 6 support channels, contact form, 6 offices
├── blog.html               ← 9 articles for SEO + chatbot training
├── careers.html            ← Benefits, 12 roles, hiring process
├── privacy.html            ← GDPR-style privacy policy
├── terms.html              ← Terms of service
├── chatbot-knowledge.html  ← Consolidated KB for the chatbot
├── styles.css              ← Shared stylesheet (responsive, green/blue branding)
├── README.txt              ← File guide
└── .gitignore              ← Tells git what to ignore
```

---

## 4. Git One-Time Configuration

Tells git who you are. Stamped on every commit.

```powershell
git config --global user.name  "Rohit Sharma"
git config --global user.email "your-email@example.com"
git config --global init.defaultBranch main
git config --global --list          # verify
```

---

## 5. The `.gitignore` File

Created in the project root to prevent secrets and junk from being uploaded.

```gitignore
# OS / editor junk
.DS_Store
Thumbs.db
desktop.ini
*.swp
*.bak
*.tmp

# VS Code
.vscode/

# Secrets — NEVER commit these
.env
*.env
.env.*

# Python (for the backend later)
__pycache__/
*.py[cod]
*.pyo
venv/
.venv/
env/
chroma_db/

# Node
node_modules/

# Logs
*.log
```

> **Critical rule:** `.env` files (which will hold the Gemini API key in Week 2) must NEVER be pushed to GitHub. This file enforces that.

---

## 6. GitHub Repository Created

1. https://github.com → top-right `+` → **New repository**
2. **Name:** `pharmavenir` (lowercase, no spaces)
3. **Visibility:** Public (required for free GitHub Pages)
4. **Do NOT** initialize with README, .gitignore, or license (must be empty for first push)
5. Copy the HTTPS URL: `https://github.com/Rohit0994/pharmavenir.git`

---

## 7. Push Workflow — Commands & What They Do

Run from inside the website folder.

| # | Command | What it does |
|---|---|---|
| 1 | `cd "C:\Users\RohitSharma\OneDrive - pharmaand GmbH\Rohit\AI Work\PharmaAvenir"` | Move into the project folder |
| 2 | `git init` | Create a hidden `.git` folder; turns this into a git repo (one-time) |
| 3 | `git status` | Show untracked / modified / staged files |
| 4 | `git add .` | Stage everything (respecting `.gitignore`) for the next commit |
| 5 | `git commit -m "Initial commit: PharmAvenir website"` | Save a snapshot in local history with a message |
| 6 | `git remote add origin https://github.com/Rohit0994/pharmavenir.git` | Tell git where to push |
| 7 | `git remote -v` | Verify the remote was added |
| 8 | `git branch -M main` | Rename current branch to `main` |
| 9 | `git push -u origin main` | Upload commits to GitHub. `-u` sets upstream so future pushes are just `git push` |

**First-time push:** A browser window opens for GitHub login → authorize **Git Credential Manager** → credentials are saved for future pushes.

---

## 8. Enable GitHub Pages

1. On the repo page → **Settings** tab
2. Left sidebar → **Pages**
3. **Source:** *Deploy from a branch*
4. **Branch:** `main`, folder `/ (root)` → **Save**
5. Wait 1–2 min → green box appears:  
   ✅ *Your site is live at https://rohit0994.github.io/pharmavenir/*

---

## 9. Daily Update Workflow (for future content edits)

After the first push, updating the live site is just three commands:

```powershell
git add .
git commit -m "Update: <describe what you changed>"
git push
```

GitHub Pages auto-rebuilds in ~30–60 seconds.

---

## 10. Important Rules to Remember

1. **Never push `.env`** — already protected by `.gitignore`.
2. **Re-run `build_db.py` every time `data.json` changes** (Week 2 onward).
3. **Render free tier sleeps after 15 min** of no traffic — first user request will be slow (~30s wake-up).
4. **Gemini free tier = 1500 requests/day** — plenty for testing.
5. **Folder is in OneDrive** — usually fine, but if git acts strange (file locks), move to `C:\Projects\PharmaAvenir`.

---

## 11. Week 1 Done ✅ — Next Up: Week 2

**Week 2 — Build the RAG Backend (FastAPI + ChromaDB + Gemini):**
- Create `rag-backend/` folder (separate from website)
- Python virtual environment + install packages
- `.env` for Gemini API key
- `content/data.json` — content source for both site and chatbot
- `build_db.py` — chunk + embed + store in ChromaDB
- `rag_engine.py` — search + ask Gemini
- `main.py` — FastAPI server with `POST /ask` endpoint
- Test locally at `http://localhost:8000`
