"""
Sovereign Lattice — Node Graph Loader & Topology Visualizer
Connects the 67-node CSV to the Nexus Fusion ODE model.
"""

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.collections import LineCollection
from dataclasses import dataclass
from typing import Dict, List, Tuple
import io

# ============================================================
# 1. LOAD AND PARSE NODE DATA
# ============================================================

CSV_DATA = """id,node_id,x,y,label,number,weight,guardian,triad,hexagram,type,dormant
0,C01,50.0,50.0,Nexus,0,1.0,Ouroboros,Alpha,I - Creative,central,false
1,P01,30.0,5.0,Rebirth,1,0.8,Phoenix,Alpha,II - Receptive,cluster,false
2,P02,42.99,12.5,Ignition,2,0.6,Phoenix,Alpha,III - Difficulty,cluster,false
3,P03,42.99,27.5,Ember,3,0.5,Phoenix,Alpha,IV - Youthful Folly,cluster,false
4,P04,30.0,35.0,Ascent,4,0.7,Phoenix,Beta,V - Waiting,cluster,false
5,P05,17.01,27.5,Corona,5,0.9,Phoenix,Beta,VI - Conflict,cluster,false
6,P06,17.01,12.5,Zenith,6,1.0,Phoenix,Beta,VII - Army,cluster,false
7,D01,75.0,8.0,Scale,7,0.7,Dragon,Gamma,VIII - Holding Together,cluster,false
8,D02,87.12,15.0,Fang,8,0.5,Dragon,Gamma,IX - Small Taming,cluster,false
9,D03,87.12,29.0,Coil,9,0.6,Dragon,Gamma,X - Treading,cluster,false
10,D04,75.0,36.0,Wing,10,0.8,Dragon,Delta,XI - Peace,cluster,false
11,D05,62.88,29.0,Breath,11,0.9,Dragon,Delta,XII - Standstill,cluster,false
12,D06,62.88,15.0,Crown,12,1.0,Dragon,Delta,XIII - Fellowship,cluster,false
13,L01,85.0,42.0,Mane,13,0.6,Lion,Epsilon,XIV - Great Possession,cluster,false
14,L02,96.26,48.5,Roar,14,0.5,Lion,Epsilon,XV - Modesty,cluster,false
15,L03,96.26,61.5,Stride,15,0.7,Lion,Epsilon,XVI - Enthusiasm,cluster,false
16,L04,85.0,68.0,Pride,16,0.8,Lion,Zeta,I - Creative,cluster,false
17,L05,73.74,61.5,Heart,17,0.9,Lion,Zeta,II - Receptive,cluster,false
18,L06,73.74,48.5,Throne,18,1.0,Lion,Zeta,III - Difficulty,cluster,false
19,R01,70.0,68.0,Feather,19,0.5,Raven,Eta,IV - Youthful Folly,cluster,false
20,R02,82.12,75.0,Eye,20,0.6,Raven,Eta,V - Waiting,cluster,false
21,R03,82.12,89.0,Call,21,0.7,Raven,Eta,VI - Conflict,cluster,false
22,R04,70.0,96.0,Shadow,22,0.8,Raven,Theta,VII - Army,cluster,false
23,R05,57.88,89.0,Flight,23,0.9,Raven,Theta,VIII - Holding Together,cluster,false
24,R06,57.88,75.0,Oracle,24,1.0,Raven,Theta,IX - Small Taming,cluster,false
25,B01,25.0,65.0,Cocoon,25,0.4,Butterfly,Iota,X - Treading,cluster,false
26,B02,36.26,71.5,Wing-Left,26,0.5,Butterfly,Iota,XI - Peace,cluster,false
27,B03,36.26,84.5,Wing-Right,27,0.6,Butterfly,Iota,XII - Standstill,cluster,false
28,B04,25.0,91.0,Spiral,28,0.7,Butterfly,Kappa,XIII - Fellowship,cluster,false
29,B05,13.74,84.5,Bloom,29,0.8,Butterfly,Kappa,XIV - Great Possession,cluster,false
30,B06,13.74,71.5,Luminance,30,1.0,Butterfly,Kappa,XV - Modesty,cluster,false
31,N01,80.0,50.0,Meridian,31,0.3,Phoenix,Lambda,XVI - Enthusiasm,generic,false
32,N02,87.42,56.6,Threshold,32,0.37,Dragon,Lambda,I - Creative,generic,false
33,N03,93.23,65.73,Echo,33,0.44,Lion,Lambda,II - Receptive,generic,false
34,N04,75.98,65.0,Pulse,34,0.51,Raven,Mu,III - Difficulty,generic,false
35,N05,79.11,74.43,Drift,35,0.58,Butterfly,Mu,IV - Youthful Folly,generic,false
36,N06,79.57,85.24,Veil,36,0.65,Ouroboros,Mu,V - Waiting,generic,false
37,N07,65.0,75.98,Arc,37,0.72,Phoenix,Nu,VI - Conflict,generic,false
38,N08,63.0,85.71,Fulcrum,38,0.79,Dragon,Nu,VII - Army,generic,true
39,N09,57.99,95.3,Shard,39,0.86,Lion,Nu,VIII - Holding Together,generic,false
40,N10,50.0,80.0,Ripple,40,0.93,Raven,Xi,IX - Small Taming,generic,false
41,N11,43.4,87.42,Gate,41,0.3,Butterfly,Xi,X - Treading,generic,false
42,N12,34.27,93.23,Sigil,42,0.37,Ouroboros,Xi,XI - Peace,generic,false
43,N13,35.0,75.98,Lattice,43,0.44,Phoenix,Omicron,XII - Standstill,generic,false
44,N14,25.57,79.11,Mirror,44,0.51,Dragon,Omicron,XIII - Fellowship,generic,false
45,N15,14.76,79.57,Prism,45,0.58,Lion,Omicron,XIV - Great Possession,generic,false
46,N16,24.02,65.0,Anchor,46,0.65,Raven,Pi,XV - Modesty,generic,true
47,N17,14.29,63.0,Tide,47,0.72,Butterfly,Pi,XVI - Enthusiasm,generic,false
48,N18,4.7,57.99,Spark,48,0.79,Ouroboros,Pi,I - Creative,generic,false
49,N19,20.0,50.0,Haze,49,0.86,Phoenix,Rho,II - Receptive,generic,false
50,N20,12.58,43.4,Crucible,50,0.93,Dragon,Rho,III - Difficulty,generic,false
51,N21,6.77,34.27,Thread,51,0.3,Lion,Rho,IV - Youthful Folly,generic,false
52,N22,24.02,35.0,Bloom,52,0.37,Raven,Sigma,V - Waiting,generic,false
53,N23,20.89,25.57,Fracture,53,0.44,Butterfly,Sigma,VI - Conflict,generic,false
54,N24,20.43,14.76,Haven,54,0.51,Ouroboros,Sigma,VII - Army,generic,true
55,N25,35.0,24.02,Nimbus,55,0.58,Phoenix,Tau,VIII - Holding Together,generic,false
56,N26,37.0,14.29,Conduit,56,0.65,Dragon,Tau,IX - Small Taming,generic,false
57,N27,42.01,4.7,Vertex,57,0.72,Lion,Tau,X - Treading,generic,false
58,N28,50.0,20.0,Hollow,58,0.79,Raven,Upsilon,XI - Peace,generic,false
59,N29,56.6,12.58,Radiance,59,0.86,Butterfly,Upsilon,XII - Standstill,generic,false
60,N30,65.73,6.77,Crest,60,0.93,Ouroboros,Upsilon,XIII - Fellowship,generic,false
61,N31,65.0,24.02,Dusk,61,0.3,Phoenix,Phi,XIV - Great Possession,generic,false
62,N32,74.43,20.89,Dawn,62,0.37,Dragon,Phi,XV - Modesty,generic,true
63,N33,85.24,20.43,Aether,63,0.44,Lion,Phi,XVI - Enthusiasm,generic,false
64,N34,75.98,35.0,Terminus,64,0.51,Raven,Chi,I - Creative,generic,false
65,N35,85.71,37.0,Origin,65,0.58,Butterfly,Chi,II - Receptive,generic,false
66,N36,95.3,42.01,Void,66,0.65,Ouroboros,Chi,III - Difficulty,generic,false"""


