"""
Nexus Triple Product Fusion Model — Multi-Platform Media Governance Simulation
With Formal Sentinel Observer Automaton

Domain: Media ecosystem platform health monitoring
State: x(t) = (E, N, τ) per platform
Fusion functional: Φ(x) = E·N·τ
Sentinel: Formal observer with (clear → watching → alert) transitions
"""

import numpy as np
from scipy.integrate import solve_ivp
from dataclasses import dataclass, field
from typing import Callable, Dict, List, Tuple
import matplotlib.pyplot as plt
from matplotlib.patches import Patch
import matplotlib.gridspec as gridspec


# ============================================================
# 1. PARAMETERS
# ============================================================

@dataclass
class NexusParams:
    """All model parameters for one platform instance."""
    # Decay
    beta_E: float = 0.15
    beta_N: float = 0.10
    beta_tau: float = 0.20
    # Control gains
    alpha_E: float = 0.8
    alpha_N: float = 1.0
    alpha_tau: float = 0.6
    # Bilinear coupling
    kappa_EN: float = 0.03
    kappa_Et: float = 0.04
    kappa_NE: float = 0.03
    kappa_Nt: float = 0.02
    kappa_tE: float = 0.04
    kappa_tN: float = 0.02
    # Saturation
    gamma_E: float = 0.015
    gamma_N: float = 0.010
    gamma_tau: float = 0.020
    # Thresholds
    C_Nexus: float = 8.0
    tau_min: float = 0.5
    E_max: float = 15.0


# ============================================================
# 2. DYNAMICS
# ============================================================

def nexus_rhs(t: float, x: np.ndarray, u_func: Callable, p: NexusParams) -> list:
    """Right-hand side of the Nexus ODE: ẋ = f(x, u)."""
    E, N, tau = x
    u_E, u_N, u_tau = u_func(t, x)

    dE = (-p.beta_E * E
          + p.alpha_E * u_E
          + p.kappa_EN * E * N
          + p.kappa_Et * E * tau
          - p.gamma_E * E**2)

    dN = (-p.beta_N * N
          + p.alpha_N * u_N
          + p.kappa_NE * E * N
          + p.kappa_Nt * N * tau
          - p.gamma_N * N**2)

    dtau = (-p.beta_tau * tau
            + p.alpha_tau * u_tau
            + p.kappa_tE * E * tau
            + p.kappa_tN * N * tau
            - p.gamma_tau * tau**2)

    return [dE, dN, dtau]


def triple_product(E: np.ndarray, N: np.ndarray, tau: np.ndarray) -> np.ndarray:
    return E * N * tau


def xi_function(E, N, tau, u_E, u_N, u_tau, p: NexusParams) -> float:
    """
    Ξ(x, u) from Theorem 3 (forward invariance condition).
    Φ̇ = Φ · Ξ(x, u). Fusion Mode is forward-invariant when Ξ ≥ 0 on the boundary.
    """
    if E <= 0 or N <= 0 or tau <= 0:
        return 0.0
    return (-(p.beta_E + p.beta_N + p.beta_tau)
            + p.alpha_E * u_E / E
            + p.alpha_N * u_N / N
            + p.alpha_tau * u_tau / tau
            + (p.kappa_EN + p.kappa_NE) * N
            + (p.kappa_Et + p.kappa_tE) * tau
            + (p.kappa_Nt + p.kappa_tN) * tau
            - p.gamma_E * E
            - p.gamma_N * N
            - p.gamma_tau * tau)


# ============================================================
# 3. FINITE-STATE ABSTRACTION (Section 13 of the paper)
# ============================================================

def mode_label(E: float, N: float, tau: float, p: NexusParams) -> str:
    """
    M(x) from the paper:
      Idle:     Φ = 0
      Build:    0 < Φ < C_Nexus, τ > τ_min, E < E_max
      Fusion:   Φ ≥ C_Nexus, τ > τ_min, E < E_max
      Collapse: τ ≤ τ_min or E ≥ E_max
    """
    Phi = E * N * tau
    if tau <= p.tau_min or E >= p.E_max:
        return "Collapse"
    if Phi <= 0:
        return "Idle"
    if Phi < p.C_Nexus:
        return "Build"
    return "Fusion"


# ============================================================
# 4. SENTINEL OBSERVER AUTOMATON
# ============================================================

