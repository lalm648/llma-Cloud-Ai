from __future__ import annotations

from io import BytesIO
from typing import Any

import polars as pl
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


app = FastAPI(
    title="NeoGen AI Studio Worker",
    version="0.1.0",
    description="Async microservice for large CSV jobs, validation, and future image queues.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
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


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


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
