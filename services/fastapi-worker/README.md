# NeoGen FastAPI Worker

Async microservice for workloads that should not run in the Vercel request path.

## Local Run

```bash
cd services/fastapi-worker
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Responsibilities

- Large CSV preview and validation with Polars
- Bulk enrichment job orchestration
- Future FLUX / ComfyUI cloud GPU queue
- Export preparation for Shopify, WooCommerce, and Magento

Keep the Next.js app focused on fast UI, auth, API streaming, and orchestration.
