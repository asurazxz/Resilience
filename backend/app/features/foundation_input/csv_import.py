import csv
import hashlib
import io
from datetime import date
from decimal import ROUND_HALF_UP, Decimal, InvalidOperation

from backend.app.features.foundation_input.schemas import CsvPreviewResponse, CsvPreviewRow

CSV_HEADERS = ["week_start", "record_type", "source", "category", "description", "amount_sgd"]
PLATFORMS = {"grab", "gojek", "tada", "deliveroo", "foodpanda", "lalamove", "other"}
VARIABLE_CATEGORIES = {
    "fuel",
    "charging",
    "tolls",
    "parking",
    "repairs",
    "platform_fees",
    "cpf",
    "other",
}


def parse_csv_preview(file_name: str, content: bytes) -> CsvPreviewResponse:
    if len(content) > 1_000_000:
        raise ValueError("CSV files must be 1 MB or smaller")
    try:
        text = content.decode("utf-8-sig")
    except UnicodeDecodeError as error:
        raise ValueError("CSV must be UTF-8 encoded") from error

    reader = csv.DictReader(io.StringIO(text))
    if reader.fieldnames != CSV_HEADERS:
        raise ValueError(f"CSV headers must be exactly: {', '.join(CSV_HEADERS)}")

    rows: list[CsvPreviewRow] = []
    for row_number, row in enumerate(reader, start=2):
        if row_number > 1001:
            raise ValueError("CSV files may contain at most 1,000 data rows")
        rows.append(_parse_row(row_number, row))

    valid_count = sum(row.status == "valid" for row in rows)
    return CsvPreviewResponse(
        file_name=file_name,
        file_sha256=hashlib.sha256(content).hexdigest(),
        rows=rows,
        valid_count=valid_count,
        invalid_count=len(rows) - valid_count,
    )


def _parse_row(row_number: int, row: dict[str, str | None]) -> CsvPreviewRow:
    errors: list[str] = []
    parsed_week: date | None = None
    amount_cents: int | None = None
    record_type = (row.get("record_type") or "").strip()
    source = (row.get("source") or "").strip().lower() or None
    category = (row.get("category") or "").strip().lower() or None
    description = (row.get("description") or "").strip() or None

    try:
        parsed_week = date.fromisoformat((row.get("week_start") or "").strip())
        if parsed_week.weekday() != 0:
            errors.append("week_start must be a Monday")
    except ValueError:
        errors.append("week_start must use YYYY-MM-DD")

    if record_type not in {"earning", "variable_work_cost"}:
        errors.append("record_type must be earning or variable_work_cost")
    elif record_type == "earning" and source not in PLATFORMS:
        errors.append("source is not a supported platform")
    elif record_type == "variable_work_cost":
        if category not in VARIABLE_CATEGORIES:
            errors.append("category is not a supported variable work cost")
        if not description:
            errors.append("description is required for variable work costs")

    try:
        amount = Decimal((row.get("amount_sgd") or "").strip())
        if amount < 0 or amount.as_tuple().exponent < -2:
            raise InvalidOperation
        amount_cents = int((amount * 100).quantize(Decimal("1"), rounding=ROUND_HALF_UP))
        if amount_cents > 100_000_000:
            errors.append("amount_sgd exceeds the S$1,000,000 prototype limit")
    except (InvalidOperation, ValueError):
        errors.append("amount_sgd must be a non-negative amount with at most two decimals")

    return CsvPreviewRow(
        row_number=row_number,
        status="invalid" if errors else "valid",
        week_start=parsed_week,
        record_type=record_type if record_type in {"earning", "variable_work_cost"} else None,
        source=source,
        category=category,
        description=description,
        amount_cents=amount_cents,
        errors=errors,
    )