@dataclass
class SentinelState:
    """
    Formal observer automaton.

    States: clear → watching → alert
    Transitions based on:
      - Φ proximity to C_Nexus
      - Rate of change of Φ (estimated via finite differences)
      - τ proximity to τ_min

    The Sentinel does NOT actuate — it only observes and classifies.
    Contracts:
      - If Φ drops below warn_ratio * C_Nexus, enter 'watching' within 1 step.
      - If Φ drops below alert_ratio * C_Nexus OR dΦ/dt < -alert_rate_threshold,
        enter 'alert' within 1 step.
      - If Φ > clear_ratio * C_Nexus AND dΦ/dt ≥ 0 for sustain_steps, return to 'clear'.
    """
    state: str = "clear"
    prev_Phi: float = 0.0
    stable_count: int = 0

    # Configurable thresholds
    warn_ratio: float = 1.3
    alert_ratio: float = 1.05
    clear_ratio: float = 1.5
    alert_rate_threshold: float = -0.5
    sustain_steps: int = 20

    # Logging
    history: List[str] = field(default_factory=list)
    transitions: List[Tuple[float, str, str]] = field(default_factory=list)

    def step(self, t: float, Phi: float, C_Nexus: float, dt: float) -> str:
        """Advance Sentinel by one observation. Returns current state."""
        if dt > 0:
            dPhi_dt = (Phi - self.prev_Phi) / dt
        else:
            dPhi_dt = 0.0

        old_state = self.state

        if self.state == "clear":
            if Phi < self.alert_ratio * C_Nexus or dPhi_dt < self.alert_rate_threshold:
                self.state = "alert"
                self.stable_count = 0
            elif Phi < self.warn_ratio * C_Nexus:
                self.state = "watching"
                self.stable_count = 0

        elif self.state == "watching":
            if Phi < self.alert_ratio * C_Nexus or dPhi_dt < self.alert_rate_threshold:
                self.state = "alert"
                self.stable_count = 0
            elif Phi > self.clear_ratio * C_Nexus and dPhi_dt >= 0:
                self.stable_count += 1
                if self.stable_count >= self.sustain_steps:
                    self.state = "clear"
                    self.stable_count = 0
            else:
                self.stable_count = 0

        elif self.state == "alert":
            if Phi > self.warn_ratio * C_Nexus and dPhi_dt >= 0:
                self.stable_count += 1
                if self.stable_count >= self.sustain_steps:
                    self.state = "watching"
                    self.stable_count = 0
            else:
                self.stable_count = 0

        if self.state != old_state:
            self.transitions.append((t, old_state, self.state))

        self.history.append(self.state)
        self.prev_Phi = Phi
        return self.state


# ============================================================
# 5. CONTROL POLICIES
# ============================================================

def adaptive_control(t: float, x: np.ndarray,
                     p: NexusParams,
                     sentinel_state: str,
                     u_max: float = 2.5) -> Tuple[float, float, float]:
    """
    Control policy that responds to Sentinel state.
    Maps the function stack (Stabilize/Boost/Lock) to control intensities.
    """
    E, N, tau = x

    if sentinel_state == "clear":
        return (0.3, 0.3, 0.3)

    elif sentinel_state == "watching":
        scores = {'E': E, 'N': N, 'tau': tau}
        weakest = min(scores, key=scores.get)
        u_E = 1.0 if weakest == 'E' else 0.5
        u_N = 1.0 if weakest == 'N' else 0.5
        u_tau = 1.0 if weakest == 'tau' else 0.5
        return (u_E, u_N, u_tau)

    else:  # alert
        return (u_max, u_max, u_max)


def constant_baseline(t: float, x: np.ndarray, level: float = 0.8):
    """Constant control for comparison."""
    return (level, level, level)


# ============================================================
# 6. SIMULATION ENGINE
# ============================================================

@dataclass
class SimResult:
    """Container for one platform's simulation output."""
    name: str
    t: np.ndarray
    E: np.ndarray
    N: np.ndarray
    tau: np.ndarray
    Phi: np.ndarray
    Xi: np.ndarray
    modes: List[str]
    sentinel: SentinelState
    controls: np.ndarray


