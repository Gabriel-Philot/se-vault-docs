import re
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlmodel.ext.asyncio.session import AsyncSession

from ..database import get_session

router = APIRouter()

BLOCKED_KEYWORDS = [
    "INSERT",
    "UPDATE",
    "DELETE",
    "DROP",
    "TRUNCATE",
    "ALTER",
    "CREATE",
    "GRANT",
    "REVOKE",
    "EXEC",
    "EXECUTE",
    "CALL",
]

MAX_ROWS = 100


class SQLRequest(BaseModel):
    query: str


class SQLResponse(BaseModel):
    columns: list[str]
    rows: list[list[Any]]
    row_count: int


def validate_read_only_query(query: str) -> None:
    normalized = re.sub(r"\s+", " ", query.strip()).upper()

    if not normalized.startswith("SELECT"):
        raise HTTPException(
            status_code=403,
            detail="Only SELECT queries are allowed",
        )

    for keyword in BLOCKED_KEYWORDS:
        pattern = rf"\b{keyword}\b"
        if re.search(pattern, normalized):
            raise HTTPException(
                status_code=403,
                detail=f"Query contains forbidden keyword: {keyword}",
            )


@router.post("", response_model=SQLResponse)
async def execute_sql(
    request: SQLRequest,
    session: AsyncSession = Depends(get_session),
):
    validate_read_only_query(request.query)

    try:
        limited_query = f"SELECT * FROM ({request.query.rstrip(';')}) AS _subquery LIMIT {MAX_ROWS + 1}"
        result = await session.execute(text(limited_query))

        columns = list(result.keys()) if result.returns_rows else []
        raw_rows = result.fetchall() if result.returns_rows else []

        rows = [list(row) for row in raw_rows[:MAX_ROWS]]
        row_count = len(rows)

        return SQLResponse(columns=columns, rows=rows, row_count=row_count)

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"SQL execution error: {str(e)}",
        )