def load_lattice() -> pd.DataFrame:
    """Load and parse the node CSV."""
    df = pd.read_csv(io.StringIO(CSV_DATA))
    df['dormant'] = df['dormant'].map({'true': True, 'false': False}).fillna(False)
    return df


# ============================================================
# 2. GRAPH TOPOLOGY — EDGE GENERATION
# ============================================================

def build_edges(df: pd.DataFrame, 
                intra_cluster_radius: float = 25.0,
                nexus_radius: float = 40.0,
                generic_radius: float = 18.0) -> List[Tuple[int, int, float]]:
    """
    Generate edges based on proximity and structural rules:
    1. Nexus (C01) connects to all cluster heads (weight-1.0 nodes)
    2. Intra-guardian cluster: fully connected within each guardian group
    3. Generic mesh: connect to nearest neighbors within radius
    4. Cross-guardian bridges: connect nearest generic nodes between guardians
    """
    edges = []
    coords = df[['x', 'y']].values
    n = len(df)

    def dist(i, j):
        return np.sqrt((coords[i, 0] - coords[j, 0])**2 + 
                       (coords[i, 1] - coords[j, 1])**2)

    # 1. Nexus to cluster weight-1.0 nodes (the "throne" of each guardian)
    nexus_idx = df[df['node_id'] == 'C01'].index[0]
    throne_nodes = df[(df['type'] == 'cluster') & (df['weight'] == 1.0)].index
    for idx in throne_nodes:
        d = dist(nexus_idx, idx)
        edges.append((nexus_idx, idx, d))

    # 2. Nexus to all nodes within nexus_radius
    for i in range(n):
        if i == nexus_idx:
            continue
        d = dist(nexus_idx, i)
        if d <= nexus_radius:
            edges.append((nexus_idx, i, d))

    # 3. Intra-guardian connections
    guardians = df['guardian'].unique()
    for g in guardians:
        g_indices = df[df['guardian'] == g].index.tolist()
        for i_pos, i in enumerate(g_indices):
            for j in g_indices[i_pos + 1:]:
                d = dist(i, j)
                if d <= intra_cluster_radius:
                    edges.append((i, j, d))

    # 4. Intra-triad connections (fully connected within each triad)
    triads = df['triad'].unique()
    for tr in triads:
        tr_indices = df[df['triad'] == tr].index.tolist()
        for i_pos, i in enumerate(tr_indices):
            for j in tr_indices[i_pos + 1:]:
                d = dist(i, j)
                edges.append((i, j, d))

    # 5. Generic mesh nearest-neighbor connections
    generic_indices = df[df['type'] == 'generic'].index.tolist()
    for i in generic_indices:
        for j in generic_indices:
            if i >= j:
                continue
            d = dist(i, j)
            if d <= generic_radius:
                edges.append((i, j, d))

    # Deduplicate
    seen = set()
    unique_edges = []
    for i, j, d in edges:
        key = (min(i, j), max(i, j))
        if key not in seen:
            seen.add(key)
            unique_edges.append((i, j, d))

    return unique_edges