def get_platforms() -> Dict[str, Tuple[list, NexusParams]]:
    """
    Each platform gets initial conditions and optionally modified parameters.
    """
    # X/Twitter: high decay, low initial health
    p_x = NexusParams(
        beta_E=0.25, beta_N=0.20, beta_tau=0.30,
        alpha_E=0.6, alpha_N=0.7, alpha_tau=0.4,
        kappa_EN=0.02, kappa_Et=0.03,
        kappa_NE=0.02, kappa_Nt=0.01,
        kappa_tE=0.03, kappa_tN=0.01,
        gamma_E=0.015, gamma_N=0.010, gamma_tau=0.020,
        C_Nexus=8.0, tau_min=0.5, E_max=15.0
    )

    # TikTok: high activity (N) but volatile stability
    p_tiktok = NexusParams(
        beta_E=0.18, beta_N=0.08, beta_tau=0.28,
        alpha_E=0.7, alpha_N=1.2, alpha_tau=0.5,
        kappa_EN=0.04, kappa_Et=0.03,
        kappa_NE=0.04, kappa_Nt=0.02,
        kappa_tE=0.03, kappa_tN=0.02,
        gamma_E=0.015, gamma_N=0.012, gamma_tau=0.025,
        C_Nexus=8.0, tau_min=0.5, E_max=15.0
    )

    return {
        'Netflix':   ([3.0, 2.5, 3.0], NexusParams()),
        'YouTube':   ([2.5, 3.0, 2.0], NexusParams()),
        'Meta':      ([2.0, 2.8, 1.8], NexusParams()),
        'TikTok':    ([1.5, 3.5, 1.2], p_tiktok),
        'X/Twitter': ([1.2, 1.5, 1.0], p_x),
    }


def run_platform(name: str,
                 x0: list,
                 params: NexusParams,
                 t_span: tuple = (0, 100),
                 n_points: int = 2000,
                 use_sentinel_control: bool = True) -> SimResult:
    """
    Run the full simulation for one platform:
    ODE integration + mode classification + Sentinel observer.
    """
    t_eval = np.linspace(t_span[0], t_span[1], n_points)
    sentinel = SentinelState()
    current_sentinel_state = ["clear"]

    def controlled_rhs(t, x):
        if use_sentinel_control:
            u = adaptive_control(t, x, params, current_sentinel_state[0])
        else:
            u = constant_baseline(t, x)
        return nexus_rhs(t, x, lambda t_, x_: u, params)

    sol = solve_ivp(
        controlled_rhs,
        t_span, x0,
        t_eval=t_eval,
        method='RK45',
        max_step=0.1,
        rtol=1e-8,
        atol=1e-10
    )

    E_arr = sol.y[0]
    N_arr = sol.y[1]
    tau_arr = sol.y[2]
    Phi_arr = triple_product(E_arr, N_arr, tau_arr)

    modes = []
    Xi_arr = np.zeros(len(sol.t))
    ctrl_arr = np.zeros((3, len(sol.t)))

    for i, t in enumerate(sol.t):
        E_i, N_i, tau_i = E_arr[i], N_arr[i], tau_arr[i]
        Phi_i = Phi_arr[i]

        dt = sol.t[i] - sol.t[i - 1] if i > 0 else 0.01
        s_state = sentinel.step(t, Phi_i, params.C_Nexus, dt)
        current_sentinel_state[0] = s_state

        modes.append(mode_label(E_i, N_i, tau_i, params))

        if use_sentinel_control:
            u = adaptive_control(t, np.array([E_i, N_i, tau_i]), params, s_state)
        else:
            u = constant_baseline(t, np.array([E_i, N_i, tau_i]))
        ctrl_arr[:, i] = u

        Xi_arr[i] = xi_function(E_i, N_i, tau_i, u[0], u[1], u[2], params)

    return SimResult(
        name=name, t=sol.t,
        E=E_arr, N=N_arr, tau=tau_arr,
        Phi=Phi_arr, Xi=Xi_arr,
        modes=modes, sentinel=sentinel,
        controls=ctrl_arr
    )


# ============================================================
# 7. VISUALIZATION
# ============================================================

MODE_COLORS = {
    'Idle': '#555555',
    'Build': '#f0ad4e',
    'Fusion': '#5cb85c',
    'Collapse': '#d9534f',
}

SENTINEL_COLORS = {
    'clear': '#5cb85c',
    'watching': '#f0ad4e',
    'alert': '#d9534f',
}

PLATFORM_COLORS = {
    'Netflix': '#E50914',
    'YouTube': '#FF0000',
    'Meta': '#1877F2',
    'TikTok': '#00F2EA',
    'X/Twitter': '#808080',
}


