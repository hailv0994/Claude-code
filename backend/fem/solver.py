import numpy as np
from dataclasses import dataclass
from typing import Tuple

@dataclass
class ThermalProperties:
    density: float       # kg/m³
    conductivity: float  # W/(m·K)
    specific_heat: float # J/(kg·K)
    liquidus: float      # °C
    solidus: float       # °C
    ambient: float = 20.0

# Material thermal properties database
THERMAL_PROPS = {
    'carbon_steel': ThermalProperties(
        density=7850, conductivity=50, specific_heat=480,
        liquidus=1510, solidus=1470
    ),
    'low_alloy': ThermalProperties(
        density=7850, conductivity=42, specific_heat=500,
        liquidus=1500, solidus=1450
    ),
    'stainless_austenitic': ThermalProperties(
        density=7900, conductivity=16, specific_heat=500,
        liquidus=1450, solidus=1390
    ),
    'aluminum': ThermalProperties(
        density=2700, conductivity=167, specific_heat=896,
        liquidus=650, solidus=580
    ),
}

def goldak_heat_source(
    X: np.ndarray, Y: np.ndarray,
    xc: float, yc: float,
    af: float, ar: float, b: float, c: float,
    Q: float
) -> np.ndarray:
    """
    Goldak double-ellipsoid heat source (2D cross-section at weld midpoint).
    af, ar = front/rear semi-axes (m)
    b = width semi-axis (m)
    c = depth semi-axis (m)
    Q = net heat input (W)
    """
    ff = 0.6  # fraction front
    fr = 1.4  # fraction rear
    # At cross-section (x=xc), use larger of ff/fr averaged
    f = (ff + fr) / 2
    a = (af + ar) / 2
    prefactor = (6 * np.sqrt(3) * f * Q) / (np.pi * np.sqrt(np.pi) * a * b * c)
    dx = X - xc
    dy = Y - yc
    q = prefactor * np.exp(-3 * dx**2 / a**2 - 3 * dy**2 / b**2)
    return q


