export const MAX_STEPS = 50;
const WINDOW = 5;
export function detectAttractor(state) {
    const history = state.history;
    if (history.length < WINDOW * 2) {
        return false;
    }
    const recent = history.slice(-WINDOW);
    const previous = history.slice(-WINDOW * 2, -WINDOW);
    return recent.join(",") === previous.join(",");
}