def plot_platform_detail(result: SimResult, params: NexusParams, save: bool = False):
    """Full diagnostic plot for a single platform."""
    fig = plt.figure(figsize=(16, 14))
    fig.suptitle(f'{result.name} — Nexus Fusion Diagnostic',
                 fontsize=16, fontweight='bold', y=0.98)
    gs = gridspec.GridSpec(5, 2, hspace=0.45, wspace=0.3,
                           height_ratios=[2, 2, 1.5, 1.5, 1])

    # --- Panel 1: State variables ---
    ax1 = fig.add_subplot(gs[0, :])
    ax1.plot(result.t, result.E, label='E (energy/health)', color='#2196F3', linewidth=1.5)
    ax1.plot(result.t, result.N, label='N (node density)', color='#4CAF50', linewidth=1.5)
    ax1.plot(result.t, result.tau, label='τ (stability margin)', color='#FF9800', linewidth=1.5)
    ax1.set_ylabel('State Variables')
    ax1.set_title('State Trajectories: E(t), N(t), τ(t)')
    ax1.legend(loc='upper right')
    ax1.grid(True, alpha=0.3)

    # --- Panel 2: Triple product + threshold ---
    ax2 = fig.add_subplot(gs[1, :], sharex=ax1)
    ax2.plot(result.t, result.Phi, label='Φ(x) = ENτ', color='#9C27B0', linewidth=2)
    ax2.axhline(y=params.C_Nexus, color='red', linestyle='--', linewidth=1.5,
                label=f'C_Nexus = {params.C_Nexus}')
    ax2.fill_between(result.t, params.C_Nexus, result.Phi,
                     where=result.Phi >= params.C_Nexus,
                     alpha=0.15, color='green', label='Fusion region')
    ax2.fill_between(result.t, 0, result.Phi,
                     where=result.Phi < params.C_Nexus,
                     alpha=0.10, color='red')
    ax2.set_ylabel('Φ(x)')
    ax2.set_title('Triple Product (Fusion Functional)')
    ax2.legend(loc='upper right')
    ax2.grid(True, alpha=0.3)

    # --- Panel 3: Xi (forward invariance diagnostic) ---
    ax3 = fig.add_subplot(gs[2, 0], sharex=ax1)
    ax3.plot(result.t, result.Xi, color='#607D8B', linewidth=1)
    ax3.axhline(y=0, color='red', linestyle='--', linewidth=1)
    ax3.fill_between(result.t, 0, result.Xi,
                     where=result.Xi >= 0, alpha=0.15, color='green')
    ax3.fill_between(result.t, result.Xi, 0,
                     where=result.Xi < 0, alpha=0.15, color='red')
    ax3.set_ylabel('Ξ(x, u)')
    ax3.set_title('Forward Invariance: Ξ ≥ 0 preserves Fusion')
    ax3.grid(True, alpha=0.3)

    # --- Panel 4: Control inputs ---
    ax4 = fig.add_subplot(gs[2, 1], sharex=ax1)
    ax4.plot(result.t, result.controls[0], label='u_E (Stabilize)',
             color='#2196F3', linewidth=1)
    ax4.plot(result.t, result.controls[1], label='u_N (Boost)',
             color='#4CAF50', linewidth=1)
    ax4.plot(result.t, result.controls[2], label='u_τ (Lock)',
             color='#FF9800', linewidth=1)
    ax4.set_ylabel('Control Intensity')
    ax4.set_title('Control Inputs (Function Stack)')
    ax4.legend(loc='upper right', fontsize=8)
    ax4.grid(True, alpha=0.3)

    # --- Panel 5: Mode timeline ---
    ax5 = fig.add_subplot(gs[3, :], sharex=ax1)
    for i in range(len(result.t) - 1):
        mode = result.modes[i]
        ax5.axvspan(result.t[i], result.t[i + 1],
                    color=MODE_COLORS.get(mode, 'gray'), alpha=0.6)
    mode_patches = [Patch(facecolor=c, label=m, alpha=0.6)
                    for m, c in MODE_COLORS.items()]
    ax5.legend(handles=mode_patches, loc='upper right', ncol=4, fontsize=9)
    ax5.set_ylabel('Mode')
    ax5.set_yticks([])
    ax5.set_title('Finite-State Abstraction: M(x(t))')

    # --- Panel 6: Sentinel state timeline ---
    ax6 = fig.add_subplot(gs[4, :], sharex=ax1)
    sentinel_history = result.sentinel.history
    for i in range(len(result.t) - 1):
        if i < len(sentinel_history):
            s = sentinel_history[i]
            ax6.axvspan(result.t[i], result.t[i + 1],
                        color=SENTINEL_COLORS.get(s, 'gray'), alpha=0.7)
    sentinel_patches = [Patch(facecolor=c, label=s, alpha=0.7)
                        for s, c in SENTINEL_COLORS.items()]
    ax6.legend(handles=sentinel_patches, loc='upper right', ncol=3, fontsize=9)
    ax6.set_ylabel('Sentinel')
    ax6.set_yticks([])
    ax6.set_xlabel('Time')
    ax6.set_title('Sentinel Observer State')

    plt.tight_layout()
    if save:
        fname = f'nexus_{result.name.lower().replace("/", "_")}_diagnostic.png'
        plt.savefig(fname, dpi=150, bbox_inches='tight')
        print(f"  Saved: {fname}")
    plt.show()


