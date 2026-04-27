export type Env = "preview" | "production";
export type Mode = "streaming" | "non-streaming";
export type Risk = "low" | "medium" | "high";
export type Decision = "model" | "defer" | "reject";
export type Auth = "protected" | "bypass";
export const ENVS = ["preview", "production"] as const;
export const MODES = ["streaming", "non-streaming"] as const;
export const RISKS = ["low", "medium", "high"] as const;
export const DECISIONS = ["model", "bypass", "reject"] as const;
export const AUTHS = ["protected", "bypass"] as const;

export type Env = (typeof ENVS)[number];
export type Mode = (typeof MODES)[number];
export type Risk = (typeof RISKS)[number];
export type Decision = (typeof DECISIONS)[number];
export type Auth = (typeof AUTHS)[number];

export type Vector = {
  env: Env;
  mode: Mode;
  risk: Risk;
  decision: Decision;
  auth: Auth;
};

export type AllocatorResponse = {
  headers: Record<string, string>;
  autoApproved: boolean;
  apiCalls: number;
  latency: number;
  stream: boolean;
  deferred: boolean;
};

export const ENVS: Env[] = ["preview", "production"];
export const MODES: Mode[] = ["streaming", "non-streaming"];
export const RISKS: Risk[] = ["low", "medium", "high"];
export const DECISIONS: Decision[] = ["model", "defer", "reject"];
export const AUTHS: Auth[] = ["protected", "bypass"];
export type Metrics = {
  latency: number;
  cost: number;
  safety: number;
};

export type CanonicalState = {
  vector: Vector;
  decision: Decision;
  metrics: Metrics;
  proof: {
    hash: string;
    invariantsPassed: boolean;
  };
};
