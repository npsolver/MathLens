# MathLens

AI-powered equation recognition that converts photos and PDFs of mathematical expressions into LaTeX.

- **Frontend:** Next.js + React + Tailwind CSS → [mathlens.npsolver.io](https://mathlens.npsolver.io)
- **Backend:** FastAPI + LangChain + Google Gemini → [api.mathlens.npsolver.io](https://api.mathlens.npsolver.io)

## Project structure

```
MathLens/
├── frontend/          # Next.js web app (Vercel)
├── backend/           # FastAPI service (Render)
└── render.yaml        # Render deployment blueprint
```

## Local development

### Prerequisites

- Node.js 18+
- Python 3.11+
- A [Google AI Studio](https://aistudio.google.com/apikey) API key

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env        # add your GOOGLE_API_KEY (backend only — never put this in the frontend)
uvicorn app.main:app --reload --port 8000
```

The API key lives in `backend/.env` only. If you see `GOOGLE_API_KEY environment variable is not set` in the browser, that message comes from the backend — restart the backend after editing `.env`.
```

API docs: http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local   # set API_SERVICE_URL=http://localhost:8000
npm run dev
```

App: http://localhost:3000

## Deployment

### 1. Google AI Studio API key

1. Go to [Google AI Studio](https://aistudio.google.com/apikey).
2. Create an API key.
3. You'll add this as `GOOGLE_API_KEY` on Render.

### 2. Backend on Render

1. Push this repo to GitHub.
2. In [Render](https://render.com), create a **New Blueprint** and connect the repo (uses `render.yaml`), **or** create a **Web Service** manually:
   - **Root directory:** `backend`
   - **Build command:** `pip install -r requirements.txt`
   - **Start command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. Add environment variables:
   - `GOOGLE_API_KEY` — your Google AI Studio key
   - `CORS_ORIGINS` — `https://mathlens.npsolver.io,http://localhost:3000`
   - `GEMINI_MODEL` — `gemini-2.0-flash` (optional)
4. After deploy, note the Render URL (e.g. `https://mathlens-api.onrender.com`).

### 3. Custom domain for API (Cloudflare + Render)

1. In Render → your service → **Settings → Custom Domains**, add `api.mathlens.npsolver.io`.
2. Render gives you a CNAME target.
3. In **Cloudflare DNS** for `npsolver.io`:
   - Add a **CNAME** record: `api.mathlens` → Render's CNAME target
   - Set proxy status to **DNS only** (grey cloud) if Render requires it for SSL verification.
4. Wait for SSL to provision on Render.

### 4. Frontend on Vercel

1. Import the GitHub repo in [Vercel](https://vercel.com).
2. Set **Root Directory** to `frontend`.
3. Add environment variable:
   - `API_SERVICE_URL` = `https://api.mathlens.npsolver.io`
4. Deploy.

### 5. Custom domain for frontend (Cloudflare + Vercel)

1. In Vercel → Project → **Settings → Domains**, add `mathlens.npsolver.io`.
2. Vercel shows the required DNS record (usually CNAME to `cname.vercel-dns.com`).
3. In **Cloudflare DNS**:
   - Add **CNAME**: `mathlens` → `cname.vercel-dns.com`
4. In Vercel, confirm the domain is verified.

## How it works

1. User uploads a JPEG, PNG, WebP, or PDF (first page) — or captures a photo from their camera.
2. The frontend sends the file to `POST /api/convert` on the backend.
3. PDFs are rendered to an image; images are normalized to PNG.
4. LangChain calls **Google Gemini** (vision) with a prompt to extract LaTeX.
5. The frontend displays the raw LaTeX and renders a KaTeX preview.

## API

### `POST /api/convert`

**Request:** `multipart/form-data` with a `file` field (JPEG, PNG, WebP, or PDF).

**Response:**

```json
{ "latex": "\\int_0^1 x^2 \\, dx = \\frac{1}{3}" }
```

### `GET /health`

Health check for Render.

## Environment variables

| Variable | Service | Description |
|----------|---------|-------------|
| `GOOGLE_API_KEY` | Backend | Google AI Studio API key |
| `GEMINI_MODEL` | Backend | Gemini model (default: `gemini-2.5-flash`) |
| `CORS_ORIGINS` | Backend | Comma-separated allowed frontend origins |
| `MAX_UPLOAD_SIZE_MB` | Backend | Max upload size (default: 10) |
| `API_SERVICE_URL` | Frontend | Backend URL (set in Vercel + `next.config.ts`) |