def plot_comparison(results: Dict[str, SimResult], save: bool = False):
    """Multi-platform comparison: Φ trajectories and final status."""
    fig, axes = plt.subplots(2, 1, figsize=(14, 9), height_ratios=[3, 1])
    fig.suptitle('Multi-Platform Fusion Comparison', fontsize=15, fontweight='bold')

    p_ref = NexusParams()

    for name, res in results.items():
        color = PLATFORM_COLORS.get(name, 'black')
        axes[0].plot(res.t, res.Phi, label=name, color=color, linewidth=2)

    axes[0].axhline(y=p_ref.C_Nexus, color='red', linestyle='--',
                    linewidth=1.5, label=f'C_Nexus = {p_ref.C_Nexus}')
    axes[0].set_ylabel('Φ(x) = ENτ')
    axes[0].set_title('Triple Product Trajectories')
    axes[0].legend(loc='upper left')
    axes[0].grid(True, alpha=0.3)

    names = list(results.keys())
    final_Phi = [results[n].Phi[-1] for n in names]
    colors = [PLATFORM_COLORS.get(n, 'black') for n in names]
    bars = axes[1].barh(names, final_Phi, color=colors, alpha=0.7, edgecolor='white')
    axes[1].axvline(x=p_ref.C_Nexus, color='red', linestyle='--', linewidth=1.5)
    axes[1].set_xlabel('Final Φ(x)')
    axes[1].set_title('Final Fusion Status (t = T)')

    for bar, phi in zip(bars, final_Phi):
        status = "FUSION" if phi >= p_ref.C_Nexus else "BUILD"
        axes[1].text(bar.get_width() + 0.3, bar.get_y() + bar.get_height() / 2,
                     f'{phi:.1f} ({status})', va='center', fontsize=10)

    plt.tight_layout()
    if save:
        plt.savefig('nexus_multi_platform_comparison.png', dpi=150, bbox_inches='tight')
        print("  Saved: nexus_multi_platform_comparison.png")
    plt.show()


def plot_phase_portrait(results: Dict[str, SimResult], save: bool = False):
    """E-N phase portrait with Φ = C_Nexus contour."""
    fig, ax = plt.subplots(1, 1, figsize=(10, 8))
    fig.suptitle('Phase Portrait: E vs N', fontsize=14, fontweight='bold')

    for name, res in results.items():
        color = PLATFORM_COLORS.get(name, 'black')
        ax.plot(res.E, res.N, color=color, linewidth=1.5, label=name)
        ax.scatter(res.E[0], res.N[0], color=color, s=80, zorder=5,
                   marker='o', edgecolors='white')
        ax.scatter(res.E[-1], res.N[-1], color=color, s=80, zorder=5,
                   marker='s', edgecolors='white')

    p_ref = NexusParams()
    tau_ref = 2.0
    E_range = np.linspace(0.1, 12, 200)
    N_contour = p_ref.C_Nexus / (E_range * tau_ref)
    valid = N_contour < 15
    ax.plot(E_range[valid], N_contour[valid], 'r--', linewidth=1.5,
            label=f'Φ = C_Nexus (τ = {tau_ref})', alpha=0.7)

    ax.set_xlabel('E (Platform Energy / Health)')
    ax.set_ylabel('N (Active Node Density)')
    ax.legend()
    ax.grid(True, alpha=0.3)
    ax.set_xlim(0, 12)
    ax.set_ylim(0, 12)

    if save:
        plt.savefig('nexus_phase_portrait.png', dpi=150, bbox_inches='tight')
        print("  Saved: nexus_phase_portrait.png")
    plt.show()


