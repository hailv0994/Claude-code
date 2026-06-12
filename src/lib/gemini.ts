const MODEL = 'gemini-1.5-flash';
const BASE = 'https://generativelanguage.googleapis.com/v1/models';

const EXTRACT_PROMPT = `Analyze this engineering drawing and extract ALL welding-related information.

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
}`;

async function fileToBase64(file: File): Promise<{ data: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const data = result.split(',')[1];
      resolve({ data, mimeType: file.type || 'image/png' });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function analyzeDrawing(
  apiKey: string,
  file: File,
  userHint = '',
): Promise<Record<string, unknown>> {
  const { data, mimeType } = await fileToBase64(file);
  const prompt = userHint ? `${EXTRACT_PROMPT}\n\nAdditional context: ${userHint}` : EXTRACT_PROMPT;

  const payload = {
    contents: [{
      parts: [
        { text: prompt },
        { inline_data: { mime_type: mimeType, data } },
      ],
    }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 1500 },
  };

  const res = await fetch(`${BASE}/${MODEL}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err?.error?.message || `Gemini API error ${res.status}`);
  }

  const json = await res.json();
  let text: string = json.candidates[0].content.parts[0].text.trim();
  text = text.replace(/^```json\s*/m, '').replace(/\s*```$/m, '');
  return JSON.parse(text);
}

export function mergeResults(comp: Record<string, unknown>, asm: Record<string, unknown>) {
  return {
    ...(comp as any),
    joint: (asm as any).joint || (comp as any).joint,
    welding_symbol: (asm as any).welding_symbol || (comp as any).welding_symbol,
    quality_requirements: (asm as any).quality_requirements || (comp as any).quality_requirements,
    description: `Component: ${(comp as any).description} | Assembly: ${(asm as any).description}`,
    warnings: [...((comp as any).warnings || []), ...((asm as any).warnings || [])],
  };
}
