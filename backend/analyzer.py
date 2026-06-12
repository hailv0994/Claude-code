"""
Google Gemini Vision — tự động detect model available với key của user.
"""
import os, re, json, base64, httpx

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
BASE = "https://generativelanguage.googleapis.com/v1beta"
_cached_model: str | None = None

EXTRACT_PROMPT = """Analyze this engineering drawing and extract ALL welding-related information.

Return ONLY a JSON object with this exact structure (use null for missing values, no markdown):
{
  "material": {
    "grade": "e.g. SS400, A36, SUS304",
    "type": "carbon_steel | low_alloy | stainless_austenitic | aluminum",
    "thickness_mm": 12,
    "confidence": "high | medium | low"
  },
  "joint": {
    "type": "butt | fillet | T_joint | corner | lap",
    "groove_type": "V | bevel | U | J | square | none",
    "groove_angle_deg": 60,
    "root_opening_mm": 2,
    "root_face_mm": 2,
    "fillet_size_mm": null,
    "position": "1G | 2G | 3G | 4G | 1F | 2F | 3F | 4F",
    "backing": "none | steel | ceramic | flux | gas"
  },
  "welding_symbol": {
    "process_code": "131 | 135 | 111 | 141 | 121",
    "process_name": "GMAW | SMAW | GTAW | FCAW | SAW",
    "weld_size_mm": null,
    "weld_length_mm": null,
    "all_around": false,
    "field_weld": false
  },
  "dimensions": {
    "part_width_mm": null,
    "part_length_mm": null,
    "other_notes": ""
  },
  "quality_requirements": {
    "standard": "AWS D1.1 | ISO 5817 | ASME IX | JIS",
    "acceptance_level": "B | C | D",
    "inspection": []
  },
  "description": "Brief summary of what you see in the drawing",
  "warnings": ["list any ambiguous or missing info"]
}
"""


def _get_model() -> str:
    """Tự động chọn model Gemini vision đầu tiên available với key hiện tại."""
    global _cached_model
    if _cached_model:
        return _cached_model

    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY chưa được thiết lập. Chạy: GEMINI_API_KEY=your_key uvicorn main:app --port 8000")

    r = httpx.get(f"{BASE}/models", params={"key": GEMINI_API_KEY}, timeout=15)
    r.raise_for_status()
    models = r.json().get("models", [])

    # Ưu tiên: flash models hỗ trợ generateContent
    preferred = ["flash", "pro"]
    for priority in preferred:
        for m in models:
            name = m.get("name", "")
            methods = m.get("supportedGenerationMethods", [])
            if priority in name and "generateContent" in methods:
                model_id = name.split("/")[-1]
                _cached_model = model_id
                print(f"[Gemini] Dùng model: {model_id}")
                return model_id

    raise RuntimeError("Không tìm thấy model Gemini nào hỗ trợ generateContent với key này.")


def analyze_drawing(image_bytes: bytes, mime_type: str, user_hint: str = "") -> dict:
    model = _get_model()
    url = f"{BASE}/models/{model}:generateContent"
    b64 = base64.standard_b64encode(image_bytes).decode()
    prompt = EXTRACT_PROMPT + (f"\n\nAdditional context: {user_hint}" if user_hint else "")

    payload = {
        "contents": [{"parts": [
            {"text": prompt},
            {"inline_data": {"mime_type": mime_type, "data": b64}},
        ]}],
        "generationConfig": {"temperature": 0.1, "maxOutputTokens": 1500},
    }

    resp = httpx.post(url, params={"key": GEMINI_API_KEY}, json=payload, timeout=60)
    resp.raise_for_status()
    text = resp.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
    text = re.sub(r'^```json\s*', '', text)
    text = re.sub(r'\s*```$', '', text)
    return json.loads(text)


def merge_drawing_results(component_result: dict, assembly_result: dict) -> dict:
    return {
        'material': component_result.get('material') or assembly_result.get('material'),
        'joint': assembly_result.get('joint') or component_result.get('joint'),
        'welding_symbol': assembly_result.get('welding_symbol') or component_result.get('welding_symbol'),
        'dimensions': {
            **(component_result.get('dimensions') or {}),
            **(assembly_result.get('dimensions') or {}),
        },
        'quality_requirements': (
            assembly_result.get('quality_requirements') or
            component_result.get('quality_requirements')
        ),
        'description': (
            f"Component: {component_result.get('description', '')} | "
            f"Assembly: {assembly_result.get('description', '')}"
        ),
        'warnings': (
            (component_result.get('warnings') or []) +
            (assembly_result.get('warnings') or [])
        ),
        'sources': {'component': component_result, 'assembly': assembly_result},
    }