# ============================================================
# 8. CONSOLE REPORT
# ============================================================

def print_report(results: Dict[str, SimResult]):
    """Print a structured diagnostic report."""
    print("=" * 72)
    print("  NEXUS FUSION MODEL — MULTI-PLATFORM DIAGNOSTIC REPORT")
    print("=" * 72)

    platforms = get_platforms()

    for name, res in results.items():
        p = platforms[name][1]
        final_Phi = res.Phi[-1]
        final_mode = res.modes[-1]
        final_sentinel = res.sentinel.history[-1] if res.sentinel.history else "N/A"

        # Time to first fusion
        fusion_indices = [i for i, m in enumerate(res.modes) if m == "Fusion"]
        first_fusion = res.t[fusion_indices[0]] if fusion_indices else None
        time_in_fusion = len(fusion_indices) / len(res.modes) * 100

        # Xi violations near the fusion boundary
        near_boundary = [(res.t[i], res.Xi[i]) for i in range(len(res.t))
                         if abs(res.Phi[i] - p.C_Nexus) < 0.5]
        xi_violations = sum(1 for _, xi in near_boundary if xi < 0)
        xi_total = len(near_boundary)

        # Sentinel transition count
        n_transitions = len(res.sentinel.transitions)

        # Max and min Phi
        max_Phi = np.max(res.Phi)
        min_Phi = np.min(res.Phi)

        # Equilibrium estimate (average over last 10% of trajectory)
        tail = int(0.9 * len(res.t))
        E_eq = np.mean(res.E[tail:])
        N_eq = np.mean(res.N[tail:])
        tau_eq = np.mean(res.tau[tail:])
        Phi_eq = E_eq * N_eq * tau_eq

        print(f"\n{'─' * 72}")
        print(f"  Platform: {name}")
        print(f"{'─' * 72}")
        print(f"  Initial state:      E={res.E[0]:.2f}, N={res.N[0]:.2f}, τ={res.tau[0]:.2f}")
        print(f"  Final state:        E={res.E[-1]:.2f}, N={res.N[-1]:.2f}, τ={res.tau[-1]:.2f}")
        print(f"  Equilibrium est:    E≈{E_eq:.2f}, N≈{N_eq:.2f}, τ≈{tau_eq:.2f}")
        print(f"  Final Φ:            {final_Phi:.2f}  (C_Nexus = {p.C_Nexus})")
        print(f"  Equilibrium Φ:      {Phi_eq:.2f}")
        print(f"  Φ range:            [{min_Phi:.2f}, {max_Phi:.2f}]")
        print(f"  Final mode:         {final_mode}")
        print(f"  Final sentinel:     {final_sentinel}")
        if first_fusion is not None:
            print(f"  First fusion at:    t = {first_fusion:.1f}")
        else:
            print(f"  First fusion at:    *** NEVER REACHED ***")
        print(f"  Time in Fusion:     {time_in_fusion:.1f}%")
        print(f"  Ξ violations:       {xi_violations} / {xi_total} samples near boundary")
        print(f"  Sentinel changes:   {n_transitions}")

        if res.sentinel.transitions:
            print(f"  Sentinel log:")
            for t_trans, from_s, to_s in res.sentinel.transitions[:10]:
                print(f"    t={t_trans:6.1f}: {from_s} → {to_s}")
            if len(res.sentinel.transitions) > 10:
                print(f"    ... and {len(res.sentinel.transitions) - 10} more")


# ============================================================
# 9. MAIN
# ============================================================

def main():
    print("Running Nexus Fusion Simulation for all platforms...")

    platforms = get_platforms()
    results = {}

    for name, (x0, params) in platforms.items():
        print(f"\nSimulating {name}...")
        result = run_platform(name, x0, params, use_sentinel_control=True)
        results[name] = result
        print(f"  Completed: {len(result.t)} time steps")

    print("\n" + "=" * 72)
    print("  SIMULATION COMPLETE")
    print("=" * 72)

    # Print report
    print_report(results)

    # Generate plots
    print("\nGenerating visualizations...")
    plot_comparison(results, save=True)
    plot_phase_portrait(results, save=True)

    for name, res in results.items():
        p = platforms[name][1]
        plot_platform_detail(res, p, save=True)

    print("\nAll outputs saved. Check the workspace for PNG files and console output.")


if __name__ == "__main__":
    main()