# NeoGen AI Studio Architecture

NeoGen AI Studio is optimized as a thin, fast Next.js control plane with async workers for heavy data and image workloads.

## Runtime Boundaries

- Next.js App Router: server-rendered UI, SEO metadata, dashboard, studios, and API orchestration.
- Edge API route: low-latency Groq streaming for chat and generators.
- FastAPI worker: Polars CSV jobs, bulk generation orchestration, future image queues.
- Supabase PostgreSQL: users, projects, prompts, generated content, jobs, templates, chat history, settings, logs.
- Cloudinary / Supabase Storage: product images, generated media, CSV exports, attachments.

## Performance Rules

- Keep routes server-rendered by default.
- Use client components only for interactive islands.
- Stream AI tokens immediately.
- Move large CSV jobs to FastAPI.
- Avoid local image models in the Vercel runtime.
- Lazy-load future heavy modules.
- Cache static route data and metadata.

## Database Tables

- users
- projects
- prompts
- generated_content
- jobs
- templates
- chat_history
- settings
- audit_logs
- usage_metrics

## Security

- JWT authentication through Supabase Auth or an enterprise identity provider.
- Role-based access at API and database policy layers.
- Rate limit AI and CSV routes.
- Store provider keys in encrypted environment variables.
- Persist audit logs for exports, generation, login, and settings changes.

## Deployment

- Deploy the Next.js app to Vercel.
- Set `GROQ_API_KEY` and Supabase variables in Vercel environment settings.
- Deploy FastAPI worker to Render, Fly.io, Railway, or another container host.
- Set `FASTAPI_WORKER_URL` in Vercel when the worker is deployed.
