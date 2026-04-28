export function assertRuntimeInvariant(current, next) {
    if (next.dormant) {
        throw new Error(`Entered dormant node: ${next.node_id}`);
    }
    if (next.weight < current.weight - 0.3) {
        throw new Error(`Unstable transition: ${current.node_id} -> ${next.node_id}`);
    }
}