# ============================================================
# 3. STATE VARIABLE EXTRACTION FROM GRAPH
# ============================================================

@dataclass
class LatticeState:
    """Macro state variables derived from the node graph."""
    E: float        # Lattice energy (weighted sum of active nodes)
    N_density: float  # Active node density (fraction of non-dormant)
    tau: float      # Stability margin (guardian balance + connectivity)
    Phi: float      # Triple product
    active_count: int
    total_count: int
    guardian_balance: float  # How evenly distributed across guardians
    dormant_nodes: List[str]


def compute_lattice_state(df: pd.DataFrame, edges: list,
                          activation_threshold: float = 0.0) -> LatticeState:
    """
    Derive E, N, τ from the node graph.

    E = sum of weights for active (non-dormant) nodes, 
        weighted by inverse distance to nexus (central influence)
    N = active node count / total node count
    τ = guardian_balance * connectivity_ratio
        guardian_balance = 1 - std(guardian_weights) / mean(guardian_weights)
        connectivity_ratio = actual_edges / max_possible_edges for active nodes
    """
    nexus = df[df['node_id'] == 'C01'].iloc[0]
    cx, cy = nexus['x'], nexus['y']

    active = df[(df['dormant'] == False) & (df['weight'] > activation_threshold)]
    dormant = df[df['dormant'] == True]

    # E: energy — weighted by proximity to center
    distances = np.sqrt((active['x'] - cx)**2 + (active['y'] - cy)**2)
    max_dist = np.sqrt(cx**2 + cy**2)  # corner distance
    proximity = 1.0 - (distances / (max_dist + 1e-9))
    E = float(np.sum(active['weight'].values * proximity.values))

    # N: active node density
    N_density = len(active) / len(df) if len(df) > 0 else 0.0

    # τ: stability — guardian balance * connectivity
    guardian_weights = active.groupby('guardian')['weight'].sum()
    if len(guardian_weights) > 1:
        balance = 1.0 - (guardian_weights.std() / (guardian_weights.mean() + 1e-9))
        balance = max(0.0, balance)
    else:
        balance = 0.0

    active_ids = set(active.index)
    active_edge_count = sum(1 for i, j, _ in edges 
                           if i in active_ids and j in active_ids)
    max_edges = len(active_ids) * (len(active_ids) - 1) / 2
    connectivity = active_edge_count / max_edges if max_edges > 0 else 0.0

    tau = balance * (1.0 + connectivity)  # scale so τ can exceed 1

    # Scale to match ODE parameter ranges
    E_scaled = E * 0.15       # brings E into ~[0, 5] range
    N_scaled = N_density * 5  # brings N into ~[0, 5] range  
    tau_scaled = tau * 3      # brings τ into ~[0, 3] range

    Phi = E_scaled * N_scaled * tau_scaled

    return LatticeState(
        E=E_scaled,
        N_density=N_scaled,
        tau=tau_scaled,
        Phi=Phi,
        active_count=len(active),
        total_count=len(df),
        guardian_balance=balance,
        dormant_nodes=dormant['label'].tolist()
    )


