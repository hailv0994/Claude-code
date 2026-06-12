"""
Google Gemini Vision — gọi REST API trực tiếp, không cần SDK.
Free tier: 15 req/phút, 1500 req/ngày (gemini-1.5-flash)
"""
import os
import re
import json
import base64
import httpx

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
MODEL = "gemini-1.5-flash"
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent"

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


def _mime_to_gemini(mime: str) -> str:
    mapping = {
        "image/jpeg": "image/jpeg",
        "image/jpg":  "image/jpeg",
        "image/png":  "image/png",
        "image/webp": "image/webp",
        "image/gif":  "image/gif",
    }
    return mapping.get(mime.lower(), "image/png")


def analyze_drawing(image_bytes: bytes, mime_type: str, user_hint: str = "") -> dict:
    """Gửi ảnh bản vẽ lên Gemini Vision và trả về thông số hàn dưới dạng JSON."""
    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY chưa được thiết lập trong môi trường.")

    b64 = base64.standard_b64encode(image_bytes).decode()
    prompt = EXTRACT_PROMPT
    if user_hint:
        prompt += f"\n\nAdditional context from user: {user_hint}"

    payload = {
        "contents": [{
            "parts": [
                {"text": prompt},
                {"inline_data": {"mime_type": _mime_to_gemini(mime_type), "data": b64}},
            ]
        }],
        "generationConfig": {"temperature": 0.1, "maxOutputTokens": 1500},
    }

    resp = httpx.post(
        GEMINI_URL,
        params={"key": GEMINI_API_KEY},
        json=payload,
        timeout=60,
    )
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
