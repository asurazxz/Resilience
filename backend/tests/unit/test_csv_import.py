from backend.app.features.foundation_input.csv_import import parse_csv_preview


def test_csv_preview_parses_exact_cents() -> None:
    content = (
        b"week_start,record_type,source,category,description,amount_sgd\n"
        b"2026-08-31,earning,grab,,,680.25\n"
    )

    result = parse_csv_preview("input.csv", content)

    assert result.valid_count == 1
    assert result.rows[0].amount_cents == 68025


def test_csv_preview_reports_row_errors_without_persisting() -> None:
    content = (
        b"week_start,record_type,source,category,description,amount_sgd\n"
        b"2026-09-01,variable_work_cost,,unknown,,12.999\n"
    )

    result = parse_csv_preview("input.csv", content)

    assert result.invalid_count == 1
    assert "week_start must be a Monday" in result.rows[0].errors
    assert "category is not a supported variable work cost" in result.rows[0].errors