# ============================================================
# 4. TOPOLOGY VISUALIZATION
# ============================================================

GUARDIAN_COLORS = {
    'Ouroboros': '#FFFFFF',
    'Phoenix': '#FF6B35',
    'Dragon': '#00E676',
    'Lion': '#FFD700',
    'Raven': '#7C4DFF',
    'Butterfly': '#00BCD4',
}

GUARDIAN_MARKERS = {
    'Ouroboros': '*',
    'Phoenix': '^',
    'Dragon': 'D',
    'Lion': 'p',
    'Raven': 'v',
    'Butterfly': 'h',
}


def plot_lattice_topology(df: pd.DataFrame, edges: list,
                          lattice_state: LatticeState,
                          title: str = "Sovereign Lattice — Node Topology",
                          save: bool = False):
    """Visualize the full lattice graph with guardian coloring and state overlay."""

    fig, ax = plt.subplots(1, 1, figsize=(14, 14))
    fig.patch.set_facecolor('#0a0a1a')
    ax.set_facecolor('#0a0a1a')

    # Draw edges
    coords = df[['x', 'y']].values
    active_set = set(df[df['dormant'] == False].index)

    for i, j, d in edges:
        x_vals = [coords[i, 0], coords[j, 0]]
        y_vals = [coords[i, 1], coords[j, 1]]
        both_active = i in active_set and j in active_set
        alpha = 0.25 if both_active else 0.08
        color = '#4fc3f7' if both_active else '#333333'
        ax.plot(x_vals, y_vals, color=color, linewidth=0.5, alpha=alpha)

    # Draw nodes
    for _, row in df.iterrows():
        guardian = row['guardian']
        color = GUARDIAN_COLORS.get(guardian, '#AAAAAA')
        marker = GUARDIAN_MARKERS.get(guardian, 'o')
        size = row['weight'] * 150 + 30
        alpha = 0.3 if row['dormant'] else 0.9
        edge_color = '#d9534f' if row['dormant'] else color

        ax.scatter(row['x'], row['y'],
                   c=color, s=size, marker=marker,
                   alpha=alpha, edgecolors=edge_color,
                   linewidths=1.5 if row['dormant'] else 0.5,
                   zorder=5)

        # Label
        fontsize = 7 if row['type'] == 'generic' else 9
        fontweight = 'bold' if row['type'] in ('central', 'cluster') else 'normal'
        ax.annotate(row['label'],
                    (row['x'], row['y']),
                    textcoords="offset points",
                    xytext=(0, 8),
                    fontsize=fontsize,
                    fontweight=fontweight,
                    color=color,
                    alpha=0.8 if not row['dormant'] else 0.4,
                    ha='center')

    # Nexus glow effect
    nexus = df[df['node_id'] == 'C01'].iloc[0]
    for r, a in [(12, 0.03), (8, 0.06), (4, 0.12)]:
        circle = plt.Circle((nexus['x'], nexus['y']), r,
                            color='#4fc3f7', alpha=a)
        ax.add_patch(circle)

    # Shell rings (concentric)
    shell_radii = [15, 25, 35, 42, 48]
    shell_labels = ['Core', 'Mirror', 'Triad', 'Envelope', 'Telemetry']
    shell_colors = ['#4fc3f7', '#00BCD4', '#4CAF50', '#CDDC39', '#FF9800']
    for r, label, color in zip(shell_radii, shell_labels, shell_colors):
        circle = plt.Circle((50, 50), r, fill=False,
                            edgecolor=color, linewidth=0.8, alpha=0.2,
                            linestyle='--')
        ax.add_patch(circle)

    # Legend
    legend_patches = [mpatches.Patch(color=c, label=g)
                      for g, c in GUARDIAN_COLORS.items()]
    legend_patches.append(mpatches.Patch(facecolor='none', edgecolor='#d9534f',
                                         linewidth=2, label='Dormant'))
    ax.legend(handles=legend_patches, loc='upper left',
              fontsize=9, facecolor='#0a0a1a', edgecolor='#333333',
              labelcolor='white', framealpha=0.8)

    # State overlay
    info_text = (
        f"E = {lattice_state.E:.2f}  |  "
        f"N = {lattice_state.N_density:.2f}  |  "
        f"τ = {lattice_state.tau:.2f}  |  "
        f"Φ = {lattice_state.Phi:.2f}\n"
        f"Active: {lattice_state.active_count}/{lattice_state.total_count}  |  "
        f"Guardian Balance: {lattice_state.guardian_balance:.2f}  |  "
        f"Dormant: {', '.join(lattice_state.dormant_nodes)}"
    )
    ax.text(50, -3, info_text, ha='center', va='top',
            fontsize=10, color='#4fc3f7', fontfamily='monospace',
            bbox=dict(boxstyle='round,pad=0.5', facecolor='#0a0a1a',
                      edgecolor='#4fc3f7', alpha=0.8))

    ax.set_xlim(-5, 105)
    ax.set_ylim(-8, 105)
    ax.set_aspect('equal')
    ax.axis('off')
    ax.set_title(title, color='white', fontsize=16, fontweight='bold', pad=20)

    plt.tight_layout()
    if save:
        plt.savefig('sovereign_lattice_topology.png', dpi=150,
                    bbox_inches='tight', facecolor='#0a0a1a')
        print("  Saved: sovereign_lattice_topology.png")
    plt.show()


