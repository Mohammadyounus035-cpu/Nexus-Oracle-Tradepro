export function computeOutput(x, anchor) {
    return Math.exp(x - anchor);
}
export function computeDrift(ctx) {
    return Math.abs(ctx.input - ctx.anchor);
}
export function transition(state, ctx, input) {
    switch (state) {
        case "HOLD": {
            if (input !== undefined && input !== ctx.anchor) {
                const nextCtx = {
                    ...ctx,
                    input,
                    output: computeOutput(input, ctx.anchor),
                    drift: computeDrift({ ...ctx, input }),
                };
                return { state: "ACTIVE", ctx: nextCtx };
            }
            return { state, ctx };
        }
        case "ACTIVE": {
            if (ctx.drift === 0) {
                return { state: "HOLD", ctx };
            }
            return { state, ctx };
        }
        case "VERIFYING":
            return { state: "HOLD", ctx };
        case "ERROR":
            return { state, ctx };
        default:
            return { state: "ERROR", ctx };
    }
}
