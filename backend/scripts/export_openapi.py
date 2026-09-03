"""Write the live application's OpenAPI document to contracts/openapi.

Run from anywhere:

    .venv313/Scripts/python.exe backend/scripts/export_openapi.py
"""

import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT))

from backend.app.main import app  # noqa: E402

output = REPO_ROOT / "contracts" / "openapi" / "openapi.json"
output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(json.dumps(app.openapi(), indent=2) + "\n", encoding="utf-8")
print(output)
