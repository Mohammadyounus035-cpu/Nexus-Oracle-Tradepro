import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import Circle, FancyBboxPatch, Rectangle
import numpy as np

# Set dark theme for technical look
plt.style.use('dark_background')
fig = plt.figure(figsize=(24, 32))
plt.rcParams['font.family'] = 'monospace'

# Colors from the dashboard
COLORS = {
    'core': '#00d4ff',
    'mirror': '#00e5c9',
    'triad': '#00ff88',
    'envelope': '#ccff00',
    'telemetry': '#ffaa00',
    'threshold': '#ff4444',
    'bg': '#050210',
    'text': '#ffffff',
    'accent': '#9d7aff'
}

# ---------------------------------------------------------
# PANEL A: LATTICE TOPOLOGY (Upper Center)
# ---------------------------------------------------------
ax1 = fig.add_axes([0.1, 0.7, 0.8, 0.25])
ax1.set_xlim(-15, 15)
ax1.set_ylim(-15, 15)
ax1.set_aspect('equal')
ax1.axis('off')

shells = [
    {'name': 'CORE', 'r': 2, 'color': COLORS['core'], 'nodes': 6},
    {'name': 'MIRROR', 'r': 4, 'color': COLORS['mirror'], 'nodes': 12},
    {'name': 'TRIAD', 'r': 6, 'color': COLORS['triad'], 'nodes': 18},
    {'name': 'ENVELOPE', 'r': 8, 'color': COLORS['envelope'], 'nodes': 24},
    {'name': 'TELEMETRY', 'r': 10, 'color': COLORS['telemetry'], 'nodes': 16},
    {'name': 'THRESHOLD', 'r': 12, 'color': COLORS['threshold'], 'nodes': 12}
]

# Draw orbital paths
for shell in shells:
    circ = Circle((0, 0), shell['r'], fill=False, color=shell['color'], linewidth=1.5, alpha=0.5, linestyle='--')
    ax1.add_patch(circ)
    # Draw nodes
    for i in range(shell['nodes']):
        angle = 2 * np.pi * i / shell['nodes']
        x = shell['r'] * np.cos(angle)
        y = shell['r'] * np.sin(angle)
        ax1.plot(x, y, 'o', color=shell['color'], markersize=4, alpha=0.8)

# Center IH
ax1.plot(0, 0, 'o', color=COLORS['core'], markersize=15, alpha=0.9)
ax1.text(0, 0, 'IH\nL0_REF', ha='center', va='center', fontsize=10, fontweight='bold', color='white')

# Labeling
ax1.text(0, 14, 'SOVEREIGN LATTICE - ENGINEERING TOPOLOGY', ha='center', fontsize=18, fontweight='bold')
ax1.text(0, 13.2, 'Distributed Coherence Engine for Multi-Agent Autonomous Systems', ha='center', fontsize=12, alpha=0.7)

# Legend Box
leg_text = (
    "OBSERVED METRICS\n"
    "NODES (ACTIVE) ......... 167\n"
    "LOOP SCOPE ............ 0.28\n"
    "AVG ENERGY ............ 0.63\n"
    "COHERENCE ............. 0.71\n"
    "COMPLEXITY ............ 0.58\n"
    "FIELD STABILITY ....... 87%"
)
ax1.text(-12, -12, leg_text, fontsize=10, color='cyan', bbox=dict(boxstyle='round,pad=0.5', facecolor='#0a0a20', alpha=0.8))

map_text = (
    "REAL-WORLD MAPPING\n"
    "CORE      -> NVIDIA DGX / Tesla FSD Computer\n"
    "MIRROR    -> Waymo Replica Sets / Game State Sync\n"
    "TRIAD     -> Raft/PBFT Consensus Groups\n"
    "ENVELOPE  -> Perception Filter / LOD Manager\n"
    "TELEMETRY -> Sensor Fusion Gateway (LiDAR/Cam/Radar)\n"
    "THRESHOLD -> Safety Monitor / Dead Man's Switch"
)
ax1.text(4, -12, map_text, fontsize=10, color='#ccff00', bbox=dict(boxstyle='round,pad=0.5', facecolor='#0a0a20', alpha=0.8))

# ---------------------------------------------------------
# PANEL B: FUNCTION STACK & DRIFT (Middle)
# ---------------------------------------------------------
# Function Stack (Left)
ax2 = fig.add_axes([0.1, 0.45, 0.35, 0.2])
ax2.axis('off')
ax2.text(0.1, 0.95, 'FUNCTION STACK - L4_PROTECTION', fontsize=14, fontweight='bold', color=COLORS['core'])

