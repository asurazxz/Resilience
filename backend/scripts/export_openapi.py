import json
from pathlib import Path

from backend.app.main import app

output = Path(__file__).parents[2] / "contracts" / "openapi" / "openapi.json"
output.write_text(json.dumps(app.openapi(), indent=2) + "\n", encoding="utf-8")
print(output)
