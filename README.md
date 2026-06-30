# MathLens

AI-powered equation recognition that converts photos and PDFs of mathematical expressions into LaTeX.

- **Frontend:** Next.js + React + Tailwind CSS → [mathlens.npsolver.io](https://mathlens.npsolver.io)
- **Backend:** FastAPI + LangChain + Google Gemini on **AWS Lambda** → [api.mathlens.npsolver.io](https://api.mathlens.npsolver.io)

## Project structure

```
MathLens/
├── frontend/              # Next.js web app (Vercel)
└── backend/
    ├── app/               # FastAPI application
    ├── Dockerfile         # Lambda container image
    ├── lambda_handler.py  # Mangum ASGI adapter
    └── template.yaml      # AWS SAM deployment template
```

## Local development

### Prerequisites

- Node.js 18+
- Python 3.12+
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
3. You'll add this as `GOOGLE_API_KEY` on the Lambda function.

### 2. Backend on AWS Lambda

The backend runs as a **container-based Lambda function** behind **API Gateway HTTP API**, deployed with [AWS SAM](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html).

#### Prerequisites

- [AWS account](https://aws.amazon.com/)
- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) configured (`aws configure`)
- [SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (required to build the container image)

#### First deploy

```bash
cd backend
cp samconfig.toml.example samconfig.toml
# Edit samconfig.toml — set your AWS region and GoogleApiKey in parameter_overrides

sam build
sam deploy --guided
```

During `--guided` deploy, use these settings:

| Prompt | Value |
|--------|-------|
| Stack name | `mathlens-api` |
| AWS Region | e.g. `us-east-1` |
| Parameter `GoogleApiKey` | your Google AI Studio key |
| Confirm changes before deploy | `Y` |
| Allow SAM CLI IAM role creation | `Y` |
| Disable rollback | `N` |
| Save arguments to config file | `Y` |

After deploy, SAM prints the **ApiUrl** (e.g. `https://abc123.execute-api.us-east-1.amazonaws.com`).

Test it:

```bash
curl https://YOUR_API_URL/health
# {"status":"ok"}
```

#### Subsequent deploys

```bash
cd backend
sam build && sam deploy
```

#### Custom domain (`api.mathlens.npsolver.io`)

1. In **AWS Certificate Manager** (same region as API Gateway), request a certificate for `api.mathlens.npsolver.io`.
2. Validate via DNS — add the CNAME record ACM gives you in **Cloudflare DNS**.
3. In **API Gateway** → your HTTP API → **Custom domain names**, create `api.mathlens.npsolver.io` and map it to the `$default` stage.
4. API Gateway gives you a target domain (e.g. `d-abc123.execute-api.us-east-1.amazonaws.com`).
5. In **Cloudflare DNS**, add a **CNAME**: `api.mathlens` → that API Gateway target domain (DNS only / grey cloud).
6. Set `API_SERVICE_URL=https://api.mathlens.npsolver.io` in Vercel and redeploy the frontend.

#### Notes

- **Payload limit:** API Gateway caps request bodies at **10 MB** (matches `MAX_UPLOAD_SIZE_MB=10`).
- **Timeout:** Lambda timeout is set to **120 seconds** for Gemini API calls.
- **Memory:** 1024 MB — increase in `template.yaml` if conversions are slow.
- **Costs:** Lambda free tier covers ~1M requests/month; you pay for API Gateway and ECR storage after that.

### 3. Frontend on Vercel

1. Import the GitHub repo in [Vercel](https://vercel.com).
2. Set **Root Directory** to `frontend`.
3. Add environment variable:
   - `API_SERVICE_URL` = `https://api.mathlens.npsolver.io` (or your API Gateway URL before custom domain is set)
4. Deploy.

### 4. Custom domain for frontend (Cloudflare + Vercel)

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

Health check endpoint.

## Environment variables

| Variable | Service | Description |
|----------|---------|-------------|
| `GOOGLE_API_KEY` | Backend (Lambda) | Google AI Studio API key |
| `GEMINI_MODEL` | Backend (Lambda) | Gemini model (default: `gemini-2.5-flash`) |
| `CORS_ORIGINS` | Backend (Lambda) | Comma-separated allowed frontend origins |
| `MAX_UPLOAD_SIZE_MB` | Backend (Lambda) | Max upload size (default: 10) |
| `API_SERVICE_URL` | Frontend | Backend URL (set in Vercel + `next.config.ts`) |