class WeldThermalFEM2D:
    """
    2D transient thermal FEM (finite difference) on cross-section plane.
    Models heat conduction through plate thickness and width during welding.
    """

    def __init__(
        self,
        material_type: str,
        plate_width: float,   # mm
        plate_thickness: float,  # mm
        nx: int = 60,
        ny: int = 40,
    ):
        props = THERMAL_PROPS.get(material_type, THERMAL_PROPS['carbon_steel'])
        self.props = props
        self.W = plate_width * 1e-3    # convert mm→m
        self.H = plate_thickness * 1e-3
        self.nx = nx
        self.ny = ny
        self.dx = self.W / nx
        self.dy = self.H / ny

        # Temperature field (ambient)
        self.T = np.full((ny, nx), props.ambient)
        self.T_peak = np.full((ny, nx), props.ambient)  # track peak temps

    def get_coords(self):
        x = np.linspace(0, self.W, self.nx)
        y = np.linspace(0, self.H, self.ny)
        return np.meshgrid(x, y)

    def run(
        self,
        current: float,        # A
        voltage: float,        # V
        travel_speed: float,   # mm/min
        process_efficiency: float,  # 0–1
        preheat_temp: float,   # °C
        t_total: float = None, # seconds to simulate (auto if None)
        dt_factor: float = 0.4,
    ) -> dict:
        """
        Run transient thermal simulation.
        Returns peak temperature field, HAZ zones, cooling data.
        """
        props = self.props
        dx, dy = self.dx, self.dy
        nx, ny = self.nx, self.ny
        W, H = self.W, self.H

        # Net heat input
        Q = current * voltage * process_efficiency  # W

        # Travel speed m/s
        v = travel_speed / 60 * 1e-3  # mm/min → m/s

        # Heat source parameters (Goldak)
        b_gs = min(H / 3, 3e-3)   # width semi-axis ≈ 3mm or H/3
        c_gs = min(H * 0.7, 8e-3) # depth semi-axis ≈ 70% of plate
        af = 2e-3                   # front semi-axis
        ar = 4e-3                   # rear semi-axis

        # Weld centre (top centre of cross-section)
        xc = W / 2
        yc = H  # surface

        # Time step (stability criterion)
        alpha = props.conductivity / (props.density * props.specific_heat)
        dt_stable = dt_factor * min(dx, dy)**2 / (4 * alpha)
        dt = min(dt_stable, 0.05)  # max 50ms

        # Total time: heat source passes + cooling to 300°C
        if t_total is None:
            # Time for heat source to traverse plate width
            pass_time = (W / v) if v > 0 else 5.0
            t_total = pass_time * 3  # include cooling

        T = np.full((ny, nx), preheat_temp)
        T_peak = T.copy()

        X, Y = self.get_coords()

        steps = int(t_total / dt)
        t = 0.0

        # Sample point for cooling curve (weld centerline, surface)
        ci = nx // 2
        cj = ny - 1
        cooling_times = []
        cooling_temps = []

        for step in range(min(steps, 2000)):  # cap at 2000 steps for speed
            t += dt

            # Heat source position (moving along x)
            xs = v * t
            if xs > W * 1.5:
                xs = W * 1.5  # past the plate

            # Compute heat source (only when over plate)
            Q_field = np.zeros((ny, nx))
            if 0 <= xs <= W * 1.2:
                Q_field = goldak_heat_source(X, Y, xc, yc, af, ar, b_gs, c_gs, Q)
                # Apply only near surface (top row)
                Q_field[:-ny//3, :] *= 0.1

            # Finite difference update (explicit)
            T_new = T.copy()
            k = props.conductivity
            rho_cp = props.density * props.specific_heat

            # Interior nodes
            d2Tdx2 = (np.roll(T, -1, axis=1) - 2*T + np.roll(T, 1, axis=1)) / dx**2
            d2Tdy2 = (np.roll(T, -1, axis=0) - 2*T + np.roll(T, 1, axis=0)) / dy**2

            T_new = T + dt * (k / rho_cp * (d2Tdx2 + d2Tdy2) + Q_field / rho_cp)

            # Boundary conditions: convection on all surfaces (h=15 W/m²K)
            h_conv = 15.0
            T_amb = props.ambient
            # Top surface (weld side)
            T_new[-1, :] = T[-1, :] + dt * (
                k / rho_cp * (T[-2, :] - T[-1, :]) / dy**2 * 2
                + Q_field[-1, :] / rho_cp
                - h_conv * (T[-1, :] - T_amb) / (rho_cp * dy)
            )
            # Bottom surface
            T_new[0, :] = T[0, :] + dt * (
                k / rho_cp * (T[1, :] - T[0, :]) / dy**2 * 2
                - h_conv * (T[0, :] - T_amb) / (rho_cp * dy)
            )
            # Left/right: adiabatic (symmetric or far field)
            T_new[:, 0] = T_new[:, 1]
            T_new[:, -1] = T_new[:, -2]

            # Cap at liquidus
            T_new = np.clip(T_new, T_amb - 10, props.liquidus + 200)

            T_peak = np.maximum(T_peak, T_new)
            T = T_new

            # Record cooling curve at weld centreline
            if step % 10 == 0:
                cooling_times.append(t)
                cooling_temps.append(float(T[cj, ci]))

        # Post-process zones
        T_liquidus = props.liquidus
        T_solidus = props.solidus
        T_ac3 = 900  # °C — austenitising (HAZ boundary)
        T_ac1 = 720  # °C — lower HAZ boundary

        fusion_zone = T_peak >= T_solidus
        haz_high = (T_peak >= T_ac3) & (T_peak < T_solidus)
        haz_low = (T_peak >= T_ac1) & (T_peak < T_ac3)
        base_metal = T_peak < T_ac1

        # HAZ width (mm) — at surface
        haz_mask_surface = (T_peak[-1, :] >= T_ac1)
        haz_width_mm = float(np.sum(haz_mask_surface) * dx * 1000)

        # Fusion width and depth (mm)
        fz_mask_surface = (T_peak[-1, :] >= T_solidus)
        fusion_width_mm = float(np.sum(fz_mask_surface) * dx * 1000)
        fz_mask_depth = (T_peak[:, nx//2] >= T_solidus)
        fusion_depth_mm = float(np.sum(fz_mask_depth) * dy * 1000)

        # Cooling rate t8/5 (time 800→500°C at centreline)
        ct = np.array(cooling_times)
        cT = np.array(cooling_temps)
        t800 = None; t500 = None
        for i in range(len(cT)-1):
            if cT[i] >= 800 > cT[i+1] and t800 is None:
                t800 = ct[i]
            if cT[i] >= 500 > cT[i+1] and t500 is None:
                t500 = ct[i]
        t85 = (t500 - t800) if (t800 and t500) else None

        # Peak temperature at centreline
        peak_temp = float(T_peak[cj, ci])

        return {
            'T_peak': T_peak.tolist(),
            'T_current': T.tolist(),
            'zones': {
                'fusion': fusion_zone.tolist(),
                'haz_high': haz_high.tolist(),
                'haz_low': haz_low.tolist(),
                'base_metal': base_metal.tolist(),
            },
            'metrics': {
                'haz_width_mm': round(haz_width_mm, 2),
                'fusion_width_mm': round(fusion_width_mm, 2),
                'fusion_depth_mm': round(fusion_depth_mm, 2),
                'peak_temp_C': round(peak_temp, 1),
                't85_seconds': round(t85, 1) if t85 else None,
                'cooling_curve': {
                    'time': [round(x, 2) for x in cooling_times[::5]],
                    'temp': [round(x, 1) for x in cooling_temps[::5]],
                },
            },
            'grid': {
                'nx': nx, 'ny': ny,
                'width_mm': float(W * 1000),
                'thickness_mm': float(H * 1000),
            }
        }
