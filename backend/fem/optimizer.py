"""
Inverse optimization: find welding parameters that meet quality targets.
Uses Nelder-Mead simplex method with the FEM solver as objective function.
"""
import numpy as np
from scipy.optimize import minimize
from .solver import WeldThermalFEM2D, THERMAL_PROPS

EFFICIENCY = {'GMAW': 0.8, 'SMAW': 0.8, 'GTAW': 0.6, 'FCAW': 0.8, 'SAW': 1.0}

CURRENT_BOUNDS = {
    'GMAW': (80, 400), 'SMAW': (60, 320),
    'GTAW': (30, 250), 'FCAW': (100, 450), 'SAW': (200, 1000),
}
VOLTAGE_FORMULA = {
    'GMAW': lambda I: 0.04*I + 14,
    'SMAW': lambda I: 0.04*I + 16,
    'GTAW': lambda I: 0.02*I + 10,
    'FCAW': lambda I: 0.04*I + 16,
    'SAW':  lambda I: 0.025*I + 22,
}

def optimize_parameters(
    material_type: str,
    plate_thickness: float,   # mm
    plate_width: float,       # mm
    process: str,
    preheat_temp: float,      # °C
    targets: dict,            # {haz_width_max, fusion_depth_min, peak_temp_max}
    max_current: float = None,
) -> dict:
    """
    Find optimal (current, travel_speed) minimizing cost function:
      cost = w1*(haz_excess)² + w2*(fusion_deficit)² + w3*(heat_input penalty)
    """
    eff = EFFICIENCY.get(process, 0.8)
    i_min, i_max = CURRENT_BOUNDS.get(process, (80, 400))
    if max_current:
        i_max = min(i_max, max_current)

    haz_target = targets.get('haz_width_max', plate_thickness * 0.8)
    fz_target  = targets.get('fusion_depth_min', plate_thickness * 0.4)
    peak_max   = targets.get('peak_temp_max', 1600)

    results_cache = []

    def objective(params):
        current = float(np.clip(params[0], i_min, i_max))
        speed   = float(np.clip(params[1], 50, 800))  # mm/min
        voltage = VOLTAGE_FORMULA[process](current)

        fem = WeldThermalFEM2D(material_type, plate_width, plate_thickness, nx=40, ny=30)
        res = fem.run(current, voltage, speed, eff, preheat_temp,
                      t_total=20.0, dt_factor=0.35)
        m = res['metrics']

        haz  = m['haz_width_mm']
        fz_d = m['fusion_depth_mm']
        peak = m['peak_temp_C']

        # Penalty: HAZ too wide
        p_haz = max(0, haz - haz_target) ** 2 * 10
        # Penalty: not enough penetration
        p_fz  = max(0, fz_target - fz_d) ** 2 * 20
        # Penalty: overheating
        p_peak = max(0, peak - peak_max) ** 2 * 0.001
        # Regularisation: prefer lower heat input
        hi = (current * voltage * 60 * eff) / (speed * 1000)
        p_hi = hi * 0.5

        cost = p_haz + p_fz + p_peak + p_hi
        results_cache.append({
            'current': round(current), 'voltage': round(voltage, 1),
            'travel_speed': round(speed), 'cost': round(cost, 4),
            'haz_width_mm': round(haz, 2), 'fusion_depth_mm': round(fz_d, 2),
            'peak_temp': round(peak, 1),
        })
        return cost

    # Initial guess: mid-range
    x0 = [
        (i_min + i_max) / 2,
        200.0,
    ]
    bounds = [(i_min, i_max), (50, 800)]

    result = minimize(
        objective, x0, method='Nelder-Mead',
        options={'maxiter': 60, 'xatol': 5, 'fatol': 0.01}
    )

    best_current = float(np.clip(result.x[0], i_min, i_max))
    best_speed   = float(np.clip(result.x[1], 50, 800))
    best_voltage = VOLTAGE_FORMULA[process](best_current)

    # Run final FEM with best params
    fem = WeldThermalFEM2D(material_type, plate_width, plate_thickness, nx=60, ny=40)
    final_res = fem.run(best_current, best_voltage, best_speed, eff, preheat_temp)

    hi = (best_current * best_voltage * 60 * eff) / (best_speed * 1000)

    return {
        'optimal_params': {
            'current': round(best_current),
            'voltage': round(best_voltage, 1),
            'travel_speed': round(best_speed),
            'heat_input_kJ_mm': round(hi, 3),
        },
        'fem_result': final_res,
        'iterations': len(results_cache),
        'converged': result.success,
    }
