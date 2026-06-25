from __future__ import annotations

import asyncio
import base64
import os
from io import BytesIO
from typing import Any

import polars as pl
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from huggingface_hub import InferenceClient
from pydantic import BaseModel


app = FastAPI(
    title="NeoGen AI Studio Worker",
    version="0.1.0",
    description="Async microservice for large CSV jobs, validation, and future image queues.",
)

_raw = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
_allowed_origins = [o.strip() for o in _raw.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class CsvPreview(BaseModel):
    filename: str
    rows: int
    columns: list[str]
    sample: list[dict[str, Any]]
    missing_required_fields: list[str]


class ImageGenerateRequest(BaseModel):
    prompt: str
    negative_prompt: str = ""
    width: int = 1024
    height: int = 1024
    num_inference_steps: int = 28
    model: str = "black-forest-labs/FLUX.2-dev"
    provider: str = "fal-ai"
    guidance_scale: float = 3.5


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/generate-image")
async def generate_image(req: ImageGenerateRequest) -> dict[str, str]:
    hf_token = os.getenv("HF_TOKEN") or os.getenv("HUGGINGFACE_API_KEY")
    if not hf_token:
        raise HTTPException(status_code=500, detail="HF_TOKEN or HUGGINGFACE_API_KEY not configured")

    def _run() -> str:
        client = InferenceClient(provider=req.provider, api_key=hf_token)
        image = client.text_to_image(
            req.prompt,
            model=req.model,
            width=req.width,
            height=req.height,
            num_inference_steps=req.num_inference_steps,
            negative_prompt=req.negative_prompt or None,
            guidance_scale=req.guidance_scale,
        )
        buf = BytesIO()
        image.save(buf, format="PNG")
        return base64.b64encode(buf.getvalue()).decode()

    b64 = await asyncio.get_event_loop().run_in_executor(None, _run)
    return {"url": f"data:image/png;base64,{b64}", "model": req.model, "provider": req.provider}


@app.post("/csv/preview", response_model=CsvPreview)
async def preview_csv(file: UploadFile = File(...)) -> CsvPreview:
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Upload a CSV file.")

    raw = await file.read()
    try:
        frame = pl.read_csv(BytesIO(raw), infer_schema_length=500)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Could not parse CSV.") from exc

    required = {"sku", "title", "description"}
    normalized = {column.strip().lower() for column in frame.columns}

    return CsvPreview(
        filename=file.filename,
        rows=frame.height,
        columns=frame.columns,
        sample=frame.head(50).to_dicts(),
        missing_required_fields=sorted(required - normalized),
    )


@app.post("/csv/export/shopify")
async def export_shopify(file: UploadFile = File(...)) -> dict[str, Any]:
    raw = await file.read()
    frame = pl.read_csv(BytesIO(raw), infer_schema_length=500)

    # Keep original shape and add generated columns only when absent.
    additions = {
        "SEO Title": "",
        "SEO Description": "",
        "Google Shopping / Product Category": "",
        "Google Shopping / Custom Product": "FALSE",
    }
    for column, default in additions.items():
        if column not in frame.columns:
            frame = frame.with_columns(pl.lit(default).alias(column))

    return {
        "rows": frame.height,
        "columns": frame.columns,
        "message": "Shopify export frame prepared.",
    }
