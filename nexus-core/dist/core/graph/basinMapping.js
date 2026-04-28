import { simulate } from "./simulate.js";
function toGraphNodeMap(nodes) {
    return new Map(nodes.map((node) => [
        node.node_id,
        { node_id: node.node_id, weight: node.weight, dormant: node.dormant }
    ]));
}
function resolveAttractorKey(result) {
    if (result.type !== "ATTRACTOR") {
        return { key: "TRANSIENT", cycle: [] };
    }
    const cycle = result.state.history.slice(-5);
    return { key: cycle.join("->"), cycle };
}
export function mapBasins(nodes, adj, nodeMap = toGraphNodeMap(nodes)) {
    const grouped = new Map();
    for (const node of nodes) {
        const result = simulate(node.node_id, adj, nodeMap);
        const { key, cycle } = resolveAttractorKey(result);
        const basin = grouped.get(key) ?? {
            attractorKey: key,
            attractorCycle: cycle,
            members: []
        };
        basin.members.push(node.node_id);
        grouped.set(key, basin);
    }
    return [...grouped.values()].sort((a, b) => b.members.length - a.members.length);
}
