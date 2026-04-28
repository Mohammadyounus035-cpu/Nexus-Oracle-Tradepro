import { validateGraph } from "../validateGraph.js";
import { mapBasins } from "./basinMapping.js";
import { buildAdjacency, generateEdges, validateEdges } from "./edges.js";
import { simulate } from "./simulate.js";
function toGraphNode(node) {
    return {
        node_id: node.node_id,
        weight: node.weight,
        dormant: node.dormant
    };
}
function toSerializableAdjacency(adj) {
    return Object.fromEntries(adj.entries());
}
export function runFullAnalysis(nodes) {
    validateGraph(nodes);
    const edges = generateEdges(nodes);
    validateEdges(edges, nodes);
    const adj = buildAdjacency(edges);
    const nodeMap = new Map(nodes.map((node) => [node.node_id, toGraphNode(node)]));
    const simulations = nodes.map((node) => ({
        start: node.node_id,
        result: simulate(node.node_id, adj, nodeMap)
    }));
    const basins = mapBasins(nodes, adj, nodeMap);
    return {
        nodes,
        edges,
        adj: toSerializableAdjacency(adj),
        simulations,
        basins
    };
}
