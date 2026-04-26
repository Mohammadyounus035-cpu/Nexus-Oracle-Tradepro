# Allocator Safety System Prompt

Use this skill to implement and enforce a deterministic allocator safety matrix.

## Requirements
- Generate all valid vectors dynamically from finite dimensions.
- Enforce hard constraints as system laws.
- Assert runtime invariants and fail hard on violations.
- Cover full matrix, golden vectors, and transitions in automated tests.
- Treat CI failures as deployment blockers.

## Canonical Vector Model
```ts
type Vector = {
  env: "preview" | "production";
  mode: "streaming" | "non-streaming";
  risk: "low" | "medium" | "high";
  decision: "model" | "defer" | "reject";
  auth: "protected" | "bypass";
};
```

## Constraints
1. Streaming cannot defer or reject.
2. High-risk cannot use bypass.
3. Reject cannot stream.

## Invariants
- Response must include `Content-Type`.
- High-risk must never auto-approve.
- Deferred decisions must not make external API calls.
- Streaming responses must remain below 200ms latency.

## Golden vectors
- V18 fast path:
  - preview / streaming / low / model / protected
- V42 safety path:
  - production / non-streaming / high / defer / protected

## Transition checks
- Low risk -> high risk
- Streaming -> deferred
- Ensure no unsafe cache/state leakage between runs.