funcs = [
    ('STABILIZE', 'Hardened Supermajority', 'PBFT + HotStuff\nByzantine Fault Tolerance\n2f+1 quorum consensus', COLORS['core']),
    ('BOOST', 'Phoenix Reputation Ring', 'EigenTrust / PageRank\nSelf-healing node scoring\nSybil resistance via stake', COLORS['mirror']),
    ('SIMULATE', 'Sabr Loop Scenarios', 'Neural Radiance Fields\nWorld models (Sora/Dreamer)\nCounterfactual rollout', COLORS['triad']),
    ('TRACE', 'Canonicalization & Lineage', 'Merkle DAG + Vector Clocks\nCRDT merge strategies\nProvenance tracking', COLORS['envelope']),
    ('LOCK', 'Geo-Spatial / AR Anchor', 'HoloLens Spatial Anchors\nNVIDIA Omniverse USD\nGPS-RTK + Visual-Inertial', COLORS['threshold'])
]

y_pos = 0.8
for name, sub, tech, color in funcs:
    ax2.add_patch(FancyBboxPatch((0.05, y_pos-0.12), 0.9, 0.15, boxstyle="round,pad=0.02", facecolor=color, alpha=0.1, edgecolor=color, linewidth=2))
    ax2.text(0.08, y_pos-0.03, name, fontsize=11, fontweight='bold', color=color)
    ax2.text(0.08, y_pos-0.08, sub, fontsize=8, color=color, alpha=0.8)
    ax2.text(0.5, y_pos-0.045, tech, fontsize=8, color='white', alpha=0.9)
    y_pos -= 0.18

# Drift & Phase Lock (Right)
ax3 = fig.add_axes([0.55, 0.45, 0.35, 0.2])
ax3.axis('off')
ax3.text(0.3, 0.95, 'DRIFT DETELOGY & PHASE-LOCK', fontsize=14, fontweight='bold', color=COLORS['core'])

# Drift Gauge
t = np.linspace(0, np.pi, 100)
ax3.plot(0.5 + 0.4*np.cos(t), 0.65 + 0.4*np.sin(t), color='#333', linewidth=40)
ax3.plot(0.5 + 0.4*np.cos(t), 0.65 + 0.4*np.sin(t), color='#6b6b00', linewidth=40, alpha=0.5)
ax3.text(0.5, 0.35, 'DRIFT: 0.000%', ha='center', fontsize=18, fontweight='bold', color='#ccff00')
ax3.text(0.5, 0.28, 'PHASE-LOCK: STABLE', ha='center', fontsize=10, color='white', alpha=0.7)
ax3.text(0.5, 0.85, 'L4_FAN DRIFT MONITOR', ha='center', fontsize=10, color='white', alpha=0.5)

# Telemetry list
tele_text = (
    "TELEMETRY STREAM\n"
    "----------------\n"
    "L0_TRACK ...... CONFIRMED\n"
    "PARALLEL ...... ALIGNED\n"
    "CONSENSUS ..... 2f+1 (67/100)\n"
    "LATENCY ....... 12ms p99\n"
    "THROUGHPUT .... 47K TPS\n"
    "REPLICA_LAG ... 0.3ms\n"
    "SABR_LOOPS .... 1,247/min\n"
    "PHOENIX_SCORE . 0.94\n"
    "FIELD_STAB .... 87%"
)
ax3.text(0.1, -0.4, tele_text, fontsize=9, color='white', bbox=dict(boxstyle='square', facecolor='black', alpha=0.3, edgecolor='cyan'))

# ---------------------------------------------------------
# PANEL C: CROSS-DOMAIN INTEGRATION (Bottom)
# ---------------------------------------------------------
ax4 = fig.add_axes([0.1, 0.2, 0.8, 0.2])
ax4.axis('off')
ax4.text(0.5, 0.95, 'CROSS-DOMAIN INTEGRATION MAP', ha='center', fontsize=16, fontweight='bold', color='white')

# Categories
domains = [
    {'name': 'GAMING / METAVERSE', 'x': 0.1, 'color': '#ff00ff', 'items': ['Unreal Engine 5\nNanite + Lumen', 'Omniverse\nUSD Pipeline', 'Spatial OS\nPersistent Worlds', 'Neural LOD\nGaNeRF Streaming'], 'desc': 'ENVELOPE + TELEMETRY\nReal-time state sync\nPlayer consensus on world state'},
    {'name': 'NVIDIA / AI COMPUTE', 'x': 0.4, 'color': '#76b900', 'items': ['H100 / B200\nTensor Cores', 'CUDA-Q\nQuantum-Classical', 'Isaac Sim\nDigital Twin', 'NeMo Guardrails\nAlignment Layer'], 'desc': 'CORE + MIRROR\nInference orchestration\nModel replica management'},
    {'name': 'WAYMO / AUTONOMY', 'x': 0.7, 'color': '#4285f4', 'items': ['FSD Computer\nOrin / Thor', 'LiDAR-Cam Fusion\nBird\'s Eye View', 'ChauffeurNet\nBehavior Cloning', 'Safety Filter\nMRC + ODD Monitor'], 'desc': 'THRESHOLD + TRIAD\nSafety-critical consensus\nGeofenced operation'}
]