# ============================================================
# 5. DORMANCY SIMULATION — WHAT IF NODES WAKE/SLEEP?
# ============================================================

def simulate_dormancy_scenarios(df: pd.DataFrame, edges: list):
    """
    Test how the lattice state variables change as nodes go dormant or wake up.
    This validates sensitivity of E, N, τ, Φ to network degradation.
    """
    scenarios = {
        'Baseline (4 dormant)': df['dormant'].copy(),
        'All active': pd.Series([False] * len(df)),
        'Phoenix offline': df['guardian'].eq('Phoenix') | df['dormant'],
        'Dragon offline': df['guardian'].eq('Dragon') | df['dormant'],
        'Half generic offline': df['dormant'].copy(),
        'Cascade failure (12 dormant)': df['dormant'].copy(),
    }

    # Half generic offline
    generic_idx = df[df['type'] == 'generic'].index.tolist()
    half_generic = scenarios['Half generic offline'].copy()
    for idx in generic_idx[::2]:
        half_generic.iloc[idx] = True
    scenarios['Half generic offline'] = half_generic

    # Cascade failure
    cascade = scenarios['Cascade failure (12 dormant)'].copy()
    np.random.seed(42)
    wake_indices = df[df['dormant'] == False].index.tolist()
    kill_indices = np.random.choice(wake_indices, size=12, replace=False)
    for idx in kill_indices:
        cascade.iloc[idx] = True
    scenarios['Cascade failure (12 dormant)'] = cascade

    print("\n" + "=" * 72)
    print("  DORMANCY SCENARIO ANALYSIS")
    print("=" * 72)
    print(f"  {'Scenario':<35} {'E':>6} {'N':>6} {'τ':>6} {'Φ':>8} {'Active':>7}")
    print("  " + "─" * 70)

    results = {}
    for name, dormant_series in scenarios.items():
        df_scenario = df.copy()
        df_scenario['dormant'] = dormant_series
        state = compute_lattice_state(df_scenario, edges)
        results[name] = state
        print(f"  {name:<35} {state.E:>6.2f} {state.N_density:>6.2f} "
              f"{state.tau:>6.2f} {state.Phi:>8.2f} {state.active_count:>4}/{state.total_count}")

    return results


