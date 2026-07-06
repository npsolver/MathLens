# MathLens

## Project structure

```
MathLens/
├── frontend/                        # Next.js web app
│   └── src/
│       ├── app/                     # Pages and layout
│       ├── components/              # Upload, camera, LaTeX preview
│       └── lib/                     # API client (calls backend)
└── backend/
    ├── app/
    │   ├── main.py                  # FastAPI routes
    │   ├── errors.py                # Gemini / LangChain error mapping
    │   └── services/
    │       └── latex_extractor.py   # LangChain + Gemini vision integration
    ├── requirements.txt             # langchain-core, langchain-google-genai
    ├── Dockerfile                   # Lambda container image
    ├── lambda_handler.py            # Mangum ASGI adapter
    └── template.yaml                # AWS SAM deployment template
```

## Deployment

### Frontend

- **Where:** [Vercel](https://vercel.com) → [mathlens.npsolver.io](https://mathlens.npsolver.io)
- **How:** Import repo in Vercel with root directory `frontend`
- **DNS:** Cloudflare CNAME `mathlens` → `cname.vercel-dns.com`
- **Env:** `API_SERVICE_URL=https://api.mathlens.npsolver.io`

### Backend (FastAPI)

- **Where:** AWS Lambda (container image) behind API Gateway HTTP API → [api.mathlens.npsolver.io](https://api.mathlens.npsolver.io)
- **How:** AWS SAM (`sam build && sam deploy`) from `backend/`
- **DNS:** ACM certificate + API Gateway custom domain + Cloudflare CNAME `api.mathlens` → API Gateway target domain

### LangChain + Gemini

- **Where:** LangChain runs inside the backend Lambda (`backend/app/services/latex_extractor.py`); it is not deployed as a separate service
- **How:** `langchain-google-genai` calls Google Gemini (vision) via `ChatGoogleGenerativeAI` and `HumanMessage` (text prompt + base64 image)
- **Model:** Google Gemini (`GEMINI_MODEL`, default `gemini-2.5-flash`) via [Google AI Studio](https://aistudio.google.com)
- **Credentials:** `GOOGLE_API_KEY` set as a Lambda environment variable in `backend/template.yaml`
