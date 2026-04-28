import { detectAttractor, MAX_STEPS } from "./attractor.js";
import { assertRuntimeInvariant } from "./runtimeInvariant.js";
import { step } from "./step.js";
export function simulate(start, adj, nodeMap) {
    if (!nodeMap.has(start)) {
        throw new Error(`Unknown start node: ${start}`);
    }
    let state = {
        current: start,
        steps: 0,
        history: [start]
    };
    for (let i = 0; i < MAX_STEPS; i += 1) {
        const currentNode = nodeMap.get(state.current);
        if (!currentNode) {
            throw new Error(`Unknown current node: ${state.current}`);
        }
        const nextState = step(state, adj, nodeMap);
        const nextNode = nodeMap.get(nextState.current);
        if (!nextNode) {
            throw new Error(`Unknown next node: ${nextState.current}`);
        }
        assertRuntimeInvariant(currentNode, nextNode);
        state = nextState;
        if (detectAttractor(state)) {
            return { type: "ATTRACTOR", state };
        }
    }
    return { type: "TRANSIENT", state };
}
