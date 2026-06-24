# NeoGen AI Studio

Ultra-fast AI SaaS platform for ecommerce content, SEO automation, product enrichment, CSV processing, AI chat, and knowledge workflows.

## Stack

- Next.js 15 App Router
- React Server Components
- TypeScript strict mode
- Tailwind CSS
- Groq streaming API
- Supabase-ready data layer
- FastAPI worker with Polars for large CSV jobs

## Run Locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

Set `GROQ_API_KEY` before using AI chat or generator modules.

## FastAPI Worker

```bash
cd services/fastapi-worker
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Vercel Deployment

1. Import the repository in Vercel.
2. Set environment variables from `.env.example`.
3. Deploy with the default Next.js preset.
4. Deploy `services/fastapi-worker` separately for large CSV and future image jobs.

## Modules

- Dashboard
- AI Chat
- Content Studio
- SEO Studio
- Product Studio
- CSV Processor
- Image Studio architecture
- Prompt Library
- Knowledge Base
- Analytics
- Settings
