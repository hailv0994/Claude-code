"""
Claude Vision API — analyze engineering drawing images to extract welding info.
"""
import anthropic
import base64
import re
from pathlib import Path

client = anthropic.Anthropic()

SYSTEM_PROMPT = """You are an expert welding engineer analyzing technical engineering drawings.
Extract welding-related information precisely. Always respond in valid JSON only, no markdown.
"""

EXTRACT_PROMPT = """Analyze this engineering drawing and extract ALL welding-related information.

Return ONLY a JSON object with this exact structure (use null for missing values):
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

def encode_image(image_bytes: bytes, mime_type: str) -> str:
    return base64.standard_b64encode(image_bytes).decode('utf-8')

def analyze_drawing(image_bytes: bytes, mime_type: str, user_hint: str = "") -> dict:
    """
    Send drawing image to Claude Vision and extract welding parameters.
    """
    b64 = encode_image(image_bytes, mime_type)

    prompt = EXTRACT_PROMPT
    if user_hint:
        prompt += f"\n\nAdditional context from user: {user_hint}"

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1500,
        system=SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": mime_type,
                            "data": b64,
                        },
                    },
                    {"type": "text", "text": prompt},
                ],
            }
        ],
    )

    import json
    text = message.content[0].text.strip()
    # Remove markdown code blocks if present
    text = re.sub(r'^```json\s*', '', text)
    text = re.sub(r'\s*```$', '', text)
    return json.loads(text)


def merge_drawing_results(component_result: dict, assembly_result: dict) -> dict:
    """
    Merge info from component drawing + assembly drawing.
    Assembly drawing takes priority for joint/welding info.
    Component drawing takes priority for material/dimensions.
    """
    merged = {
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
        'sources': {
            'component': component_result,
            'assembly': assembly_result,
        }
    }
    return merged
