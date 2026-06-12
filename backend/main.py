import os
import json
import asyncio
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional

from analyzer import analyze_drawing, merge_drawing_results
from fem.solver import WeldThermalFEM2D
from fem.optimizer import optimize_parameters

app = FastAPI(title="WeldCalc FEM API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Drawing Analysis ─────────────────────────────────────────────────────────

@app.post("/api/analyze")
async def analyze_drawings(
    component: UploadFile = File(...),
    assembly: Optional[UploadFile] = File(None),
    user_hint: str = Form(""),
):
    """Analyze uploaded drawings using Claude Vision."""
    try:
        comp_bytes = await component.read()
        comp_mime = component.content_type or "image/png"

        comp_result = analyze_drawing(comp_bytes, comp_mime, user_hint)

        if assembly and assembly.filename:
            asm_bytes = await assembly.read()
            asm_mime = assembly.content_type or "image/png"
            asm_result = analyze_drawing(asm_bytes, asm_mime, user_hint)
            merged = merge_drawing_results(comp_result, asm_result)
        else:
            merged = comp_result
            merged['sources'] = {'component': comp_result, 'assembly': None}

        return merged
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── FEM Simulation ───────────────────────────────────────────────────────────

class FEMRequest(BaseModel):
    material_type: str = "carbon_steel"
    plate_thickness: float = 12.0    # mm
    plate_width: float = 100.0       # mm
    current: float = 200.0           # A
    voltage: float = 22.0            # V
    travel_speed: float = 300.0      # mm/min
    process: str = "GMAW"
    preheat_temp: float = 20.0       # °C


PROCESS_EFF = {'GMAW': 0.8, 'SMAW': 0.8, 'GTAW': 0.6, 'FCAW': 0.8, 'SAW': 1.0}


@app.post("/api/fem/simulate")
async def run_fem_simulation(req: FEMRequest):
    """Run 2D transient thermal FEM simulation."""
    try:
        eff = PROCESS_EFF.get(req.process, 0.8)
        fem = WeldThermalFEM2D(
            req.material_type,
            req.plate_width,
            req.plate_thickness,
            nx=60, ny=40,
        )
        result = await asyncio.get_event_loop().run_in_executor(
            None,
            lambda: fem.run(
                req.current, req.voltage, req.travel_speed,
                eff, req.preheat_temp, t_total=25.0
            )
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── Parameter Optimization ───────────────────────────────────────────────────

class OptimizeRequest(BaseModel):
    material_type: str = "carbon_steel"
    plate_thickness: float = 12.0
    plate_width: float = 100.0
    process: str = "GMAW"
    preheat_temp: float = 20.0
    max_current: Optional[float] = None
    targets: dict = {
        "haz_width_max": 8.0,
        "fusion_depth_min": 4.0,
        "peak_temp_max": 1600,
    }


@app.post("/api/fem/optimize")
async def optimize_weld_params(req: OptimizeRequest):
    """Find optimal welding parameters via FEM inverse optimization."""
    try:
        result = await asyncio.get_event_loop().run_in_executor(
            None,
            lambda: optimize_parameters(
                req.material_type,
                req.plate_thickness,
                req.plate_width,
                req.process,
                req.preheat_temp,
                req.targets,
                req.max_current,
            )
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "2.0"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)