# ============================================================
# 6. MAIN
# ============================================================

def main():
    print("Loading Sovereign Lattice node data...")
    df = load_lattice()
    print(f"  {len(df)} nodes loaded")
    print(f"  Guardians: {df['guardian'].nunique()} ({', '.join(df['guardian'].unique())})")
    print(f"  Triads: {df['triad'].nunique()}")
    print(f"  Dormant: {df['dormant'].sum()} nodes "
          f"({', '.join(df[df['dormant']]['label'].tolist())})")
    print(f"  Types: {dict(df['type'].value_counts())}")

    print("\nBuilding edge topology...")
    edges = build_edges(df)
    print(f"  {len(edges)} edges generated")

    print("\nComputing lattice state variables...")
    state = compute_lattice_state(df, edges)
    print(f"  E  (lattice energy):    {state.E:.3f}")
    print(f"  N  (node density):      {state.N_density:.3f}")
    print(f"  τ  (stability margin):  {state.tau:.3f}")
    print(f"  Φ  (triple product):    {state.Phi:.3f}")
    print(f"  Guardian balance:       {state.guardian_balance:.3f}")

    C_Nexus = 8.0
    print(f"\n  Fusion status: ", end="")
    if state.Phi >= C_Nexus:
        print(f"FUSION (Φ = {state.Phi:.2f} ≥ {C_Nexus})")
    else:
        print(f"BUILD (Φ = {state.Phi:.2f} < {C_Nexus})")

    # Run dormancy scenarios
    simulate_dormancy_scenarios(df, edges)

    # Visualize
    print("\nRendering lattice topology...")
    plot_lattice_topology(df, edges, state, save=True)

    # Return state for piping into ODE simulation
    print(f"\n  Initial conditions for ODE: x0 = [{state.E:.3f}, "
          f"{state.N_density:.3f}, {state.tau:.3f}]")
    return state


if __name__ == "__main__":
    main()