for d in domains:
    ax4.add_patch(Rectangle((d['x'], 0.82), 0.2, 0.05, facecolor=d['color'], alpha=0.3, edgecolor=d['color']))
    ax4.text(d['x']+0.1, 0.84, d['name'], ha='center', fontweight='bold', fontsize=10, color=d['color'])
    
    y = 0.7
    for item in d['items']:
        ax4.add_patch(Rectangle((d['x'], y), 0.2, 0.08, color='#151530', alpha=0.8, ec='gray'))
        ax4.text(d['x']+0.1, y+0.03, item, ha='center', va='center', fontsize=8, color='white')
        y -= 0.1
        
    ax4.text(d['x']+0.1, 0.3, d['desc'], ha='center', va='center', fontsize=8, color=d['color'], style='italic')

# Connections
ax4.annotate('', xy=(0.3, 0.75), xytext=(0.4, 0.75), arrowprops=dict(arrowstyle='<->', color='gray'))
ax4.text(0.35, 0.77, 'USD Exchange\nDigital Twin Sync', ha='center', fontsize=8, color='white', alpha=0.6)

ax4.annotate('', xy=(0.6, 0.75), xytext=(0.7, 0.75), arrowprops=dict(arrowstyle='<->', color='gray'))
ax4.text(0.65, 0.77, 'Safety Validation\nSim-to-Real Transfer', ha='center', fontsize=8, color='white', alpha=0.6)

# ---------------------------------------------------------
# PANEL D: GLOBAL DEPLOYMENT (Footer)
# ---------------------------------------------------------
ax5 = fig.add_axes([0.1, 0.05, 0.8, 0.12])
ax5.axis('off')
ax5.text(0.5, 0.95, 'GLOBAL DEPLOYMENT ARCHITECTURE', ha='center', fontsize=14, fontweight='bold', color='white')

# Simple planet map sketch with nodes
locations = [
    (0.2, 0.5, 'US-WEST\n28n | L:82%'), (0.35, 0.55, 'US-EAST\n24n | L:76%'),
    (0.4, 0.3, 'LATAM\n15n | L:65%'), (0.55, 0.65, 'EU-WEST\n22n | L:71%'),
    (0.6, 0.5, 'EU-CENT\n18n | L:68%'), (0.65, 0.3, 'MENA\n10n | L:62%'),
    (0.8, 0.7, 'APAC-N\n30n | L:85%'), (0.85, 0.45, 'APAC-S\n20n | L:74%')
]

for x, y, label in locations:
    ax5.plot(x, y, 'o', color=COLORS['telemetry'], markersize=15, alpha=0.5)
    ax5.text(x, y-0.1, label, ha='center', fontsize=7, color='white')

# Connections between regions
for i in range(len(locations)-1):
    ax5.plot([locations[i][0], locations[i+1][0]], [locations[i][1], locations[i+1][1]], color='gray', alpha=0.2, lw=1)

# Market Text
m_text = (
    "MARKET PROJECTIONS 2026-2030\n"
    "---------------------------\n"
    "Autonomous Vehicle AI -> $78B (CAGR 31%)\n"
    "Cloud Gaming / Metaverse -> $92B (CAGR 28%)\n"
    "AI Training Compute   -> $312B (CAGR 42%)\n"
    "Digital Twin / Sim    -> $48B (CAGR 35%)\n"
    "Spatial Computing     -> $198B (CAGR 44%)\n\n"
    "LATTICE TAM CAPTURE: $728B by 2030\n"
    "Node licensing + consensus fees + telemetry monetization"
)
ax5.text(0, 0, m_text, fontsize=8, color='white', bbox=dict(boxstyle='square', facecolor='#050518', alpha=0.8, edgecolor='#ffaa00'))

deploy_model = (
    "DEPLOYMENT MODEL\n"
    "----------------\n"
    "TIER 1: Sovereign Cloud (Gov/Defense)\n"
    "        Air-gapped lattice, THRESHOLD-hardened\n"
    "TIER 2: Enterprise Edge (Waymo, Tesla, NVIDIA)\n"
    "        Hybrid cloud-edge, MIRROR replication\n"
    "TIER 3: Consumer / Gaming Mesh\n"
    "        Lightweight nodes, ENVELOPE filtering\n"
    "TIER 4: Developer / Research\n"
    "        SIMULATE-heavy, Sabr Loop sandbox"
)
ax5.text(0.6, 0, deploy_model, fontsize=8, color='white', bbox=dict(boxstyle='square', facecolor='#050518', alpha=0.8, edgecolor='#ccff00'))

plt.savefig('sovereign_lattice_engineering_topology.png', dpi=150, facecolor=COLORS['bg'])
plt.close()
